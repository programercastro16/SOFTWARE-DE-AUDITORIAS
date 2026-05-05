class EvidenceDTO {
  static toResponse(evidence) {
    if (!evidence) return null;

    return {
      id: evidence.id,
      audit_id: evidence.audit_id,
      file_path: evidence.file_path,
      file_url: `/uploads/${evidence.file_path}`,
      created_at: evidence.created_at
    };
  }

  static toDetailedResponse(evidence) {
    if (!evidence) return null;

    return {
      id: evidence.id,
      audit_id: evidence.audit_id,
      audit_title: evidence.audit_title,
      audit_status: evidence.audit_status,
      file_path: evidence.file_path,
      file_url: `/uploads/${evidence.file_path}`,
      file_name: this.extractFileName(evidence.file_path),
      file_extension: this.extractFileExtension(evidence.file_path),
      file_type: this.getFileType(evidence.file_path),
      file_size: evidence.file_size || 0,
      file_size_display: this.formatFileSize(evidence.file_size || 0),
      mime_type: this.getMimeType(evidence.file_path),
      created_at: evidence.created_at,
      created_by_name: evidence.created_by_name,
      can_delete: this.canDeleteEvidence(evidence),
      can_download: true
    };
  }

  static toListResponse(evidences) {
    if (!Array.isArray(evidences)) return [];

    return evidences.map(evidence => ({
      ...this.toResponse(evidence),
      file_name: this.extractFileName(evidence.file_path),
      file_type: this.getFileType(evidence.file_path),
      file_size_display: this.formatFileSize(evidence.file_size || 0)
    }));
  }

  static toCreateResponse(evidence) {
    if (!evidence) return null;

    return {
      id: evidence.id,
      audit_id: evidence.audit_id,
      file_url: `/uploads/${evidence.file_path}`,
      file_name: this.extractFileName(evidence.file_path),
      file_type: this.getFileType(evidence.file_path),
      created_at: evidence.created_at,
      message: 'Evidencia subida exitosamente'
    };
  }

  static toStatsResponse(stats) {
    if (!stats) return null;

    return {
      total_evidences: stats.total_evidences || 0,
      by_type: [
        { type: 'PDF', count: stats.pdf_count || 0, icon: '📄' },
        { type: 'Imagen', count: stats.image_count || 0, icon: '🖼️' },
        { type: 'Documento', count: stats.document_count || 0, icon: '📝' }
      ],
      recent_evidences: stats.recent_count || 0,
      storage_used: this.formatFileSize((stats.pdf_count || 0) * 1024 * 1024 + (stats.image_count || 0) * 512 * 1024)
    };
  }

  static toSummaryResponse(summary) {
    if (!summary) return null;

    return {
      audit_id: summary.audit_id,
      audit_title: summary.audit_title,
      evidence_count: summary.evidence_count || 0,
      last_evidence_date: summary.last_evidence_date,
      file_types: (summary.file_types || []).map(type => ({
        type: this.getFileType(type),
        count: summary.file_types?.filter(t => t === type).length || 0
      })),
      storage_summary: this.calculateStorageSummary(summary.file_types || [])
    };
  }

  static toDownloadResponse(evidence, filePath) {
    if (!evidence || !filePath) return null;

    return {
      file_name: this.extractFileName(evidence.file_path),
      file_path: filePath,
      mime_type: this.getMimeType(evidence.file_path),
      file_size: evidence.file_size || 0,
      download_url: `/uploads/${evidence.file_path}`,
      created_at: evidence.created_at
    };
  }

  static extractFileName(filePath) {
    if (!filePath) return 'archivo_desconocido';
    
    const parts = filePath.split('_');
    if (parts.length < 3) return filePath;
    
    const namePart = parts.slice(2).join('_');
    const extension = this.extractFileExtension(filePath);
    
    return namePart + (extension ? `.${extension}` : '');
  }

  static extractFileExtension(filePath) {
    if (!filePath) return '';
    
    const lastDotIndex = filePath.lastIndexOf('.');
    return lastDotIndex > -1 ? filePath.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  static getFileType(filePath) {
    const extension = this.extractFileExtension(filePath);
    const typeMap = {
      'pdf': 'PDF',
      'jpg': 'Imagen',
      'jpeg': 'Imagen',
      'png': 'Imagen',
      'doc': 'Documento',
      'docx': 'Documento',
      'xls': 'Hoja de cálculo',
      'xlsx': 'Hoja de cálculo'
    };
    
    return typeMap[extension] || 'Otro';
  }

  static getMimeType(filePath) {
    const extension = this.extractFileExtension(filePath);
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static canDeleteEvidence(evidence) {
    if (!evidence) return false;
    
    const deletableStatuses = ['BORRADOR', 'ENVIADO'];
    return deletableStatuses.includes(evidence.audit_status);
  }

  static calculateStorageSummary(fileTypes) {
    const typeCounts = {};
    fileTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return {
      total_files: fileTypes.length,
      by_type: Object.keys(typeCounts).map(type => ({
        type: this.getFileType(type),
        count: typeCounts[type]
      }))
    };
  }

  static validateFile(file) {
    const errors = [];

    if (!file.originalname) {
      errors.push('Nombre de archivo requerido');
    }

    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = '.' + this.extractFileExtension(file.originalname);

    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Tipo de archivo no permitido');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('El archivo excede el tamaño máximo permitido (10MB)');
    }

    if (file.size === 0) {
      errors.push('El archivo está vacío');
    }

    return errors;
  }

  static sanitizeFileName(fileName) {
    if (!fileName) return '';

    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

module.exports = EvidenceDTO;
