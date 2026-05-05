const GenericRepository = require('./GenericRepository');

class EvidenceRepository extends GenericRepository {
  constructor() {
    super('evidences');
  }

  async getByAuditId(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT e.*, a.title as audit_title
        FROM evidences e
        INNER JOIN audits a ON e.audit_id = a.id
        WHERE e.audit_id = ?
        ORDER BY e.created_at DESC
      `;
      
      this.db.all(query, [auditId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getWithAuditDetails(evidenceId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, a.title as audit_title, a.status as audit_status, u.name as created_by_name
        FROM evidences e
        INNER JOIN audits a ON e.audit_id = a.id
        INNER JOIN users u ON a.created_by = u.id
      `;
      const params = [];

      if (evidenceId) {
        query += ` WHERE e.id = ?`;
        params.push(evidenceId);
      }

      query += ` ORDER BY e.created_at DESC`;

      if (evidenceId) {
        this.db.get(query, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      } else {
        this.db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
        } else {
            resolve(rows);
          }
        });
      }
    });
  }

  async getByFileType(auditId, fileType) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM evidences 
        WHERE audit_id = ? AND file_path LIKE ?
        ORDER BY created_at DESC
      `;
      const filePattern = `%.${fileType}`;
      
      this.db.all(query, [auditId, filePattern], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getEvidenceStats(auditId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          COUNT(*) as total_evidences,
          COUNT(CASE WHEN file_path LIKE '%.pdf' THEN 1 END) as pdf_count,
          COUNT(CASE WHEN file_path LIKE '%.jpg' OR file_path LIKE '%.jpeg' OR file_path LIKE '%.png' THEN 1 END) as image_count,
          COUNT(CASE WHEN file_path LIKE '%.doc' OR file_path LIKE '%.docx' THEN 1 END) as document_count,
          COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as recent_count
        FROM evidences
      `;
      const params = [];

      if (auditId) {
        query += ` WHERE audit_id = ?`;
        params.push(auditId);
      }

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async deleteByAuditId(auditId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM evidences WHERE audit_id = ?`;
      
      this.db.run(query, [auditId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ auditId, deleted: this.changes });
        }
      });
    });
  }

  async updateEvidencePath(evidenceId, newPath) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE evidences SET file_path = ? WHERE id = ?`;
      
      this.db.run(query, [newPath, evidenceId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: evidenceId, file_path: newPath, changes: this.changes });
        }
      });
    });
  }

  async getEvidencesByDateRange(startDate, endDate, auditId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, a.title as audit_title
        FROM evidences e
        INNER JOIN audits a ON e.audit_id = a.id
        WHERE e.created_at BETWEEN ? AND ?
      `;
      const params = [startDate, endDate];

      if (auditId) {
        query += ` AND e.audit_id = ?`;
        params.push(auditId);
      }

      query += ` ORDER BY e.created_at DESC`;

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAuditEvidenceSummary(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.id as audit_id,
          a.title as audit_title,
          COUNT(e.id) as evidence_count,
          MAX(e.created_at) as last_evidence_date,
          GROUP_CONCAT(SUBSTR(e.file_path, -3)) as file_types
        FROM audits a
        LEFT JOIN evidences e ON a.id = e.audit_id
        WHERE a.id = ?
        GROUP BY a.id
      `;
      
      this.db.get(query, [auditId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = EvidenceRepository;
