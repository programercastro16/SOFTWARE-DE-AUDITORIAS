const bcrypt = require('bcryptjs');
const { UserRepository, AuditRepository, AuditItemRepository } = require('../repositories');
const path = require('path');
const fs = require('fs');

class DataSeeder {
  constructor() {
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
    this.auditItemRepository = new AuditItemRepository();
  }

  async seedAll() {
    console.log('🌱 Iniciando DataSeeder...');
    
    try {
      await this.seedUsers();
      await this.seedAudits();
      await this.seedAuditItems();
      
      console.log('✅ DataSeeder completado exitosamente');
      return { success: true, message: 'Datos iniciales creados correctamente' };
    } catch (error) {
      console.error('❌ Error en DataSeeder:', error);
      throw error;
    }
  }

  async seedUsers() {
    console.log('👥 Creando usuarios...');

    const users = [
      {
        name: 'Administrador Principal',
        email: 'admin@auditorias.com',
        password: 'admin123',
        role: 'ADMIN'
      },
      {
        name: 'Carlos Rodríguez',
        email: 'carlos.auditor@auditorias.com',
        password: 'auditor123',
        role: 'AUDITOR'
      },
      {
        name: 'María González',
        email: 'maria.auditor@auditorias.com',
        password: 'auditor123',
        role: 'AUDITOR'
      },
      {
        name: 'Empresa ABC S.A.',
        email: 'contacto@abc.com',
        password: 'cliente123',
        role: 'CLIENTE'
      },
      {
        name: 'Restaurante El Buen Sabor',
        email: 'info@elbuensabor.com',
        password: 'cliente123',
        role: 'CLIENTE'
      },
      {
        name: 'Cafetería Central',
        email: 'admin@cafeteriacentral.com',
        password: 'cliente123',
        role: 'CLIENTE'
      }
    ];

    for (const userData of users) {
      try {
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⚠️  Usuario ${userData.email} ya existe, omitiendo...`);
          continue;
        }

        const passwordHash = bcrypt.hashSync(userData.password, 10);
        const user = await this.userRepository.create({
          name: userData.name,
          email: userData.email,
          password_hash: passwordHash,
          role: userData.role
        });

        console.log(`✅ Usuario creado: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }

    console.log('👥 Usuarios creados exitosamente');
  }

  async seedAudits() {
    console.log('📋 Creando auditorías...');

    const audits = [
      {
        title: 'Auditoría Sanitaria - Restaurante El Buen Sabor',
        description: 'Auditoría completa de condiciones sanitarias y manipulación de alimentos',
        status: 'APROBADO',
        scheduled_visit_date: '2024-02-15',
        created_by: 2 // Carlos Rodríguez
      },
      {
        title: 'Auditoría de Instalaciones - Empresa ABC S.A.',
        description: 'Evaluación de instalaciones físicas y condiciones operativas',
        status: 'ENVIADO',
        scheduled_visit_date: '2024-03-20',
        created_by: 3 // María González
      },
      {
        title: 'Auditoría Integral - Cafetería Central',
        description: 'Auditoría integral de procesos y procedimientos',
        status: 'BORRADOR',
        scheduled_visit_date: '2024-04-10',
        created_by: 2 // Carlos Rodríguez
      },
      {
        title: 'Auditoría de Saneamiento - Restaurante El Buen Sabor',
        description: 'Verificación de sistemas de saneamiento y control de plagas',
        status: 'RECHAZADO',
        scheduled_visit_date: '2024-01-25',
        created_by: 3 // María González
      },
      {
        title: 'Auditoría de Equipos - Empresa ABC S.A.',
        description: 'Inspección de equipos y utensilios de cocina',
        status: 'APROBADO',
        scheduled_visit_date: '2024-02-28',
        created_by: 2 // Carlos Rodríguez
      }
    ];

    for (const auditData of audits) {
      try {
        const existingAudit = await this.auditRepository.getAll({ 
          title: auditData.title, 
          created_by: auditData.created_by 
        });
        
        if (existingAudit.length > 0) {
          console.log(`⚠️  Auditoría "${auditData.title}" ya existe, omitiendo...`);
          continue;
        }

        const audit = await this.auditRepository.create(auditData);
        console.log(`✅ Auditoría creada: ${audit.title} (ID: ${audit.id})`);
      } catch (error) {
        console.error(`❌ Error creando auditoría "${auditData.title}":`, error.message);
      }
    }

    console.log('📋 Auditorías creadas exitosamente');
  }

  async seedAuditItems() {
    console.log('📝 Creando items de auditoría...');

    const audits = await this.auditRepository.getAll();
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
      { code: '5.6', label: 'Soportes documentales de saneamiento', weight: 2, category: 'SANEAMIENTO' }
    ];

    for (const audit of audits) {
      try {
        const existingItems = await this.auditItemRepository.getByAuditId(audit.id);
        if (existingItems.length > 0) {
          console.log(`⚠️  Items para auditoría ${audit.id} ya existen, omitiendo...`);
          continue;
        }

        await this.auditItemRepository.createBulkItems(audit.id, BASE_ITEMS);
        
        // Asignar puntajes aleatorios para demostración
        await this.assignRandomScores(audit.id);
        
        console.log(`✅ Items creados para auditoría ${audit.id}: ${audit.title}`);
      } catch (error) {
        console.error(`❌ Error creando items para auditoría ${audit.id}:`, error.message);
      }
    }

    console.log('📝 Items de auditoría creados exitosamente');
  }

