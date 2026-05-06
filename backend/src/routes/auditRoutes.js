const express = require('express');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const { AuditService, EvidenceService, UserService } = require('../services');
const { AuditDTO, EvidenceDTO } = require('../dto');
const { AuditItemRepository } = require('../repositories');
const { requireRole } = require('../authRoutes');

const router = express.Router();
const auditService = new AuditService();
const evidenceService = new EvidenceService();
const userService = new UserService();
const auditItemRepository = new AuditItemRepository();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
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
router.get('/dashboard/metrics', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const stats = await auditService.getAuditStats();
    const total = stats.byStatus?.reduce((acc, it) => acc + it.count, 0) || 0;
    res.json({
      total_audits: total,
      by_status: stats.byStatus || []
    });
  } catch (error) {
    console.error('Error en métricas dashboard:', error);
    res.status(500).json({ error: error.message });
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
router.get('/reports/stats', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const audits = await auditService.getAllAudits();
    const finished = audits.filter((a) => ['APROBADO', 'RECHAZADO'].includes(a.status));
    const approved = audits.filter((a) => a.status === 'APROBADO').length;
    const rejected = audits.filter((a) => a.status === 'RECHAZADO').length;
    res.json({
      total_reports: finished.length,
      approved_reports: approved,
      rejected_reports: rejected,
      completion_rate: audits.length ? Math.round((finished.length / audits.length) * 100) : 0
    });
  } catch (error) {
    console.error('Error obteniendo reporte stats:', error);
    res.status(500).json({ error: error.message });
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
router.get('/:id(\\d+)', async (req, res) => {
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

router.put('/:id(\\d+)', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
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

router.delete('/:id(\\d+)', requireRole(['ADMIN']), async (req, res) => {
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

router.put('/:id(\\d+)/scores', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
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
router.get('/:id(\\d+)/items', requireRole(['ADMIN', 'AUDITOR', 'CLIENTE']), async (req, res) => {
  try {
    const items = await auditItemRepository.getByAuditId(parseInt(req.params.id));
    res.json(items);
  } catch (error) {
    console.error('Error al obtener items:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id(\\d+)/items', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    await auditItemRepository.updateScores(parseInt(req.params.id), req.body.items || []);
    const items = await auditItemRepository.getByAuditId(parseInt(req.params.id));
    res.json(items);
  } catch (error) {
    console.error('Error al actualizar items:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id(\\d+)/assign', requireRole(['ADMIN']), async (req, res) => {
  try {
    const userId = parseInt(req.body.userId);
    if (!userId) return res.status(400).json({ error: 'userId requerido' });
    const result = await auditService.assignAudit(parseInt(req.params.id), userId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al asignar auditoría:', error);
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id(\\d+)/assign', requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await auditService.unassignAudit(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    console.error('Error al desasignar auditoría:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id(\\d+)/status', requireRole(['ADMIN']), async (req, res) => {
  try {
    const audit = await auditService.updateAudit(parseInt(req.params.id), { status: req.body.status }, req.user.id);
    res.json(audit);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id(\\d+)/evidences', async (req, res) => {
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
router.post('/:id(\\d+)/evidences', requireRole(['ADMIN', 'AUDITOR']), upload.single('file'), async (req, res) => {
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
router.delete('/:id(\\d+)/evidences/:evidenceId(\\d+)', requireRole(['ADMIN', 'AUDITOR']), async (req, res) => {
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
router.get('/:id(\\d+)/pdf', requireRole(['ADMIN', 'AUDITOR', 'CLIENTE']), async (req, res) => {
  try {
    const auditId = parseInt(req.params.id);
    const audit = await auditService.getAuditById(auditId);
    const items = await auditItemRepository.getByAuditId(auditId);

    const totalWeight = items.reduce((acc, it) => acc + (Number(it.weight) || 0), 0);
    const totalScore = items.reduce((acc, it) => acc + (Number(it.score) || 0), 0);
    const percent = totalWeight ? ((totalScore / totalWeight) * 100) : 0;
    const concept = percent >= 90 ? 'Favorable' : percent >= 60 ? 'Favorable con requerimiento' : 'Desfavorable';

    const fileName = `audit-${auditId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ margin: 24, size: 'A4' });
    doc.pipe(res);

    const sections = [
      { code: '1.', title: 'INSTALACIONES FISICAS', items: ['1.1', '1.2', '1.3', '1.4'] },
      { code: '2.', title: 'EQUIPOS Y UTENSILIOS', items: ['2.1', '2.2'] },
      { code: '3.', title: 'PERSONAL MANIPULADOR', items: ['3.1', '3.2', '3.3', '3.4'] },
      { code: '4.', title: 'REQUISITOS HIGIENICOS', items: ['4.1', '4.2', '4.3', '4.4'] },
      { code: '5.', title: 'SANEAMIENTO', items: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6'] }
    ];
    const itemByCode = {};
    items.forEach((it) => { itemByCode[it.code] = it; });

    const pageWidth = 595;
    const left = 28;
    const right = pageWidth - 28;
    const tableLeft = 34;
    const tableRight = 560;
    const colCode = 62;
    const colAspect = 320;
    const colCalif = 395;
    const colObs = 560;

    const drawHeader = (pageNo, totalPagesLabel = '4') => {
      doc.rect(left, 28, right - left, 44).stroke();
      doc.rect(left, 28, 120, 44).stroke();
      doc.rect(400, 28, right - 400, 44).stroke();
      doc.moveTo(400, 42).lineTo(right, 42).stroke();
      doc.moveTo(400, 56).lineTo(right, 56).stroke();

      doc.font('Helvetica-Bold').fontSize(9).text('FORMATO ACTA DE AUDITORIA INTERNA', 165, 42, { width: 210, align: 'center' });
      doc.fontSize(10).text(`N° ${audit.id}`, 260, 55);
      doc.font('Helvetica').fontSize(7)
        .text('Codigo: EPS001', 406, 32)
        .text('Version: 1', 406, 46)
        .text(`Paginas: ${pageNo} de ${totalPagesLabel}`, 406, 60);

      doc.fontSize(9)
        .text(`ESTABLECIMIENTO: ${audit.title || '-'}`, left, 84)
        .text(`SEDE: ${audit.description || '-'}`, left, 99)
        .text(`FECHA: ${audit.scheduled_visit_date || (audit.created_at || '').toString().substring(0, 10)}`, left, 114);

      doc.rect(tableLeft, 140, tableRight - tableLeft, 18).stroke();
      doc.moveTo(colCode, 140).lineTo(colCode, 158).stroke();
      doc.moveTo(colAspect, 140).lineTo(colAspect, 158).stroke();
      doc.moveTo(colCalif, 140).lineTo(colCalif, 158).stroke();
      doc.font('Helvetica-Bold').fontSize(8)
        .text('ASPECTOS A VERIFICAR', 130, 146)
        .text('CALIFICACION', 332, 146)
        .text('OBSERVACIONES', 444, 146);
    };

    const drawFooterNotice = () => {
      doc.rect(tableLeft, 786, tableRight - tableLeft, 12).stroke();
      doc.font('Helvetica-Bold').fontSize(6).text('EL FORMATO IMPRESO DE ESTE DOCUMENTO ES UNA COPIA CONTROLADA', 180, 790);
    };

    const drawRow = (y, { code = '', label = '', score = '', obs = '', isBold = false }) => {
      const h = 16;
      doc.rect(tableLeft, y, tableRight - tableLeft, h).stroke();
      doc.moveTo(colCode, y).lineTo(colCode, y + h).stroke();
      doc.moveTo(colAspect, y).lineTo(colAspect, y + h).stroke();
      doc.moveTo(colCalif, y).lineTo(colCalif, y + h).stroke();
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      doc.text(code, tableLeft + 4, y + 4, { width: colCode - tableLeft - 6 });
      doc.text(label, colCode + 4, y + 4, { width: colAspect - colCode - 8 });
      doc.text(score, colAspect + 4, y + 4, { width: colCalif - colAspect - 8 });
      doc.text(obs, colCalif + 4, y + 4, { width: tableRight - colCalif - 8 });
      return y + h;
    };

    const page1Sections = sections.slice(0, 3);
    const page2Sections = [sections[2], sections[3], sections[4]];

    drawHeader(1);
    let y = 158;
    page1Sections.forEach((section) => {
      y = drawRow(y, { code: section.code, label: section.title, isBold: true });
      let blockSum = 0;
      section.items.forEach((code) => {
        const row = itemByCode[code];
        if (!row) return;
        const score = Number(row.score) || 0;
        blockSum += score;
        y = drawRow(y, {
          code,
          label: row.label || '',
          score: `${score.toFixed(1)} / ${Number(row.weight) || 0}`,
          obs: ''
        });
      });
      y = drawRow(y, { code: '', label: 'CALIFICACION DEL BLOQUE', score: blockSum.toFixed(1), isBold: true });
    });
    drawFooterNotice();

    doc.addPage();
    drawHeader(2);
    y = 158;
    // page 2 starts from 3.4 onward as in your sample
    y = drawRow(y, { code: '3.4', label: itemByCode['3.4']?.label || 'Educacion y capacitacion', score: `${(Number(itemByCode['3.4']?.score) || 0).toFixed(1)} / ${Number(itemByCode['3.4']?.weight) || 0}` });
    y = drawRow(y, { code: '', label: 'CALIFICACION DEL BLOQUE', score: ((Number(itemByCode['3.1']?.score) || 0) + (Number(itemByCode['3.2']?.score) || 0) + (Number(itemByCode['3.3']?.score) || 0) + (Number(itemByCode['3.4']?.score) || 0)).toFixed(1), isBold: true });
    page2Sections.slice(1).forEach((section) => {
      y = drawRow(y, { code: section.code, label: section.title, isBold: true });
      let blockSum = 0;
      section.items.forEach((code) => {
        const row = itemByCode[code];
        if (!row) return;
        const score = Number(row.score) || 0;
        blockSum += score;
        y = drawRow(y, {
          code,
          label: row.label || '',
          score: `${score.toFixed(1)} / ${Number(row.weight) || 0}`,
          obs: ''
        });
      });
      y = drawRow(y, { code: '', label: 'CALIFICACION DEL BLOQUE', score: blockSum.toFixed(1), isBold: true });
    });
    drawFooterNotice();

    const findings = items.filter((it) => it.observations && String(it.observations).trim()).map((it) => `${it.code}: ${it.observations}`);
    doc.addPage();
    drawHeader(3);
    doc.fontSize(10).font('Helvetica-Bold').text('8. HALLAZGOS', 34, 142);
    doc.font('Helvetica').fontSize(9);
    let fy = 158;
    (findings.length ? findings : ['Sin hallazgos registrados']).forEach((line) => {
      if (fy > 760) return;
      doc.text(line, 40, fy, { width: 500 });
      fy = doc.y + 4;
    });

    const evidences = await evidenceService.getEvidencesByAudit(auditId);
    fy += 12;
    doc.font('Helvetica-Bold').fontSize(10).text('9. EVIDENCIAS', 34, fy);
    doc.font('Helvetica').fontSize(9);
    fy += 14;
    (evidences.length ? evidences.map((e, i) => `${i + 1}. ${e.file_path}`) : ['Sin evidencias registradas']).forEach((line) => {
      doc.text(line, 40, fy, { width: 500 });
      fy = doc.y + 3;
    });

    drawFooterNotice();

    doc.addPage();
    drawHeader(4);
    fy = 150;
    doc.font('Helvetica-Bold').fontSize(10).text('9. EVIDENCIAS Y CIERRE', 34, fy);
    fy += 20;
    doc.font('Helvetica').fontSize(9);
    (evidences.length ? evidences.map((e, i) => `${i + 1}. ${e.file_path}`) : ['Sin evidencias registradas']).slice(0, 8).forEach((line) => {
      doc.text(line, 40, fy, { width: 500 });
      fy = doc.y + 3;
    });

    fy += 18;
    doc.font('Helvetica-Bold').fontSize(9).text('% DE CUMPLIMIENTO', 40, fy).text('CONCEPTO', 210, fy);
    doc.font('Helvetica').fontSize(10).text(`${percent.toFixed(1)}%`, 40, fy + 16).text(concept, 210, fy + 16);
    doc.fontSize(8).text('Favorable 90-100% | Favorable con requerimiento 60-89.9% | Desfavorable <60%', 40, fy + 36);

    fy += 70;
    doc.font('Helvetica-Bold').fontSize(9).text('AUDITOR INTERNO', 40, fy).text('PERSONA QUE RECIBE EL ACTA', 300, fy);
    doc.font('Helvetica').fontSize(9).text('Firma: ____________________', 40, fy + 16).text('Firma: ____________________', 300, fy + 16);
    doc.text(`Nombre: ${audit.created_by_name || ''}`, 40, fy + 32).text('Nombre: ____________________', 300, fy + 32);
    drawFooterNotice();

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
