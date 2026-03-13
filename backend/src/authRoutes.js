const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

router.post('/register-admin', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );

  stmt.run(name, email, passwordHash, 'ADMIN', function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email ya registrado' });
      }
      return res.status(500).json({ error: 'Error al crear usuario' });
    }

    const user = {
      id: this.lastID,
      name,
      email,
      role: 'ADMIN',
    };

    const token = createToken(user);
    res.status(201).json({ user, token });
  });
});

router.get('/users', (req, res) => {
  db.all(
    'SELECT id, name, email, role, created_at FROM users WHERE role != "ADMIN" ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al listar usuarios' });
      res.json(rows);
    }
  );
});

router.post('/users', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  const allowedRoles = ['AUDITOR', 'CLIENTE'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol no permitido' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );

  stmt.run(name, email, passwordHash, role, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email ya registrado' });
      }
      return res.status(500).json({ error: 'Error al crear usuario' });
    }

    const user = {
      id: this.lastID,
      name,
      email,
      role,
    };

    res.status(201).json({ user });
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });
    if (!row) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = bcrypt.compareSync(password, row.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    const token = createToken(user);
    res.json({ user, token });
  });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token requerido' });

  const [, token] = header.split(' ');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

module.exports = {
  authRouter: router,
  authMiddleware,
  requireRole,
};

