# Documentación Swagger - Plataforma de Auditorías API

## Overview

Esta API está documentada con Swagger/OpenAPI 3.0 para proporcionar una interfaz interactiva de prueba y documentación completa.

## Acceso a la Documentación

### Desarrollo
```
http://localhost:4000/api-docs
```

### Producción
```
https://api.auditorias.com/api-docs
```

## Autenticación

La mayoría de los endpoints requieren autenticación mediante token JWT:

1. **Obtener Token**: Usa el endpoint `/auth/login`
2. **Incluir Token**: Agrega el header `Authorization: Bearer <token>`
3. **Probar Endpoints**: Usa el botón "Authorize" en Swagger UI

## Estructura de la Documentación

### Tags Organizados
- **Authentication**: Login, registro, gestión de usuarios
- **Audits**: CRUD de auditorías, asignaciones, puntajes
- **Evidence**: Subida y gestión de archivos
- **System**: Estadísticas y健康检查

### Modelos de Datos
- **User**: Información de usuarios
- **Audit**: Auditorías y sus estados
- **AuditItem**: Items individuales de auditoría
- **Evidence**: Archivos y documentos
- **Error**: Manejo estandarizado de errores

## Ejemplos de Uso

### 1. Autenticación
```bash
# Login
curl -X POST "http://localhost:4000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@auditorias.com", "password": "admin123"}'
```

### 2. Crear Auditoría
```bash
# Con token obtenido
curl -X POST "http://localhost:4000/audits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "Auditoría de Ejemplo", "description": "Descripción"}'
```

### 3. Subir Evidencia
```bash
# Subir archivo
curl -X POST "http://localhost:4000/audits/1/evidences" \
  -H "Authorization: Bearer <token>" \
  -F "file=@documento.pdf"
```

## Características de la Documentación

### 1. Esquemas Completos
- Todos los modelos con validaciones
- Ejemplos para cada campo
- Descripciones detalladas

### 2. Respuestas Estándar
- Códigos HTTP correctos
- Formatos consistentes
- Manejo de errores

### 3. Seguridad Documentada
- Requisitos de autenticación
- Permisos por rol
- Ejemplos de tokens

### 4. Ejemplos Prácticos
- Requests de ejemplo
- Responses esperadas
- Casos de error

## Navegación en Swagger UI

### 1. Explorar Endpoints
- Expandir/collapsar categorías
- Ver detalles de cada endpoint
- Parámetros y respuestas

### 2. Probar Endpoints
- Click en "Try it out"
- Llenar parámetros requeridos
- Ejecutar y ver resultados

### 3. Autenticación
- Click en "Authorize"
- Ingresar `Bearer <token>`
- Token guardado para todas las pruebas

## Actualización de la Documentación

Los comentarios JSDoc en el código actualizan automáticamente la documentación:

```javascript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */
router.post('/login', async (req, res) => {
  // implementación
});
```

## Buenas Prácticas

### 1. Documentación Clara
- Descripciones concisas
- Ejemplos realistas
- Formatos consistentes

### 2. Validaciones Explícitas
- Campos requeridos
- Tipos de datos
- Restricciones

### 3. Manejo de Errores
- Códigos HTTP apropiados
- Mensajes descriptivos
- Estructura consistente

### 4. Seguridad
- Autenticación documentada
- Permisos claros
- Ejemplos seguros

## Troubleshooting

### Problemas Comunes

1. **Token Inválido**
   - Verifica el token JWT
   - Revisa la expiración
   - Formato correcto: `Bearer <token>`

2. **Permisos Insuficientes**
   - Verifica el rol del usuario
   - Revisa permisos requeridos
   - Usa usuario adecuado

3. **Validación Fallida**
   - Revisa campos requeridos
   - Verifica formatos
   - Consulta esquemas

4. **Archivo No Subido**
   - Verifica tamaño máximo
   - Revisa tipo de archivo
   - Confirma multipart/form-data

### Debug con Swagger

1. **Logs del Servidor**: Revisa consola del backend
2. **Response Headers**: Verifica status codes
3. **Response Body**: Analiza errores específicos
4. **Network**: Usa herramientas de desarrollador

## Mantenimiento

### Actualización Regular
- Mantener comentarios JSDoc actualizados
- Probar nuevos endpoints
- Verificar ejemplos

### Versionado
- Actualizar version en info
- Documentar cambios
- Mantener compatibilidad

### Testing
- Probar todos los ejemplos
- Verificar validaciones
- Confirmar seguridad

## Soporte

Para problemas con la documentación:
1. Revisa los logs del servidor
2. Verifica la configuración de Swagger
3. Consulta los esquemas de validación
4. Contacta al equipo de desarrollo
