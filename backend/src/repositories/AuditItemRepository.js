const GenericRepository = require('./GenericRepository');

class AuditItemRepository extends GenericRepository {
  constructor() {
    super('audit_items');
  }

  async getByAuditId(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM audit_items 
        WHERE audit_id = ?
        ORDER BY code ASC
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

  async getByCategory(auditId, category) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM audit_items 
        WHERE audit_id = ? AND category = ?
        ORDER BY code ASC
      `;
      
      this.db.all(query, [auditId, category], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getCategoriesByAudit(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT category 
        FROM audit_items 
        WHERE audit_id = ?
        ORDER BY category ASC
      `;
      
      this.db.all(query, [auditId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.category));
        }
      });
    });
  }

  async updateScores(auditId, items) {
    return new Promise((resolve, reject) => {
      const transaction = this.db;
      
      transaction.serialize(() => {
        transaction.run('BEGIN TRANSACTION');
        
        const updatePromises = items.map(item => {
          return new Promise((resolveUpdate, rejectUpdate) => {
            const query = `
              UPDATE audit_items 
              SET score = ?, observations = ?, updated_at = datetime('now')
              WHERE audit_id = ? AND code = ?
            `;
            
            transaction.run(query, [item.score, item.observations, auditId, item.code], function(err) {
              if (err) {
                rejectUpdate(err);
              } else {
                resolveUpdate({ code: item.code, changes: this.changes });
              }
            });
          });
        });

        Promise.all(updatePromises)
          .then(results => {
            transaction.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(results);
              }
            });
          })
          .catch(err => {
            transaction.run('ROLLBACK');
            reject(err);
          });
      });
    });
  }

  async getAuditSummary(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_items,
          SUM(weight) as total_weight,
          SUM(score * weight) as weighted_score,
          AVG(score) as average_score,
          COUNT(CASE WHEN score >= 90 THEN 1 END) as favorable_count,
          COUNT(CASE WHEN score >= 60 AND score < 90 THEN 1 END) as favorable_requirement_count,
          COUNT(CASE WHEN score < 60 THEN 1 END) as unfavorable_count
        FROM audit_items
        WHERE audit_id = ?
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

  async getAuditScoreByCategory(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          category,
          COUNT(*) as item_count,
          SUM(weight) as total_weight,
          AVG(score) as average_score,
          SUM(score * weight) / SUM(weight) as weighted_score
        FROM audit_items
        WHERE audit_id = ?
        GROUP BY category
        ORDER BY category ASC
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

  async getItemsWithObservations(auditId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM audit_items 
        WHERE audit_id = ? AND observations IS NOT NULL AND observations != ''
        ORDER BY code ASC
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

  async getCriticalItems(auditId, threshold = 60) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM audit_items 
        WHERE audit_id = ? AND score < ?
        ORDER BY score ASC, code ASC
      `;
      
      this.db.all(query, [auditId, threshold], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async createBulkItems(auditId, baseItems) {
    return new Promise((resolve, reject) => {
      const transaction = this.db;
      
      transaction.serialize(() => {
        transaction.run('BEGIN TRANSACTION');
        
        const insertPromises = baseItems.map(item => {
          return new Promise((resolveInsert, rejectInsert) => {
            const query = `
              INSERT INTO audit_items (audit_id, code, label, weight, score, category)
              VALUES (?, ?, ?, ?, 0, ?)
            `;
            
            transaction.run(query, [auditId, item.code, item.label, item.weight, item.category], function(err) {
              if (err) {
                rejectInsert(err);
              } else {
                resolveInsert({ id: this.lastID, code: item.code });
              }
            });
          });
        });

        Promise.all(insertPromises)
          .then(results => {
            transaction.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(results);
              }
            });
          })
          .catch(err => {
            transaction.run('ROLLBACK');
            reject(err);
          });
      });
    });
  }

  async deleteByAuditId(auditId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM audit_items WHERE audit_id = ?`;
      
      this.db.run(query, [auditId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ auditId, deleted: this.changes });
        }
      });
    });
  }
}

module.exports = AuditItemRepository;
