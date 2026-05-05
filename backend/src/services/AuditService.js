const { AuditRepository, AuditItemRepository, UserRepository } = require('../repositories');

class AuditService {
  constructor() {
    this.auditRepository = new AuditRepository();
    this.auditItemRepository = new AuditItemRepository();
    this.userRepository = new UserRepository();
  }

  async createAudit(auditData, createdBy) {
    const { title, description, status, scheduled_visit_date } = auditData;

    this.validateAuditData({ title, status, scheduled_visit_date });

    const user = await this.userRepository.getById(createdBy);
    if (!user) {
      throw new Error('Usuario creador no encontrado');
    }

    const validStatuses = ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'];
    const finalStatus = validStatuses.includes(status) ? status : 'BORRADOR';

    const visitDate = this.validateVisitDate(scheduled_visit_date);

    const audit = await this.auditRepository.create({
      title: this.sanitizeTitle(title),
      description: description ? description.trim() : null,
      status: finalStatus,
      scheduled_visit_date: visitDate,
      created_by: createdBy
    });

    await this.createAuditItems(audit.id);

    return await this.getAuditById(audit.id);
  }

  async getAuditById(auditId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const audit = await this.auditRepository.getWithDetails(auditId);
    if (!audit) {
      throw new Error('Auditoría no encontrada');
    }

    const items = await this.auditItemRepository.getByAuditId(auditId);
    const summary = await this.auditItemRepository.getAuditSummary(auditId);
    const scoreByCategory = await this.auditItemRepository.getAuditScoreByCategory(auditId);

    return {
      ...audit,
      items,
      summary,
      scoreByCategory,
      concept: this.calculateConcept(summary.average_score || 0)
    };
  }

  async getAllAudits(filters = {}) {
    const { status, createdBy, assignedTo, dateRange, search } = filters;

    try {
      let audits;

      if (status) {
        audits = await this.auditRepository.getByStatus(status);
      } else if (createdBy) {
        audits = await this.auditRepository.getAll({ created_by: createdBy }, 'created_at DESC');
      } else if (assignedTo) {
        audits = await this.auditRepository.getAssignedToUser(assignedTo);
      } else if (dateRange) {
        audits = await this.auditRepository.getByDateRange(dateRange.start, dateRange.end);
      } else if (search) {
        audits = await this.auditRepository.searchByTitle(search);
      } else {
        audits = await this.auditRepository.getWithCreatedBy();
      }

      return await Promise.all(
        audits.map(async (audit) => {
          const summary = await this.auditItemRepository.getAuditSummary(audit.id);
          return {
            ...audit,
            summary,
            concept: this.calculateConcept(summary.average_score || 0)
          };
        })
      );
    } catch (error) {
      throw new Error('Error al obtener auditorías: ' + error.message);
    }
  }

  async updateAudit(auditId, updateData, userId) {
    const { title, description, status, scheduled_visit_date } = updateData;

    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const existingAudit = await this.auditRepository.getById(auditId);
    if (!existingAudit) {
      throw new Error('Auditoría no encontrada');
    }

    this.validateAuditData({ title, status, scheduled_visit_date });

    const updateFields = {};
    if (title) updateFields.title = this.sanitizeTitle(title);
    if (description !== undefined) updateFields.description = description.trim() || null;
    if (status) {
      const validStatuses = ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'];
      if (!validStatuses.includes(status)) {
        throw new Error('Estado no válido');
      }
      updateFields.status = status;
    }
    if (scheduled_visit_date !== undefined) {
      updateFields.scheduled_visit_date = this.validateVisitDate(scheduled_visit_date);
    }

    await this.auditRepository.update(auditId, updateFields);
    return await this.getAuditById(auditId);
  }

  async deleteAudit(auditId, userId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const audit = await this.auditRepository.getById(auditId);
    if (!audit) {
      throw new Error('Auditoría no encontrada');
    }

    if (audit.created_by !== userId) {
      throw new Error('No autorizado para eliminar esta auditoría');
    }

    await this.auditItemRepository.deleteByAuditId(auditId);
    await this.auditRepository.delete(auditId);

    return { message: 'Auditoría eliminada correctamente' };
  }

  async updateAuditScores(auditId, items, userId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const audit = await this.auditRepository.getById(auditId);
    if (!audit) {
      throw new Error('Auditoría no encontrada');
    }

    this.validateAuditItems(items);

    await this.auditItemRepository.updateScores(auditId, items);

    const summary = await this.auditItemRepository.getAuditSummary(auditId);
    const newStatus = this.determineAuditStatus(summary.average_score || 0);
    
    await this.auditRepository.updateStatus(auditId, newStatus);

    return await this.getAuditById(auditId);
  }

  async assignAudit(auditId, userId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const audit = await this.auditRepository.getById(auditId);
    if (!audit) {
      throw new Error('Auditoría no encontrada');
    }

    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.role !== 'AUDITOR') {
      throw new Error('Solo los auditores pueden ser asignados a auditorías');
    }

