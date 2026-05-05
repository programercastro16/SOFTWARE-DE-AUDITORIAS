// Datos de demostración adicionales que pueden ser usados para testing

const DEMO_USERS = [
  {
    name: 'Juan Pérez',
    email: 'juan.perez@demo.com',
    password: 'demo123',
    role: 'AUDITOR',
    profile: {
      experience: '5 años en auditorías alimentarias',
      certifications: ['HACCP', 'ISO 22000'],
      specialties: ['Restaurantes', 'Cafeterías']
    }
  },
  {
    name: 'Ana Martínez',
    email: 'ana.martinez@demo.com',
    password: 'demo123',
    role: 'AUDITOR',
    profile: {
      experience: '3 años en calidad alimentaria',
      certifications: ['ServSafe', 'Food Safety'],
      specialties: ['Hoteles', 'Servicios de catering']
    }
  },
  {
    name: 'Roberto Silva',
    email: 'roberto.silva@demo.com',
    password: 'demo123',
    role: 'CLIENTE',
    profile: {
      company: 'Hotel Paradise',
      industry: 'Hotelería',
      location: 'Cartagena, Colombia'
    }
  }
];

const DEMO_AUDITS = [
  {
    title: 'Auditoría de Calidad - Hotel Paradise',
    description: 'Evaluación completa de sistemas de calidad y seguridad alimentaria',
    status: 'BORRADOR',
    priority: 'ALTA',
    estimated_duration: '8 horas',
    created_by: 1
  },
  {
    title: 'Auditoría de Proveedores - Restaurante El Buen Sabor',
    description: 'Verificación de cadenas de suministro y control de proveedores',
    status: 'ENVIADO',
    priority: 'MEDIA',
    estimated_duration: '6 horas',
    created_by: 2
  },
  {
    title: 'Auditoría de Emergencia - Cafetería Central',
    description: 'Auditoría no programada por denuncia anónima',
    status: 'URGENTE',
    priority: 'ALTA',
    estimated_duration: '4 horas',
    created_by: 1
  }
];

const ADVANCED_AUDIT_ITEMS = [
  {
    code: '6.1',
    label: 'Sistema de Trazabilidad',
    weight: 8,
    category: 'TRAZABILIDAD',
    description: 'Capacidad de rastrear productos desde origen hasta consumo'
  },
  {
    code: '6.2',
    label: 'Control de Proveedores',
    weight: 6,
    category: 'TRAZABILIDAD',
    description: 'Verificación y certificación de proveedores'
  },
  {
    code: '7.1',
    label: 'Plan HACCP',
    weight: 10,
    category: 'SISTEMAS DE GESTIÓN',
    description: 'Implementación y seguimiento de planes HACCP'
  },
  {
    code: '7.2',
    label: 'Documentación de Procesos',
    weight: 5,
    category: 'SISTEMAS DE GESTIÓN',
    description: 'Manuales de procedimientos y registros'
  },
  {
    code: '8.1',
    label: 'Capacitación Continua',
    weight: 4,
    category: 'CAPACITACIÓN',
    description: 'Programas de formación y actualización'
  }
];

const SAMPLE_EVIDENCES = [
  {
    file_name: 'certificado_haccp.pdf',
    description: 'Certificado HACCP actualizado',
    category: 'CERTIFICACIONES'
  },
  {
    file_name: 'plano_instalaciones.jpg',
    description: 'Plano actualizado de instalaciones',
    category: 'DOCUMENTACIÓN'
  },
  {
    file_name: 'registro_temperaturas.xlsx',
    description: 'Registro de temperaturas del último mes',
    category: 'REGISTROS'
  },
  {
    file_name: 'fotografia_area_produccion.jpg',
    description: 'Estado actual del área de producción',
    category: 'EVIDENCIA FOTOGRÁFICA'
  }
];

const SAMPLE_OBSERVATIONS = [
  {
    score: 95,
    observation: 'Excelente cumplimiento de los estándares. Mantener los procedimientos actuales.',
    recommendation: 'Continuar con el programa de capacitación actual.',
    follow_up_required: false
  },
  {
    score: 75,
    observation: 'Cumple básicamente los requisitos pero hay oportunidades de mejora.',
    recommendation: 'Implementar programa de mejora continua en áreas específicas.',
    follow_up_required: true,
    follow_up_date: '2024-03-01'
  },
  {
    score: 45,
    observation: 'Deficiencias significativas que requieren atención inmediata.',
    recommendation: 'Plan de acción correctiva urgente con seguimiento semanal.',
    follow_up_required: true,
    follow_up_date: '2024-02-01'
  }
];

const AUDIT_TEMPLATES = [
  {
    name: 'Auditoría Restaurante Estándar',
    description: 'Plantilla para auditorías completas de restaurantes',
    duration: '8 horas',
    categories: ['INSTALACIONES FÍSICAS', 'EQUIPOS Y UTENSILIOS', 'PERSONAL MANIPULADOR', 'REQUISITOS HIGIÉNICOS', 'SANEAMIENTO'],
    items_count: 21,
    min_score: 80
  },
  {
    name: 'Auditoría Cafetería Rápida',
    description: 'Plantilla simplificada para cafeterías y servicios rápidos',
    duration: '4 horas',
    categories: ['EQUIPOS Y UTENSILIOS', 'PERSONAL MANIPULADOR', 'REQUISITOS HIGIÉNICOS'],
    items_count: 12,
    min_score: 75
  },
  {
    name: 'Auditoría Hotel Completo',
    description: 'Plantilla completa para servicios de hotel',
    duration: '12 horas',
    categories: ['INSTALACIONES FÍSICAS', 'EQUIPOS Y UTENSILIOS', 'PERSONAL MANIPULADOR', 'REQUISITOS HIGIÉNICOS', 'SANEAMIENTO', 'TRAZABILIDAD', 'SISTEMAS DE GESTIÓN'],
    items_count: 28,
    min_score: 85
  }
];

const SCENARIOS = [
  {
    name: 'Auditoría Exitosa',
    description: 'Todos los items cumplen con los estándares',
    score_range: [85, 100],
    status: 'APROBADO',
    observations: 'Excelente cumplimiento general'
  },
  {
    name: 'Auditoría con Mejoras',
    description: 'Cumple básicamente pero requiere mejoras',
    score_range: [70, 84],
    status: 'ENVIADO',
    observations: 'Se requieren acciones correctivas menores'
  },
  {
    name: 'Auditoría Crítica',
    description: 'Deficiencias significativas',
    score_range: [0, 69],
    status: 'RECHAZADO',
    observations: 'Requiere plan de acción inmediato'
  }
];

module.exports = {
  DEMO_USERS,
  DEMO_AUDITS,
  ADVANCED_AUDIT_ITEMS,
  SAMPLE_EVIDENCES,
  SAMPLE_OBSERVATIONS,
  AUDIT_TEMPLATES,
  SCENARIOS
};
