const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const { AuditRepository, EvidenceRepository, AuditItemRepository } = require('./repositories');
const { requireRole } = require('./authRoutes');

const router = express.Router();

const auditRepository = new AuditRepository();
const evidenceRepository = new EvidenceRepository();
const auditItemRepository = new AuditItemRepository();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

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

const baseItemByCode = BASE_ITEMS.reduce((acc, item) => {
  acc[item.code] = item;
  return acc;
}, {});

router.post('/:id/assign', requireRole(['ADMIN']), (req, res) => {
  const auditId = req.params.id;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });

  db.run('DELETE FROM audit_assignments WHERE audit_id = ?', [auditId], (errDel) => {
    if (errDel) return res.status(500).json({ error: 'Error al asignar' });
    const stmt = db.prepare(
      'INSERT INTO audit_assignments (audit_id, user_id) VALUES (?, ?)'
    );
    stmt.run(auditId, userId, function (err) {
      if (err) return res.status(500).json({ error: 'Error al asignar auditoría' });
      res.status(201).json({ id: this.lastID, audit_id: auditId, user_id: userId });
    });
  });
});

router.delete('/:id/assign', requireRole(['ADMIN']), (req, res) => {
  const auditId = req.params.id;
  db.run('DELETE FROM audit_assignments WHERE audit_id = ?', [auditId], (err) => {
    if (err) return res.status(500).json({ error: 'Error al desasignar' });
    res.status(204).send();
  });
});

