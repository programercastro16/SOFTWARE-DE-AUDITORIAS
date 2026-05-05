const GenericRepository = require('./GenericRepository');

class AuditRepository extends GenericRepository {
  constructor() {
    super('audits');
  }

  async getWithCreatedBy(status = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT a.*, u.name as created_by_name, u.email as created_by_email, u.role as created_by_role
        FROM audits a
        INNER JOIN users u ON a.created_by = u.id
      `;
      const params = [];

      if (status) {
        query += ` WHERE a.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY a.created_at DESC`;

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getWithDetails(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.*,
          u.name as created_by_name,
          u.email as created_by_email,
          u.role as created_by_role,
          COUNT(ai.id) as items_count,
          COUNT(e.id) as evidences_count,
          COUNT(s.id) as signatures_count,
          AVG(ai.score) as average_score
        FROM audits a
        INNER JOIN users u ON a.created_by = u.id
        LEFT JOIN audit_items ai ON a.id = ai.audit_id
        LEFT JOIN evidences e ON a.id = e.audit_id
        LEFT JOIN signatures s ON a.id = s.audit_id
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

  async getByStatus(status) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, u.name as created_by_name
        FROM audits a
        INNER JOIN users u ON a.created_by = u.id
        WHERE a.status = ?
        ORDER BY a.created_at DESC
      `;
      
      this.db.all(query, [status], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, u.name as created_by_name
        FROM audits a
        INNER JOIN users u ON a.created_by = u.id
        WHERE a.created_at BETWEEN ? AND ?
        ORDER BY a.created_at DESC
      `;
      
      this.db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAssignedToUser(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT a.*, u.name as created_by_name
        FROM audits a
        INNER JOIN users u ON a.created_by = u.id
        INNER JOIN audit_assignments aa ON a.id = aa.audit_id
        WHERE aa.user_id = ?
        ORDER BY a.created_at DESC
      `;
      
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async searchByTitle(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, u.name as created_by_name
        FROM audits a
        INNER JOIN users u ON a.created_by = u.id
        WHERE a.title LIKE ? OR a.description LIKE ?
        ORDER BY a.created_at DESC
      `;
      const searchPattern = `%${searchTerm}%`;
      
      this.db.all(query, [searchPattern, searchPattern], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAuditStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          COUNT(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 END) as recent_count
        FROM audits
        GROUP BY status
        ORDER BY count DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAuditsByMonth(year = new Date().getFullYear()) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%m', created_at) as month,
          COUNT(*) as count
        FROM audits
        WHERE strftime('%Y', created_at) = ?
        GROUP BY strftime('%m', created_at)
        ORDER BY month
      `;
      
      this.db.all(query, [year.toString()], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateStatus(auditId, status) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE audits 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      this.db.run(query, [status, auditId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: auditId, status, changes: this.changes });
        }
      });
    });
  }
}

module.exports = AuditRepository;
