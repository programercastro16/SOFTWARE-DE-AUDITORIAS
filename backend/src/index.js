const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const { authRouter, authMiddleware, requireRole } = require('./authRoutes');
const auditsRouter = require('./routes/auditRoutes');
const { specs, swaggerUi, customOptions } = require('./config/swaggerConfig');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/**
 * @swagger
 * /
 * get:
 *   summary: Estado de la API
 *   description: Verifica si la API está funcionando correctamente
 *   tags: [System]
 *   responses:
 *     200:
 *       description: API funcionando correctamente
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: API de auditorías funcionando
 *               version:
 *                 type: string
 *                 example: 1.0.0
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de auditorías funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api-docs'
  });
});

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Documentación Swagger UI
 *     description: Interfaz interactiva de documentación de la API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Página de documentación Swagger UI
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, customOptions));

/**
 * @swagger
 * /api-docs.json:
 *   get:
 *     summary: Especificación OpenAPI JSON
 *     description: Especificación completa de la API en formato JSON
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Especificación OpenAPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/auth', authRouter);
app.use('/audits', authMiddleware, auditsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
  console.log(`📚 Documentación Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`📄 Especificación JSON: http://localhost:${PORT}/api-docs.json`);
  console.log(`🏠 API Root: http://localhost:${PORT}/`);
});


