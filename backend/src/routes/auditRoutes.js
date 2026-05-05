const express = require('express');
const multer = require('multer');
const { AuditService, EvidenceService } = require('../services');
const { AuditDTO, EvidenceDTO } = require('../dto');
const { requireRole } = require('../authRoutes');

const router = express.Router();
const auditService = new AuditService();
const evidenceService = new EvidenceService();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * @swagger
 * /audits:
 *   get:
 *     summary: Listar auditorías
 *     description: Obtiene la lista de auditorías con filtros opcionales
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [BORRADOR, ENVIADO, APROBADO, RECHAZADO]
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por título o descripción
 *     responses:
 *       200:
 *         description: Lista de auditorías obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Audit'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search
    };
    
    const audits = await auditService.getAllAudits(filters);
    const response = AuditDTO.toListResponse(audits);
    res.json(response);
  } catch (error) {
    console.error('Error al listar auditorías:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /audits/{id}:
 *   get:
 *     summary: Obtener auditoría por ID
 *     description: Obtiene los detalles completos de una auditoría específica
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *     responses:
 *       200:
 *         description: Auditoría obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audit'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', async (req, res) => {
  try {
    const audit = await auditService.getAuditById(parseInt(req.params.id));
    const response = AuditDTO.toDetailedResponse(audit);
    res.json(response);
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits:
 *   post:
 *     summary: Crear auditoría
 *     description: Crea una nueva auditoría con items predefinidos
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuditCreate'
 *     responses:
 *       201:
 *         description: Auditoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audit'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const audit = await auditService.createAudit(req.body, req.user.id);
    const response = AuditDTO.toCreateResponse(audit);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error al crear auditoría:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /audits/{id}:
 *   put:
 *     summary: Actualizar auditoría
 *     description: Actualiza los datos de una auditoría existente
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuditCreate'
 *     responses:
 *       200:
 *         description: Auditoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audit'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const audit = await auditService.updateAudit(parseInt(req.params.id), req.body, req.user.id);
    const response = AuditDTO.toUpdateResponse(audit);
    res.json(response);
  } catch (error) {
    console.error('Error al actualizar auditoría:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits/{id}:
 *   delete:
 *     summary: Eliminar auditoría
 *     description: Elimina una auditoría y sus items asociados
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *     responses:
 *       200:
 *         description: Auditoría eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Auditoría eliminada correctamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await auditService.deleteAudit(parseInt(req.params.id), req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar auditoría:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits/{id}/scores:
 *   put:
 *     summary: Actualizar puntajes de auditoría
 *     description: Actualiza los puntajes de los items de una auditoría
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "1.1"
 *                 score:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                   example: 85
 *                 observations:
 *                   type: string
 *                   example: "Cumple satisfactoriamente"
 *     responses:
 *       200:
 *         description: Puntajes actualizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audit'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id/scores', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const audit = await auditService.updateAuditScores(parseInt(req.params.id), req.body.items, req.user.id);
    const response = AuditDTO.toScoreUpdateResponse(audit, req.body.items);
    res.json(response);
  } catch (error) {
    console.error('Error al actualizar puntajes:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits/{id}/evidences:
 *   get:
 *     summary: Listar evidencias de auditoría
 *     description: Obtiene la lista de evidencias asociadas a una auditoría
 *     tags: [Evidence]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *     responses:
 *       200:
 *         description: Lista de evidencias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Evidence'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/evidences', async (req, res) => {
  try {
    const evidences = await evidenceService.getEvidencesByAudit(parseInt(req.params.id));
    const response = EvidenceDTO.toListResponse(evidences);
    res.json(response);
  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits/{id}/evidences:
 *   post:
 *     summary: Subir evidencia
 *     description: Sube un archivo como evidencia de una auditoría
 *     tags: [Evidence]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX)
 *     responses:
 *       201:
 *         description: Evidencia subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evidence'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/evidences', requireRole(['ADMIN', 'AUDITOR']), upload.single('file'), async (req, res) => {
  try {
    const evidence = await evidenceService.uploadEvidence(parseInt(req.params.id), req.file, req.user.id);
    const response = EvidenceDTO.toCreateResponse(evidence);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error al subir evidencia:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits/{id}/evidences/{evidenceId}:
 *   delete:
 *     summary: Eliminar evidencia
 *     description: Elimina una evidencia y su archivo asociado
 *     tags: [Evidence]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la auditoría
 *       - in: path
 *         name: evidenceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evidencia
 *     responses:
 *       200:
 *         description: Evidencia eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evidencia eliminada correctamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id/evidences/:evidenceId', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const result = await evidenceService.deleteEvidence(parseInt(req.params.evidenceId), req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar evidencia:', error);
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /audits/stats:
 *   get:
 *     summary: Estadísticas de auditorías
 *     description: Obtiene estadísticas generales de auditorías
 *     tags: [Audits]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const stats = await auditService.getAuditStats();
    const response = AuditDTO.toStatsResponse(stats);
    res.json(response);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
