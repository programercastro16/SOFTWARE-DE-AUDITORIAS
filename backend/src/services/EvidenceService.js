const { EvidenceRepository, AuditRepository } = require('../repositories');
const path = require('path');
const fs = require('fs');

class EvidenceService {
  constructor() {
    this.evidenceRepository = new EvidenceRepository();
    this.auditRepository = new AuditRepository();
    this.uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadEvidence(auditId, file, uploadedBy) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    if (!file) {
      throw new Error('Archivo requerido');
    }

    const audit = await this.auditRepository.getById(auditId);
    if (!audit) {
      throw new Error('Auditoría no encontrada');
    }

    this.validateFile(file);

    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.uploadsDir, fileName);

    await this.saveFile(file, filePath);

    const evidence = await this.evidenceRepository.create({
      audit_id: auditId,
      file_path: fileName
    });

    return await this.getEvidenceById(evidence.id);
  }

  async getEvidenceById(evidenceId) {
    if (!evidenceId || isNaN(evidenceId)) {
      throw new Error('ID de evidencia inválido');
    }

    const evidence = await this.evidenceRepository.getWithAuditDetails(evidenceId);
    if (!evidence) {
      throw new Error('Evidencia no encontrada');
    }

    return evidence;
  }

  async getEvidencesByAudit(auditId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const audit = await this.auditRepository.getById(auditId);
    if (!audit) {
      throw new Error('Auditoría no encontrada');
    }

    const evidences = await this.evidenceRepository.getByAuditId(auditId);
    return evidences.map(evidence => ({
      ...evidence,
      file_url: `/uploads/${evidence.file_path}`,
      file_size: this.getFileSize(evidence.file_path),
      file_type: this.getFileType(evidence.file_path)
    }));
  }

  async deleteEvidence(evidenceId, userId) {
    if (!evidenceId || isNaN(evidenceId)) {
      throw new Error('ID de evidencia inválido');
    }

    const evidence = await this.evidenceRepository.getById(evidenceId);
    if (!evidence) {
      throw new Error('Evidencia no encontrada');
    }

    const audit = await this.auditRepository.getById(evidence.audit_id);
    if (!audit) {
      throw new Error('Auditoría asociada no encontrada');
    }

    const filePath = path.join(this.uploadsDir, evidence.file_path);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.evidenceRepository.delete(evidenceId);

    return { message: 'Evidencia eliminada correctamente' };
  }

  async getEvidenceStats(auditId = null) {
    try {
      return await this.evidenceRepository.getEvidenceStats(auditId);
    } catch (error) {
      throw new Error('Error al obtener estadísticas de evidencias: ' + error.message);
    }
  }

  async getEvidencesByType(auditId, fileType) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      throw new Error('Tipo de archivo no permitido');
    }

    return await this.evidenceRepository.getByFileType(auditId, fileType);
  }

  async getEvidencesByDateRange(startDate, endDate, auditId = null) {
    if (!startDate || !endDate) {
      throw new Error('Fechas de inicio y fin requeridas');
    }

    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    return await this.evidenceRepository.getEvidencesByDateRange(startDate, endDate, auditId);
  }

  async getAuditEvidenceSummary(auditId) {
    if (!auditId || isNaN(auditId)) {
      throw new Error('ID de auditoría inválido');
    }

    const summary = await this.evidenceRepository.getAuditEvidenceSummary(auditId);
    
    if (summary && summary.file_types) {
      summary.file_types = summary.file_types.split(',').filter(Boolean);
    }

    return summary;
  }

  async downloadEvidence(evidenceId) {
    const evidence = await this.getEvidenceById(evidenceId);
    const filePath = path.join(this.uploadsDir, evidence.file_path);

    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo no encontrado');
    }

    return {
      filePath,
      fileName: evidence.file_path,
      mimeType: this.getMimeType(evidence.file_path)
    };
  }

  validateFile(file) {
    if (!file.originalname) {
      throw new Error('Nombre de archivo requerido');
    }

    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('Tipo de archivo no permitido');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo permitido (10MB)');
    }

    if (file.size === 0) {
      throw new Error('El archivo está vacío');
    }
  }

  generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${timestamp}_${random}_${sanitizedName}${extension}`;
  }

  async saveFile(file, filePath) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      
      writeStream.on('error', (error) => {
        reject(new Error('Error al guardar archivo: ' + error.message));
      });

      writeStream.on('finish', () => {
        resolve();
      });

      if (file.buffer) {
        writeStream.write(file.buffer);
      } else {
        writeStream.write(fs.readFileSync(file.path));
      }

      writeStream.end();
    });
  }

  getFileSize(fileName) {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  getFileType(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const typeMap = {
      '.pdf': 'PDF',
      '.jpg': 'Imagen',
      '.jpeg': 'Imagen',
      '.png': 'Imagen',
      '.doc': 'Documento',
      '.docx': 'Documento',
      '.xls': 'Hoja de cálculo',
      '.xlsx': 'Hoja de cálculo'
    };
    return typeMap[extension] || 'Otro';
  }

  getMimeType(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  async cleanupOrphanedFiles() {
    try {
      const allEvidences = await this.evidenceRepository.getAll();
      const filesInDb = new Set(allEvidences.map(e => e.file_path));
      
      const filesInDisk = fs.readdirSync(this.uploadsDir);
      const orphanedFiles = filesInDisk.filter(file => !filesInDb.has(file));

      for (const file of orphanedFiles) {
        const filePath = path.join(this.uploadsDir, file);
        fs.unlinkSync(filePath);
      }

      return { cleanedFiles: orphanedFiles.length };
    } catch (error) {
      throw new Error('Error al limpiar archivos huérfanos: ' + error.message);
    }
  }
}

module.exports = EvidenceService;
