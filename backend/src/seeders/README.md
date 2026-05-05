# DataSeeder - Sistema de Poblado de Datos

## Overview

El DataSeeder es un sistema automatizado para poblar la base de datos con datos iniciales de demostración y prueba. Esto permite que la aplicación funcione inmediatamente sin necesidad de ingresar datos manualmente.

## Datos Generados

### Usuarios (6 usuarios)

**Administradores:**
- **admin@auditorias.com** / **admin123** - Administrador principal
  - Permisos completos del sistema
  - Acceso a todas las funcionalidades

**Auditores:**
- **carlos.auditor@auditorias.com** / **auditor123** - Carlos Rodríguez
- **maria.auditor@auditorias.com** / **auditor123** - María González
  - Permisos para crear y gestionar auditorías
  - Acceso a reportes y evidencias

**Clientes:**
- **contacto@abc.com** / **cliente123** - Empresa ABC S.A.
- **info@elbuensabor.com** / **cliente123** - Restaurante El Buen Sabor
- **admin@cafeteriacentral.com** / **cliente123** - Cafetería Central
  - Permisos de solo lectura para sus auditorías

### Auditorías (5 auditorías)

1. **Auditoría Sanitaria - Restaurante El Buen Sabor**
   - Estado: APROBADO
   - Auditor: Carlos Rodríguez
   - Fecha programada: 2024-02-15

2. **Auditoría de Instalaciones - Empresa ABC S.A.**
   - Estado: ENVIADO
   - Auditor: María González
   - Fecha programada: 2024-03-20

3. **Auditoría Integral - Cafetería Central**
   - Estado: BORRADOR
   - Auditor: Carlos Rodríguez
   - Fecha programada: 2024-04-10

4. **Auditoría de Saneamiento - Restaurante El Buen Sabor**
   - Estado: RECHAZADO
   - Auditor: María González
   - Fecha programada: 2024-01-25

5. **Auditoría de Equipos - Empresa ABC S.A.**
   - Estado: APROBADO
   - Auditor: Carlos Rodríguez
   - Fecha programada: 2024-02-28

### Items de Auditoría (21 items por auditoría)

Cada auditoría incluye 21 items estándar distribuidos en 5 categorías:

**INSTALACIONES FÍSICAS (4 items)**
- Localización y diseño
- Condiciones de pisos y paredes
- Techos, iluminación y ventilación
- Instalaciones sanitaria

**EQUIPOS Y UTENSILIOS (2 items)**
- Condiciones de equipos y utensilios
- Superficies de contacto con el alimento

**PERSONAL MANIPULADOR (4 items)**
- Estado de salud
- Reconocimiento médico
- Prácticas higiénicas
- Educación y capacitación

**REQUISITOS HIGIÉNICOS (4 items)**
- Control de materia prima
- Prevención de la contaminación cruzada
- Manejo de temperaturas
- Condiciones de almacenamiento

**SANEAMIENTO (7 items)**
- Suministro y calidad de agua potable
- Residuos líquidos
- Residuos sólidos
- Control integrado de plagas
- Limpieza y desinfección
- Soportes documentales

## Comandos Disponibles

### Poblar Datos
```bash
npm run seed
```
Crea todos los datos iniciales sin eliminar datos existentes.

### Limpiar Datos
```bash
npm run seed:clear
```
Elimina todos los datos de la base de datos.

### Resetear Base de Datos
```bash
npm run seed:reset
```
Limpia completamente la base de datos y vuelve a poblarla con datos iniciales.

### Ver Estadísticas
```bash
npm run seed:stats
```
Muestra estadísticas actuales de la base de datos.

## Uso Recomendado

### Primera Vez
```bash
npm run seed
```

### Durante Desarrollo
```bash
npm run seed:reset
```

### Para Pruebas
```bash
npm run seed:clear
npm run seed
```

## Características

### Seguridad
- Contraseñas hasheadas con bcrypt
- Sin exposición de datos sensibles
- Roles y permisos preconfigurados

### Realismo
- Puntajes realistas según categorías
- Estados variados de auditorías
- Observaciones contextuales

### Flexibilidad
- No sobrescribe datos existentes
- Operaciones atómicas
- Rollback automático en errores

### Logging
- Información detallada de operaciones
- Errores específicos con contexto
- Estadísticas en tiempo real

## Estructura de Archivos

```
backend/src/seeders/
├── DataSeeder.js     # Clase principal del seeder
├── seed.js           # Script ejecutable
├── index.js          # Export centralizado
└── README.md         # Esta documentación
```

## Flujo de Ejecución

1. **Verificación**: Comprueba si los datos ya existen
2. **Creación**: Inserta datos en orden correcto (foreign keys)
3. **Puntajes**: Asigna puntajes realistas a los items
4. **Logging**: Reporta progreso y resultados
5. **Estadísticas**: Muestra resumen final

## Manejo de Errores

- **Validación**: Verifica integridad de datos antes de insertar
- **Transacciones**: Operaciones atómicas con rollback
- **Logging**: Errores específicos con contexto
- **Continuidad**: No se detiene por errores parciales

## Personalización

Para modificar los datos iniciales:

1. Editar `DataSeeder.js`
2. Modificar arrays de usuarios, auditorías o items
3. Ejecutar `npm run seed:reset`

## Notas Importantes

- Las contraseñas son para demostración, cámbielas en producción
- Los datos son ficticios pero realistas
- El seeder es idempotente (puede ejecutarse múltiples veces)
- Los datos persisten entre reinicios del servidor

## Troubleshooting

### Error: "Usuario ya existe"
- Normal, el seeder omite datos existentes
- Use `npm run seed:reset` para limpiar primero

### Error: "Base de datos bloqueada"
- Detenga el servidor antes de ejecutar
- Use `npm run seed:clear` si es necesario

### Error de permisos
- Verifique que la carpeta `data/` tenga permisos de escritura
- Ejecute con privilegios suficientes