    const assignment = await this.auditRepository.create({
      audit_id: auditId,
      user_id: userId
    });

    return { message: 'Auditoría asignada correctamente', assignment };
  }

  async unassignAudit(auditId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    await this.auditRepository.deleteByAuditId(auditId);
    return { message: 'Asignación eliminada correctamente' };
  }

  async getAuditStats() {
    const auditStats = await this.auditRepository.getAuditStats();
    const monthlyStats = await this.auditRepository.getAuditsByMonth();

    return {
      byStatus: auditStats,
      byMonth: monthlyStats
    };
  }

  validateAuditData({ title, status, scheduled_visit_date }) {
    if (!title || title.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }

    if (status) {
      const validStatuses = ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'];
      if (!validStatuses.includes(status)) {
        throw new Error('Estado no válido');
      }
    }

    if (scheduled_visit_date && !this.isValidDate(scheduled_visit_date)) {
      throw new Error('Fecha de visita inválida');
    }
  }

  validateAuditItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Se deben proporcionar items de auditoría');
    }

    for (const item of items) {
      if (!item.code || !item.score) {
        throw new Error('Cada item debe tener código y puntaje');
      }

      if (item.score < 0 || item.score > 100) {
        throw new Error('El puntaje debe estar entre 0 y 100');
      }
    }
  }

  validateVisitDate(date) {
    if (!date) return null;
    
    if (!this.isValidDate(date)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    const visitDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (visitDate < today) {
      throw new Error('La fecha de visita no puede ser anterior a hoy');
    }

    return date;
  }

  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  sanitizeTitle(title) {
    return title.trim().replace(/\s+/g, ' ');
  }

  calculateConcept(averageScore) {
    if (averageScore >= 90) return 'Favorable';
    if (averageScore >= 60) return 'Favorable con requerimiento';
    return 'Desfavorable';
  }

  determineAuditStatus(averageScore) {
    if (averageScore >= 90) return 'APROBADO';
    if (averageScore >= 60) return 'ENVIADO';
    return 'RECHAZADO';
  }

  async createAuditItems(auditId) {
    const BASE_ITEMS = [
      { code: '1.1', label: 'Localización y diseño', weight: 2, category: 'INSTALACIONES FÍSICAS' },
      { code: '1.2', label: 'Condiciones de pisos y paredes', weight: 2, category: 'INSTALACIONES FÍSICAS' },
      { code: '1.3', label: 'Techos, iluminación y ventilación', weight: 2, category: 'INSTALACIONES FÍSICAS' },
      { code: '1.4', label: 'Instalaciones sanitaria', weight: 4, category: 'INSTALACIONES FÍSICAS' },
      { code: '2.1', label: 'Condiciones de equipos y utensilios', weight: 5, category: 'EQUIPOS Y UTENSILIOS' },
      { code: '2.2', label: 'Superficies de contacto con el alimento', weight: 7, category: 'EQUIPOS Y UTENSILIOS' },
      { code: '3.1', label: 'Estado de salud', weight: 7, category: 'PERSONAL MANIPULADOR' },
      { code: '3.2', label: 'Reconocimiento médico', weight: 2, category: 'PERSONAL MANIPULADOR' },
      { code: '3.3', label: 'Prácticas higiénicas', weight: 7, category: 'PERSONAL MANIPULADOR' },
      { code: '3.4', label: 'Educación y capacitación', weight: 4, category: 'PERSONAL MANIPULADOR' },
      { code: '4.1', label: 'Control de materia prima', weight: 5, category: 'REQUISITOS HIGIÉNICOS' },
      { code: '4.2', label: 'Prevención de la contaminación cruzada', weight: 9, category: 'REQUISITOS HIGIÉNICOS' },
      { code: '4.3', label: 'Manejo de temperaturas', weight: 7, category: 'REQUISITOS HIGIÉNICOS' },
      { code: '4.4', label: 'Condiciones de almacenamiento', weight: 4, category: 'REQUISITOS HIGIÉNICOS' },
      { code: '5.1', label: 'Suministro y calidad de agua potable', weight: 7, category: 'SANEAMIENTO' },
      { code: '5.2', label: 'Residuos líquidos', weight: 4, category: 'SANEAMIENTO' },
      { code: '5.3', label: 'Residuos sólidos', weight: 4, category: 'SANEAMIENTO' },
      { code: '5.4', label: 'Control integrado de plagas', weight: 9, category: 'SANEAMIENTO' },
      { code: '5.5', label: 'Limpieza y desinfección de áreas, equipos y utensilios', weight: 7, category: 'SANEAMIENTO' },
      { code: '5.6', label: 'Soportes documentales de saneamiento', weight: 2, category: 'SANEAMIENTO' },
    ];

    await this.auditItemRepository.createBulkItems(auditId, BASE_ITEMS);
  }
}

module.exports = AuditService;
