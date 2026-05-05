const db = require('../db');

class GenericRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  async getAll(conditions = {}, orderBy = 'id ASC') {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM ${this.tableName}`;
      const params = [];

      if (Object.keys(conditions).length > 0) {
        const whereClauses = [];
        Object.keys(conditions).forEach(key => {
          if (key === '$ne') {
            whereClauses.push(`${Object.keys(conditions[key])[0]} != ?`);
            params.push(Object.values(conditions[key])[0]);
          } else {
            whereClauses.push(`${key} = ?`);
            params.push(conditions[key]);
          }
        });
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      query += ` ORDER BY ${orderBy}`;

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getById(id) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async create(data) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      
      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...data });
        }
      });
    });
  }

  async update(id, data) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      const params = [...values, id];
      
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...data, changes: this.changes });
        }
      });
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, deleted: this.changes > 0 });
        }
      });
    });
  }

  async findWithJoins(joinClause, selectFields = '*', conditions = {}, orderBy = 'id ASC') {
    return new Promise((resolve, reject) => {
      let query = `SELECT ${selectFields} FROM ${this.tableName} ${joinClause}`;
      const params = [];

      if (Object.keys(conditions).length > 0) {
        const whereClauses = [];
        Object.keys(conditions).forEach(key => {
          whereClauses.push(`${key} = ?`);
          params.push(conditions[key]);
        });
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      query += ` ORDER BY ${orderBy}`;

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async count(conditions = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params = [];

      if (Object.keys(conditions).length > 0) {
        const whereClauses = [];
        Object.keys(conditions).forEach(key => {
          whereClauses.push(`${key} = ?`);
          params.push(conditions[key]);
        });
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async exists(id) {
    return new Promise((resolve, reject) => {
      const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }
}

module.exports = GenericRepository;
