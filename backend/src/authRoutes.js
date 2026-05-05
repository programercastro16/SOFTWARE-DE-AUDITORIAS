const express = require('express');
const { AuthService, UserService } = require('./services');
const { AuthDTO, UserDTO } = require('./dto');

const router = express.Router();
const authService = new AuthService();
const userService = new UserService();


/**
 * @swagger
 * /auth/register-admin:
 *   post:
 *     summary: Registrar administrador
 *     description: Crea un nuevo usuario con rol de administrador
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: Administrador creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register-admin', async (req, res) => {
  try {
    const result = await authService.registerAdmin(req.body);
    const response = AuthDTO.toRegisterResponse(result.user, result.token, result.expiresIn);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error en register-admin:', error);
    const errorResponse = AuthDTO.toErrorResponse(error.message, 400);
    res.status(400).json(errorResponse);
  }
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Listar usuarios
 *     description: Obtiene la lista de usuarios (excluyendo administradores)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers('ADMIN');
    const response = UserDTO.toListResponse(users);
    res.json(response);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    const errorResponse = AuthDTO.toErrorResponse(error.message, 500);
    res.status(500).json(errorResponse);
  }
});

/**
 * @swagger
 * /auth/users:
 *   post:
 *     summary: Crear usuario
 *     description: Crea un nuevo usuario con rol AUDITOR o CLIENTE
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    const response = AuthDTO.toRegisterResponse(user);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    const errorResponse = AuthDTO.toErrorResponse(error.message, 400);
    res.status(400).json(errorResponse);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve un token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    const response = AuthDTO.toLoginResponse(result.user, result.token, result.expiresIn);
    res.json(response);
  } catch (error) {
    console.error('Error en login:', error);
    const errorResponse = AuthDTO.toErrorResponse(error.message, 401);
    res.status(401).json(errorResponse);
  }
});

function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Token requerido' });

    const [, token] = header.split(' ');
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
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