  async assignRandomScores(auditId) {
    const items = await this.auditItemRepository.getByAuditId(auditId);
    
    for (const item of items) {
      // Generar puntajes realistas según la categoría
      let score;
      if (item.category === 'INSTALACIONES FÍSICAS') {
        score = Math.floor(Math.random() * 20) + 80; // 80-100
      } else if (item.category === 'EQUIPOS Y UTENSILIOS') {
        score = Math.floor(Math.random() * 30) + 70; // 70-100
      } else if (item.category === 'PERSONAL MANIPULADOR') {
        score = Math.floor(Math.random() * 25) + 75; // 75-100
      } else if (item.category === 'REQUISITOS HIGIÉNICOS') {
        score = Math.floor(Math.random() * 35) + 65; // 65-100
      } else {
        score = Math.floor(Math.random() * 40) + 60; // 60-100
      }

      const observations = score < 80 ? 
        'Se requiere mejorar en este aspecto para cumplir con los estándares de calidad.' : 
        'Cumple satisfactoriamente con los requisitos establecidos.';

      await this.auditItemRepository.update(auditId, {
        code: item.code,
        score,
        observations
      });
    }
  }

  async clearAll() {
    console.log('🧹 Limpiando datos existentes...');
    
    try {
      // Limpiar en orden inverso para evitar problemas de foreign keys
      await this.auditItemRepository.deleteAll();
      await this.auditRepository.deleteAll();
      await this.userRepository.deleteAll();
      
      console.log('✅ Datos limpiados exitosamente');
      return { success: true, message: 'Datos eliminados correctamente' };
    } catch (error) {
      console.error('❌ Error limpiando datos:', error);
      throw error;
    }
  }

  async reset() {
    console.log('🔄 Reseteando base de datos...');
    
    try {
      await this.clearAll();
      await this.seedAll();
      
      console.log('✅ Base de datos reseteada exitosamente');
      return { success: true, message: 'Base de datos reseteada correctamente' };
    } catch (error) {
      console.error('❌ Error reseteando base de datos:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const userCount = await this.userRepository.count();
      const auditCount = await this.auditRepository.count();
      const itemCount = await this.auditItemRepository.count();

      return {
        users: userCount,
        audits: auditCount,
        audit_items: itemCount,
        seeded_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

module.exports = DataSeeder;
