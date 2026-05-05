const jwt = require('jsonwebtoken');
const UserService = require('./UserService');

class AuthService {
  constructor() {
    this.userService = new UserService();
    this.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
  }

  async login(email, password) {
    try {
      const user = await this.userService.authenticateUser(email, password);
      const token = this.generateToken(user);
      
      return {
        user,
        token,
        expiresIn: this.JWT_EXPIRES_IN
      };
    } catch (error) {
      throw new Error('Error en autenticación: ' + error.message);
    }
  }

  async registerAdmin(userData) {
    try {
      const user = await this.userService.createUser({
        ...userData,
        role: 'ADMIN'
      });
      
      const token = this.generateToken(user);
      
      return {
        user,
        token,
        expiresIn: this.JWT_EXPIRES_IN
      };
    } catch (error) {
      throw new Error('Error en registro: ' + error.message);
    }
  }

  async registerUser(userData) {
    try {
      const allowedRoles = ['AUDITOR', 'CLIENTE'];
      if (!allowedRoles.includes(userData.role)) {
        throw new Error('Rol no permitido para registro público');
      }

      const user = await this.userService.createUser(userData);
      
      return {
        user,
        message: 'Usuario creado exitosamente'
      };
    } catch (error) {
      throw new Error('Error en registro: ' + error.message);
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  refreshToken(token) {
    try {
      const payload = this.verifyToken(token);
      const newToken = this.generateToken({
        id: payload.id,
        email: payload.email,
        role: payload.role
      });
      
      return {
        token: newToken,
        expiresIn: this.JWT_EXPIRES_IN
      };
    } catch (error) {
      throw new Error('Error al refrescar token: ' + error.message);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.userService.getUserById(userId);
      
      const isValidPassword = await this.userService.authenticateUser(user.email, currentPassword);
      if (!isValidPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      await this.userService.updateUser(userId, { password: newPassword });
      
      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      throw new Error('Error al cambiar contraseña: ' + error.message);
    }
  }

  async forgotPassword(email) {
    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new Error('Email no registrado');
      }

      const resetToken = this.generateResetToken(user.id);
      
      return {
        message: 'Email de recuperación enviado',
        resetToken
      };
    } catch (error) {
      throw new Error('Error en recuperación de contraseña: ' + error.message);
    }
  }

  generateResetToken(userId) {
    return jwt.sign(
      { userId, type: 'reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  verifyResetToken(token) {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET);
      if (payload.type !== 'reset') {
        throw new Error('Token inválido');
      }
      return payload.userId;
    } catch (error) {
      throw new Error('Token de recuperación inválido o expirado');
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const userId = this.verifyResetToken(token);
      
      await this.userService.updateUser(userId, { password: newPassword });
      
      return { message: 'Contraseña restablecida exitosamente' };
    } catch (error) {
      throw new Error('Error al restablecer contraseña: ' + error.message);
    }
  }

  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  getTokenExpirationTime(token) {
    try {
      const decoded = jwt.decode(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;
