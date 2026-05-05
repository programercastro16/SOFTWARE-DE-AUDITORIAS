const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plataforma de Auditorías API',
      version: '1.0.0',
      description: `
        API RESTful para la plataforma de auditorías sanitarias y de calidad alimentaria.
        
        ## Características
        - Gestión de usuarios con roles (ADMIN, AUDITOR, CLIENTE)
        - Creación y gestión de auditorías
        - Sistema de evidencias y archivos
        - Generación de reportes PDF
        - Autenticación JWT
        
        ## Autenticación
        La mayoría de los endpoints requieren autenticación mediante token JWT.
        Incluye el token en el header: \`Authorization: Bearer <token>\`
        
        ## Roles y Permisos
        - **ADMIN**: Acceso completo a todos los recursos
        - **AUDITOR**: Gestión de auditorías y evidencias
        - **CLIENTE**: Solo lectura de sus auditorías asignadas
      `,
      contact: {
        name: 'API Support',
        email: 'support@auditorias.com',
        url: 'https://auditorias.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.auditorias.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del usuario',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
              example: 'juan@ejemplo.com'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'AUDITOR', 'CLIENTE'],
              description: 'Rol del usuario en el sistema',
              example: 'AUDITOR'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del usuario',
              example: '2024-01-15T10:30:00Z'
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              description: 'Último inicio de sesión',
              example: '2024-01-20T14:15:00Z'
            }
          }
        },
        UserCreate: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              description: 'Nombre completo del usuario',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
              example: 'juan@ejemplo.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Contraseña (mínimo 6 caracteres, una letra y un número)',
              example: 'password123'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'AUDITOR', 'CLIENTE'],
              description: 'Rol del usuario',
              example: 'AUDITOR'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
              example: 'juan@ejemplo.com'
            },
            password: {
              type: 'string',
              description: 'Contraseña del usuario',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticación',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expires_in: {
              type: 'string',
              description: 'Tiempo de expiración del token',
              example: '8h'
            },
            token_type: {
              type: 'string',
              description: 'Tipo de token',
              example: 'Bearer'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Permisos del usuario',
              example: ['audits.read', 'audits.update', 'evidences.create']
            },
            message: {
              type: 'string',
              description: 'Mensaje de respuesta',
              example: 'Login exitoso'
            }
          }
        },
        Audit: {
          type: 'object',
          required: ['title', 'created_by'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la auditoría',
              example: 1
            },
            title: {
              type: 'string',
              description: 'Título de la auditoría',
              example: 'Auditoría Sanitaria - Restaurante El Buen Sabor'
            },
            description: {
              type: 'string',
              description: 'Descripción detallada de la auditoría',
              example: 'Auditoría completa de condiciones sanitarias y manipulación de alimentos'
            },
            status: {
              type: 'string',
              enum: ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'],
              description: 'Estado actual de la auditoría',
              example: 'ENVIADO'
            },
            scheduled_visit_date: {
              type: 'string',
              format: 'date',
              description: 'Fecha programada para la visita',
              example: '2024-02-15'
            },
            created_by: {
              type: 'integer',
              description: 'ID del usuario que creó la auditoría',
              example: 2
            },
            created_by_name: {
              type: 'string',
              description: 'Nombre del usuario que creó la auditoría',
              example: 'Carlos Rodríguez'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
              example: '2024-01-20T14:15:00Z'
            },
            concept: {
              type: 'string',
              description: 'Concepto basado en puntaje',
              example: 'Favorable'
            }
          }
        },
        AuditCreate: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              description: 'Título de la auditoría',
              example: 'Auditoría Sanitaria - Restaurante El Buen Sabor'
            },
            description: {
              type: 'string',
              description: 'Descripción detallada de la auditoría',
              example: 'Auditoría completa de condiciones sanitarias y manipulación de alimentos'
            },
            status: {
              type: 'string',
              enum: ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'],
              description: 'Estado inicial de la auditoría',
              example: 'BORRADOR'
            },
            scheduled_visit_date: {
              type: 'string',
              format: 'date',
              description: 'Fecha programada para la visita',
              example: '2024-02-15'
            }
          }
        },
        AuditItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del item',
              example: 1
            },
            audit_id: {
              type: 'integer',
              description: 'ID de la auditoría',
              example: 1
            },
            code: {
              type: 'string',
              description: 'Código del item',
              example: '1.1'
            },
            label: {
              type: 'string',
              description: 'Descripción del item',
              example: 'Localización y diseño'
            },
            weight: {
              type: 'number',
              description: 'Ponderación del item',
              example: 2
            },
            score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Puntaje asignado (0-100)',
              example: 85
            },
            category: {
              type: 'string',
              description: 'Categoría del item',
              example: 'INSTALACIONES FÍSICAS'
            },
            observations: {
              type: 'string',
              description: 'Observaciones del item',
              example: 'Cumple satisfactoriamente con los requisitos'
            }
          }
        },
        Evidence: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la evidencia',
              example: 1
            },
            audit_id: {
              type: 'integer',
              description: 'ID de la auditoría',
              example: 1
            },
            file_path: {
              type: 'string',
              description: 'Ruta del archivo',
              example: '1642678800000_123456789_certificado_haccp.pdf'
            },
            file_url: {
              type: 'string',
              description: 'URL para acceder al archivo',
              example: '/uploads/1642678800000_123456789_certificado_haccp.pdf'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              description: 'Indica si hay un error',
              example: true
            },
            message: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Email ya registrado'
            },
            status_code: {
              type: 'integer',
              description: 'Código HTTP del error',
              example: 400
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del error',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            total_audits: {
              type: 'integer',
              description: 'Total de auditorías',
              example: 25
            },
            by_status: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'APROBADO'
                  },
                  count: {
                    type: 'integer',
                    example: 15
                  },
                  display_name: {
                    type: 'string',
                    example: 'Aprobado'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'No autorizado - Token inválido o ausente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: true,
                message: 'Token requerido',
                status_code: 401,
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Prohibido - Permisos insuficientes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: true,
                message: 'No autorizado',
                status_code: 403,
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: true,
                message: 'Auditoría no encontrada',
                status_code: 404,
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: true,
                message: 'Error de validación',
                status_code: 400,
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Operaciones de autenticación y gestión de usuarios'
      },
      {
        name: 'Audits',
        description: 'Gestión de auditorías'
      },
      {
        name: 'Evidence',
        description: 'Gestión de evidencias y archivos'
      },
      {
        name: 'System',
        description: 'Información del sistema y estadísticas'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/authRoutes.js',
    './src/auditsRoutes.js',
    './src/index.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  customOptions: {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { margin: 20px 0 }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90 }
      .swagger-ui .opblock.opblock-get { border-color: #61affe }
      .swagger-ui .opblock.opblock-put { border-color: #fca130 }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e }
    `,
    customSiteTitle: 'Plataforma de Auditorías API Documentation'
  }
};
