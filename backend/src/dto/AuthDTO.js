class AuthDTO {
  static toLoginResponse(user, token, expiresIn) {
    if (!user || !token) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login || null
      },
      token,
      expires_in: expiresIn,
      token_type: 'Bearer',
      permissions: this.getUserPermissions(user.role),
      message: 'Login exitoso'
    };
  }

  static toRegisterResponse(user, token = null, expiresIn = null) {
    if (!user) return null;

    const response = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      message: 'Usuario creado exitosamente'
    };

    if (token) {
      response.token = token;
      response.expires_in = expiresIn;
      response.token_type = 'Bearer';
      response.permissions = this.getUserPermissions(user.role);
    }

    return response;
  }

  static toTokenResponse(token, expiresIn) {
    if (!token) return null;

    return {
      token,
      expires_in: expiresIn,
      token_type: 'Bearer',
      message: 'Token generado exitosamente'
    };
  }

  static toRefreshTokenResponse(token, expiresIn) {
    if (!token) return null;

    return {
      token,
      expires_in: expiresIn,
      token_type: 'Bearer',
      message: 'Token refrescado exitosamente'
    };
  }

  static toPasswordChangeResponse() {
    return {
      message: 'Contraseña actualizada exitosamente',
      timestamp: new Date().toISOString()
    };
  }

  static toForgotPasswordResponse(resetToken) {
    if (!resetToken) return null;

    return {
      message: 'Email de recuperación enviado',
      reset_token: resetToken,
      expires_in: '1h',
      instructions: 'Use el token para restablecer su contraseña'
    };
  }

  static toResetPasswordResponse() {
    return {
      message: 'Contraseña restablecida exitosamente',
      timestamp: new Date().toISOString(),
      instructions: 'Ahora puede iniciar sesión con su nueva contraseña'
    };
  }

  static toLogoutResponse() {
    return {
      message: 'Sesión cerrada exitosamente',
      timestamp: new Date().toISOString()
    };
  }

  static toProfileResponse(user, additionalData = {}) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login || null,
      profile: {
        full_name: user.name,
        role_display: this.getRoleDisplay(user.role),
        member_since: user.created_at,
        avatar: this.generateAvatarUrl(user.email)
      },
      statistics: {
        total_audits: additionalData.audit_count || 0,
        assigned_audits: additionalData.assigned_audits || 0,
        completed_audits: additionalData.completed_audits || 0
      },
      permissions: this.getUserPermissions(user.role)
    };
  }

  static toValidationErrorResponse(errors) {
    if (!Array.isArray(errors)) return null;

    return {
      error: 'Error de validación',
      message: 'Los datos proporcionados no son válidos',
      details: errors,
      timestamp: new Date().toISOString()
    };
  }

  static toErrorResponse(message, statusCode = 400) {
    return {
      error: true,
      message,
      status_code: statusCode,
      timestamp: new Date().toISOString()
    };
  }

  static getUserPermissions(role) {
    const permissions = {
      ADMIN: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'audits.create', 'audits.read', 'audits.update', 'audits.delete',
        'audits.assign', 'audits.unassign',
        'evidences.create', 'evidences.read', 'evidences.delete',
        'system.manage', 'reports.generate'
      ],
      AUDITOR: [
        'audits.read', 'audits.update',
        'evidences.create', 'evidences.read', 'evidences.delete',
        'reports.generate'
      ],
      CLIENTE: [
        'audits.read', 'evidences.read'
      ]
    };

    return permissions[role] || [];
  }

  static getRoleDisplay(role) {
    const roleDisplays = {
      ADMIN: 'Administrador',
      AUDITOR: 'Auditor',
      CLIENTE: 'Cliente'
    };

    return roleDisplays[role] || role;
  }

  static generateAvatarUrl(email) {
    if (!email) return null;
    
    const hash = require('crypto').createHash('md5').update(email.toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }

  static sanitizeLoginData(loginData) {
    if (!loginData) return {};

    return {
      email: loginData.email?.toLowerCase()?.trim() || '',
      password: loginData.password || ''
    };
  }

  static sanitizeRegisterData(registerData) {
    if (!registerData) return {};

    return {
      name: registerData.name?.trim()?.replace(/\s+/g, ' ') || '',
      email: registerData.email?.toLowerCase()?.trim() || '',
      password: registerData.password || '',
      role: registerData.role?.toUpperCase() || 'CLIENTE'
    };
  }

  static validateLoginData(loginData) {
    const errors = [];

    if (!loginData.email) {
      errors.push('El email es requerido');
    } else if (!this.isValidEmail(loginData.email)) {
      errors.push('El email no es válido');
    }

    if (!loginData.password) {
      errors.push('La contraseña es requerida');
    }

    return errors;
  }

  static validateRegisterData(registerData) {
    const errors = [];

    if (!registerData.name || registerData.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!registerData.email) {
      errors.push('El email es requerido');
    } else if (!this.isValidEmail(registerData.email)) {
      errors.push('El email no es válido');
    }

    if (!registerData.password) {
      errors.push('La contraseña es requerida');
    } else if (registerData.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (!this.isValidPassword(registerData.password)) {
      errors.push('La contraseña debe contener al menos una letra y un número');
    }

    const allowedRoles = ['ADMIN', 'AUDITOR', 'CLIENTE'];
    if (registerData.role && !allowedRoles.includes(registerData.role)) {
      errors.push('Rol no permitido');
    }

    return errors;
  }

  static validatePasswordChange(passwordData) {
    const errors = [];

    if (!passwordData.current_password) {
      errors.push('La contraseña actual es requerida');
    }

    if (!passwordData.new_password) {
      errors.push('La nueva contraseña es requerida');
    } else if (passwordData.new_password.length < 6) {
      errors.push('La nueva contraseña debe tener al menos 6 caracteres');
    }

    if (!this.isValidPassword(passwordData.new_password)) {
      errors.push('La nueva contraseña debe contener al menos una letra y un número');
    }

    return errors;
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  }

  static isTokenExpired(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  static getTokenExpirationTime(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthDTO;
