class AuditDTO {
  static toResponse(audit) {
    if (!audit) return null;

    return {
      id: audit.id,
      title: audit.title,
      description: audit.description,
      status: audit.status,
      scheduled_visit_date: audit.scheduled_visit_date,
      created_by: audit.created_by,
      created_by_name: audit.created_by_name,
      created_at: audit.created_at,
      updated_at: audit.updated_at,
      concept: audit.concept || 'Sin calificar'
    };
  }

  static toDetailedResponse(audit) {
    if (!audit) return null;

    return {
      id: audit.id,
      title: audit.title,
      description: audit.description,
      status: audit.status,
      scheduled_visit_date: audit.scheduled_visit_date,
      created_by: audit.created_by,
      created_by_name: audit.created_by_name,
      created_by_email: audit.created_by_email,
      created_by_role: audit.created_by_role,
      created_at: audit.created_at,
      updated_at: audit.updated_at,
      concept: audit.concept || 'Sin calificar',
      summary: audit.summary || this.getDefaultSummary(),
      score_by_category: audit.score_by_category || [],
      items_count: audit.items_count || 0,
      evidences_count: audit.evidences_count || 0,
      signatures_count: audit.signatures_count || 0,
      status_display: this.getStatusDisplay(audit.status),
      progress: this.calculateProgress(audit.summary),
      can_edit: this.canEditAudit(audit),
      can_delete: this.canDeleteAudit(audit)
    };
  }

  static toListResponse(audits) {
    if (!Array.isArray(audits)) return [];

    return audits.map(audit => ({
      ...this.toResponse(audit),
      summary: audit.summary || this.getDefaultSummary(),
      progress: this.calculateProgress(audit.summary),
      status_display: this.getStatusDisplay(audit.status),
      items_count: audit.items_count || 0,
      evidences_count: audit.evidences_count || 0
    }));
  }

  static toCreateResponse(audit) {
    if (!audit) return null;

    return {
      id: audit.id,
      title: audit.title,
      status: audit.status,
      created_at: audit.created_at,
      message: 'Auditoría creada exitosamente',
      items_created: audit.items_count || 0
    };
  }

  static toUpdateResponse(audit) {
    if (!audit) return null;

    return {
      id: audit.id,
      title: audit.title,
      status: audit.status,
      updated_at: audit.updated_at,
      message: 'Auditoría actualizada exitosamente'
    };
  }

  static toScoreUpdateResponse(audit, updatedItems) {
    if (!audit) return null;

    return {
      id: audit.id,
      status: audit.status,
      concept: audit.concept,
      summary: audit.summary,
      updated_items: updatedItems.length,
      message: 'Puntajes actualizados exitosamente'
    };
  }

  static toStatsResponse(stats) {
    if (!stats) return null;

    return {
      by_status: stats.byStatus?.map(stat => ({
        status: stat.status,
        count: stat.count,
        display_name: this.getStatusDisplay(stat.status),
        recent_count: stat.recent_count || 0
      })) || [],
      by_month: stats.byMonth?.map(stat => ({
        month: parseInt(stat.month),
        month_name: this.getMonthName(parseInt(stat.month)),
        count: stat.count
      })) || [],
      total_audits: stats.byStatus?.reduce((sum, stat) => sum + stat.count, 0) || 0
    };
  }

  static toAssignmentResponse(assignment) {
    if (!assignment) return null;

    return {
      id: assignment.id,
      audit_id: assignment.audit_id,
      user_id: assignment.user_id,
      assigned_at: assignment.created_at,
      message: 'Auditoría asignada exitosamente'
    };
  }

  static getStatusDisplay(status) {
    const statusDisplays = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado'
    };

    return statusDisplays[status] || status;
  }

  static getStatusColor(status) {
    const statusColors = {
      BORRADOR: '#6c757d',
      ENVIADO: '#007bff',
      APROBADO: '#28a745',
      RECHAZADO: '#dc3545'
    };

    return statusColors[status] || '#6c757d';
  }

  static getMonthName(month) {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return months[month - 1] || 'Mes desconocido';
  }

  static calculateProgress(summary) {
    if (!summary) return 0;

    const totalItems = summary.total_items || 0;
    const scoredItems = summary.favorable_count + summary.favorable_requirement_count + summary.unfavorable_count;

    if (totalItems === 0) return 0;
    return Math.round((scoredItems / totalItems) * 100);
  }

  static canEditAudit(audit) {
    if (!audit) return false;
    
    const editableStatuses = ['BORRADOR', 'ENVIADO'];
    return editableStatuses.includes(audit.status);
  }

  static canDeleteAudit(audit) {
    if (!audit) return false;
    
    const deletableStatuses = ['BORRADOR'];
    return deletableStatuses.includes(audit.status);
  }

  static getDefaultSummary() {
    return {
      total_items: 0,
      total_weight: 0,
      weighted_score: 0,
      average_score: 0,
      favorable_count: 0,
      favorable_requirement_count: 0,
      unfavorable_count: 0
    };
  }

  static sanitizeAuditData(auditData) {
    if (!auditData) return {};

    return {
      title: auditData.title?.trim()?.replace(/\s+/g, ' ') || '',
      description: auditData.description?.trim() || null,
      status: auditData.status?.toUpperCase() || 'BORRADOR',
      scheduled_visit_date: auditData.scheduled_visit_date || null
    };
  }

  static validateAuditData(auditData) {
    const errors = [];

    if (!auditData.title || auditData.title.trim().length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    }

    if (auditData.status && !['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'].includes(auditData.status)) {
      errors.push('Estado no válido');
    }

    if (auditData.scheduled_visit_date && !this.isValidDate(auditData.scheduled_visit_date)) {
      errors.push('Formato de fecha inválido');
    }

    return errors;
  }

  static isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
}

module.exports = AuditDTO;