router.post('/', requireRole(['ADMIN']), (req, res) => {
  const { title, description, status, scheduled_visit_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Título requerido' });

  const stmt = db.prepare(
    'INSERT INTO audits (title, description, status, scheduled_visit_date, created_by) VALUES (?, ?, ?, ?, ?)'
  );
  const initialStatus =
    ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'].includes(status) && status
      ? status
      : 'BORRADOR';

  const visitDate = scheduled_visit_date && /^\d{4}-\d{2}-\d{2}$/.test(scheduled_visit_date)
    ? scheduled_visit_date
    : null;

  stmt.run(title, description || '', initialStatus, visitDate, req.user.id, function (err) {
    if (err) return res.status(500).json({ error: 'Error al crear auditoría' });

    const auditId = this.lastID;

    const itemStmt = db.prepare(
      'INSERT INTO audit_items (audit_id, code, label, weight, score, category) VALUES (?, ?, ?, ?, ?, ?)'
    );
    BASE_ITEMS.forEach((item) => {
      itemStmt.run(
        auditId,
        item.code,
        item.label,
        item.weight,
        0,
        item.category
      );
    });
    itemStmt.finalize();

    db.get('SELECT * FROM audits WHERE id = ?', [auditId], (err2, row) => {
      if (err2) return res.status(500).json({ error: 'Error al obtener auditoría' });
      res.status(201).json(row);
    });
  });
});

router.get('/', (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Token requerido' });

  if (user.role === 'ADMIN') {
    db.all(
      `SELECT a.*, u.name as created_by_name,
        (SELECT aa.user_id FROM audit_assignments aa WHERE aa.audit_id = a.id LIMIT 1) as assigned_to_user_id,
        (SELECT u2.name FROM audit_assignments aa JOIN users u2 ON u2.id = aa.user_id WHERE aa.audit_id = a.id LIMIT 1) as assigned_to_name
       FROM audits a
       JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al listar auditorías' });
        res.json(rows);
      }
    );
  } else {
    db.all(
      `SELECT a.*, u.name as created_by_name
       FROM audits a
       JOIN users u ON a.created_by = u.id
       JOIN audit_assignments aa ON aa.audit_id = a.id
       WHERE aa.user_id = ?
       ORDER BY a.created_at DESC`,
      [user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al listar auditorías asignadas' });
        res.json(rows);
      }
    );
  }
});

router.patch('/:id/status', requireRole(['ADMIN']), (req, res) => {
  const auditId = req.params.id;
  const { status } = req.body;
  const allowed = ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const stmt = db.prepare(
    'UPDATE audits SET status = ?, updated_at = datetime("now") WHERE id = ?'
  );
  stmt.run(status, auditId, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar estado' });

    db.get('SELECT * FROM audits WHERE id = ?', [auditId], (err2, row) => {
      if (err2 || !row)
        return res.status(500).json({ error: 'Error al leer auditoría actualizada' });
      res.json(row);
    });
  });
});

router.delete('/:id', requireRole(['ADMIN']), (req, res) => {
  const auditId = req.params.id;

  const deleteItems = db.prepare('DELETE FROM audit_items WHERE audit_id = ?');
  const deleteEvidences = db.prepare('DELETE FROM evidences WHERE audit_id = ?');
  const deleteSignatures = db.prepare('DELETE FROM signatures WHERE audit_id = ?');

  deleteItems.run(auditId);
  deleteEvidences.run(auditId);
  deleteSignatures.run(auditId);

  const stmt = db.prepare('DELETE FROM audits WHERE id = ?');
  stmt.run(auditId, function (err) {
    if (err) return res.status(500).json({ error: 'Error al eliminar auditoría' });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Auditoría no encontrada' });
    }
    res.status(204).send();
  });
});

router.get('/:id/items', requireRole(['ADMIN', 'AUDITOR']), (req, res) => {
  const auditId = req.params.id;
  db.all(
    'SELECT * FROM audit_items WHERE audit_id = ? ORDER BY code',
    [auditId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener ítems' });
      res.json(rows);
    }
  );
});

router.put('/:id/items', requireRole(['ADMIN', 'AUDITOR']), (req, res) => {
  const auditId = req.params.id;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items debe ser un arreglo' });
  }

  const updateStmt = db.prepare(
    'UPDATE audit_items SET score = ?, observations = ?, updated_at = datetime("now") WHERE id = ? AND audit_id = ?'
  );

  items.forEach((item) => {
    updateStmt.run(
      item.score ?? 0,
      item.observations || '',
      item.id,
      auditId
    );
  });

  updateStmt.finalize((err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar ítems' });

    db.all(
      'SELECT * FROM audit_items WHERE audit_id = ? ORDER BY code',
      [auditId],
      (err2, rows) => {
        if (err2)
          return res.status(500).json({ error: 'Error al obtener ítems actualizados' });
        res.json(rows);
      }
    );
  });
});

router.post(
  '/:id/evidences',
  requireRole(['ADMIN', 'AUDITOR']),
  upload.single('file'),
  (req, res) => {
    const auditId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);

    const stmt = db.prepare(
      'INSERT INTO evidences (audit_id, file_path) VALUES (?, ?)'
    );
    stmt.run(auditId, relativePath, function (err) {
      if (err) return res.status(500).json({ error: 'Error al guardar evidencia' });

      res.status(201).json({
        id: this.lastID,
        audit_id: auditId,
        file_path: relativePath.replace(/\\/g, '/'),
      });
    });
  }
);

router.get('/:id/evidences', requireRole(['ADMIN', 'AUDITOR']), (req, res) => {
  const auditId = req.params.id;
  db.all(
    'SELECT id, audit_id, file_path, created_at FROM evidences WHERE audit_id = ? ORDER BY created_at DESC',
    [auditId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener evidencias' });
      res.json(
        rows.map((row) => ({
          ...row,
          file_path: row.file_path.replace(/\\/g, '/'),
        }))
      );
    }
  );
});

router.post(
  '/:id/signatures',
  requireRole(['ADMIN', 'AUDITOR']),
  upload.single('file'),
  (req, res) => {
    const auditId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);

    const stmt = db.prepare(
      'INSERT INTO signatures (audit_id, signed_by, image_path) VALUES (?, ?, ?)'
    );
    stmt.run(auditId, req.user.id, relativePath, function (err) {
      if (err) return res.status(500).json({ error: 'Error al guardar firma' });

      res.status(201).json({
        id: this.lastID,
        audit_id: auditId,
        signed_by: req.user.id,
        image_path: relativePath,
      });
    });
  }
);

router.get('/:id/pdf', requireRole(['ADMIN', 'AUDITOR', 'CLIENTE']), (req, res) => {
  const auditId = req.params.id;

  db.get('SELECT * FROM audits WHERE id = ?', [auditId], (err, audit) => {
    if (err || !audit) {
      return res.status(404).json({ error: 'Auditoría no encontrada' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-${auditId}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    doc.pipe(res);

    const drawHeader = (pageNumber) => {
      const { width } = doc.page;
      doc
        .fontSize(10)
        .text('FORMATO ACTA DE AUDITORIA INTERNA', 60, 50, { width: width - 200 });

      doc
        .fontSize(9)
        .text('Código: EPS001', width - 150, 40)
        .text('Versión: 1', width - 150, 55)
        .text(`Página: ${pageNumber}`, width - 150, 70)
        .text(
          `Fecha de emisión: ${
            (audit.created_at || '').toString().substring(0, 10)
          }`,
          width - 150,
          85
        );

      if (pageNumber === 1) {
        doc
          .fontSize(11)
          .text(`Nº  ${audit.id}`, width / 2 - 30, 70, { width: 80, align: 'center' });

        doc
          .fontSize(10)
          .text(`ESTABLECIMIENTO: ${audit.title}`, 40, 115)
          .text(`SEDE: ${audit.description || ''}`, 40, 135)
          .text(
            `FECHA: ${(audit.created_at || '').toString().substring(0, 10)}`,
            40,
            155
          );
      }

      doc
        .fontSize(7)
        .text(
          'EL FORMATO IMPRESO DE ESTE DOCUMENTO ES UNA COPIA CONTROLADA',
          40,
          doc.page.height - 40,
          { align: 'center' }
        );
    };

    const SECTIONS_PAGE1 = [
      {
        code: '1.',
        title: 'INSTALACIONES FÍSICAS',
        items: ['1.1', '1.2', '1.3', '1.4'],
      },
      {
        code: '2.',
        title: 'EQUIPOS Y UTENSILIOS',
        items: ['2.1', '2.2'],
      },
      {
        code: '3.',
        title: 'PERSONAL MANIPULADOR',
        items: ['3.1', '3.2', '3.3'],
      },
    ];

    const SECTIONS_PAGE2 = [
      {
        code: '3.4',
        title: 'Educación y capacitación',
        items: ['3.4'],
      },
      {
        code: '4.',
        title: 'REQUISITOS HIGIÉNICOS',
        items: ['4.1', '4.2', '4.3', '4.4'],
      },
      {
        code: '5.',
        title: 'SANEAMIENTO',
        items: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6'],
      },
    ];

    const drawTable = (sections, startY, itemMap) => {
      let y = startY;
      const colX = { num: 40, aspect: 70, calif: 350, obs: 450 };

      doc.fontSize(8).text('ASPECTOS A VERIFICAR', colX.aspect, y);
      doc.text('CALIFICACIÓN', colX.calif, y);
      doc.text('OBSERVACIONES', colX.obs, y);
      y += 14;

      sections.forEach((section) => {
        doc.fontSize(8).text(section.code, colX.num, y);
        doc.font('Helvetica-Bold').text(section.title, colX.aspect, y);
        doc.font('Helvetica');
        y += 10;

        section.items.forEach((code) => {
          const base = baseItemByCode[code];
          const item = itemMap[code];
          const califText =
            item && base
              ? `${item.score ?? 0} / ${base.weight}`
              : base
              ? `0 / ${base.weight}`
              : '';

          doc.text(code, colX.num, y);
          doc.text(base ? base.label : '', colX.aspect, y, { width: 260 });
          doc.text(califText, colX.calif, y);
          doc.text(item && item.observations ? item.observations : '', colX.obs, y);
          y += 10;
        });

        y += 4;
      });
    };

    db.all(
      'SELECT code, weight, score, observations FROM audit_items WHERE audit_id = ?',
      [auditId],
      (errItems, rows) => {
        const itemMap = {};
        let totalWeight = 0;
        let totalScore = 0;

        if (!errItems && Array.isArray(rows)) {
          rows.forEach((r) => {
            itemMap[r.code] = r;
            totalWeight += r.weight;

            if (typeof r.score === 'number') {
              totalScore += r.score;
            } else if (r.score != null) {
              const parsed = parseFloat(r.score);
              if (!Number.isNaN(parsed)) {
                totalScore += parsed;
              }
            }
          });
        }

        const percent =
          totalWeight > 0 ? Math.max(0, Math.min(100, (totalScore / totalWeight) * 100)) : 0;

        let concept = 'Desfavorable';
        if (percent >= 90) {
          concept = 'Favorable';
        } else if (percent >= 60) {
          concept = 'Favorable con requerimiento';
        }

        db.all(
          'SELECT file_path FROM evidences WHERE audit_id = ? ORDER BY created_at ASC',
          [auditId],
          (evErr, evRows) => {
            const evidencePaths =
              !evErr && Array.isArray(evRows)
                ? evRows.map((r) => r.file_path)
                : [];

            db.get(
              'SELECT s.image_path, u.name as user_name FROM signatures s LEFT JOIN users u ON s.signed_by = u.id WHERE s.audit_id = ? ORDER BY s.created_at DESC LIMIT 1',
              [auditId],
              (sigErr, sigRow) => {
                let currentPage = 1;
                drawHeader(currentPage);
                // Tabla principal, un poco más abajo del encabezado
                drawTable(SECTIONS_PAGE1, 180, itemMap);

                doc.addPage();
                currentPage += 1;
                drawHeader(currentPage);
                // Subimos un poco la tabla de la página 2 para reducir
                // el espacio blanco entre el contenido y el pie de página.
                drawTable(SECTIONS_PAGE2, 130, itemMap);

                // En lugar de una tercera página en blanco para pocos textos,
                // reutilizamos la misma segunda página para "HALLAZGOS" y siguientes.
                let currentY = doc.y + 30;
                doc
                  .fontSize(10)
                  .text('8. HALLAZGOS', 40, currentY, { underline: true })
                  .moveDown();
                doc
                  .fontSize(9)
                  .text(audit.description || '', {
                    align: 'left',
                  });

                currentY = doc.y + 20;
                if (evidencePaths.length) {
                  doc
                    .fontSize(10)
                    .text('9. EVIDENCIAS FOTOGRÁFICAS', 40, currentY, { underline: true });
                  currentY = doc.y + 10;

                  const startX = 40;
                  const maxWidth = doc.page.width - 80;
                  const thumbWidth = 120;
                  const thumbHeight = 80;
                  const gapX = 20;
                  const gapY = 30;
                  const perRow = Math.max(
                    1,
                    Math.floor((maxWidth + gapX) / (thumbWidth + gapX))
                  );

                  evidencePaths.forEach((relPath, index) => {
                    const col = index % perRow;
                    const row = Math.floor(index / perRow);
                    let x = startX + col * (thumbWidth + gapX);
                    let y = currentY + row * (thumbHeight + gapY);

                    if (y + thumbHeight + 120 > doc.page.height - 60) {
                      doc.addPage();
                      currentPage += 1;
                      drawHeader(currentPage);
                      currentY = 140;
                      y = currentY;
                    }

                    const absPath = path.join(__dirname, '..', relPath);
                    try {
                      doc.image(absPath, x, y, {
                        fit: [thumbWidth, thumbHeight],
                        align: 'center',
                        valign: 'center',
                      });
                    } catch (e) {
                      // si falla la imagen, continuamos con las demás
                    }
                  });

                  currentY =
                    currentY +
                    Math.ceil(evidencePaths.length / perRow) * (thumbHeight + gapY) +
                    10;
                }

                // Si no hay suficiente espacio para el resumen y firma, usar una nueva página.
                if (currentY + 220 > doc.page.height - 60) {
                  doc.addPage();
                  currentPage += 1;
                  drawHeader(currentPage);
                  currentY = 140;
                }

                const baseY = currentY;
                doc
                  .fontSize(10)
                  .text('% DE CUMPLIMIENTO', 40, baseY)
                  .text('CONCEPTO', 220, baseY);

                doc
                  .fontSize(12)
                  .text(`${percent.toFixed(1)}%`, 40, baseY + 20)
                  .text(concept, 220, baseY + 20);

                doc
                  .fontSize(9)
                  .text('Favorable: 90-100%', 40, baseY + 60)
                  .text('Favorable con requerimiento: 60-89.9%', 40, baseY + 75)
                  .text('Desfavorable: <59.9%', 40, baseY + 90);

                if (sigRow && sigRow.image_path) {
                  const sigPath = path.join(__dirname, '..', sigRow.image_path);
                  try {
                    const sigBaseY = baseY + 130;
                    doc
                      .fontSize(10)
                      .text('Firma del auditor interno', 40, sigBaseY);
                    doc.image(sigPath, 40, sigBaseY + 20, {
                      width: 120,
                      height: 60,
                      fit: [120, 60],
                    });
                    doc
                      .fontSize(9)
                      .text(sigRow.user_name || '', 40, sigBaseY + 85, {
                        width: 160,
                        align: 'center',
                      });
                  } catch (e) {
                    // si falla la imagen, seguimos sin romper el PDF
                  }
                }

                doc.end();
              }
            );
          }
        );
      }
    );
  });
});

router.get('/dashboard/metrics', requireRole(['ADMIN', 'AUDITOR']), (req, res) => {
  db.get(
    'SELECT COUNT(*) as total_audits FROM audits',
    [],
    (err, totalRow) => {
      if (err) return res.status(500).json({ error: 'Error al obtener métricas' });

      db.all(
        "SELECT status, COUNT(*) as count FROM audits GROUP BY status",
        [],
        (err2, statusRows) => {
          if (err2)
            return res.status(500).json({ error: 'Error al obtener métricas' });

          res.json({
            total_audits: totalRow.total_audits,
            by_status: statusRows,
          });
        }
      );
    }
  );
});

module.exports = router;

