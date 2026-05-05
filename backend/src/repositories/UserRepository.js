const GenericRepository = require('./GenericRepository');

class UserRepository extends GenericRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE email = ?`;
      this.db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async findByRole(role) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE role = ? ORDER BY name ASC`;
      this.db.all(query, [role], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAuditors() {
    return this.findByRole('AUDITOR');
  }

  async getClients() {
    return this.findByRole('CLIENTE');
  }

  async getAdmins() {
    return this.findByRole('ADMIN');
  }

  async getWithAuditCount(userId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT u.*, COUNT(a.id) as audit_count
        FROM users u
        LEFT JOIN audits a ON u.id = a.created_by
      `;
      const params = [];

      if (userId) {
        query += ` WHERE u.id = ?`;
        params.push(userId);
      }

      query += ` GROUP BY u.id ORDER BY u.name ASC`;

      if (userId) {
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

  async getAssignedAudits(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT a.* 
        FROM audits a
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

  async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET last_login = datetime('now') WHERE id = ?`;
      
      this.db.run(query, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: userId, changes: this.changes });
        }
      });
    });
  }

  async searchByNameOrEmail(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM users 
        WHERE name LIKE ? OR email LIKE ?
        ORDER BY name ASC
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

  async getUserStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          role,
          COUNT(*) as count,
          COUNT(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 END) as recent_count
        FROM users
        GROUP BY role
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
}

module.exports = UserRepository;
