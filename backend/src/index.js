const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const { authRouter, authMiddleware, requireRole } = require('./authRoutes');
const auditsRouter = require('./auditsRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'API de auditorías funcionando' });
});

app.use('/auth', authRouter);
app.use('/audits', authMiddleware, auditsRouter);

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});


