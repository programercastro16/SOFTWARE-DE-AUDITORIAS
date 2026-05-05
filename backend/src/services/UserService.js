const { UserRepository } = require('../repositories');
const bcrypt = require('bcryptjs');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(userData) {
    const { name, email, password, role } = userData;

    this.validateUserData({ name, email, password, role });

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const allowedRoles = ['ADMIN', 'AUDITOR', 'CLIENTE'];
    if (!allowedRoles.includes(role)) {
      throw new Error('Rol no permitido');
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    
    const user = await this.userRepository.create({
      name: this.sanitizeName(name),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role
    });

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async authenticateUser(email, password) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Email inválido');
    }

    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    await this.userRepository.updateLastLogin(user.id);

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers(excludeRole = 'ADMIN') {
    try {
      let users;
      if (excludeRole) {
        users = await this.userRepository.getAll({ $ne: { role: excludeRole } }, 'name ASC');
      } else {
        users = await this.userRepository.getAll({}, 'name ASC');
      }

      return users.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      throw new Error('Error al obtener usuarios: ' + error.message);
    }
  }

  async getUserById(userId) {
    if (!userId || isNaN(userId)) {
      throw new Error('ID de usuario inválido');
    }

    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId, updateData) {
    const { name, email, role } = updateData;

    if (!userId || isNaN(userId)) {
      throw new Error('ID de usuario inválido');
    }

    const existingUser = await this.userRepository.getById(userId);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    if (email && email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(email);
      if (userWithEmail) {
        throw new Error('El email ya está en uso');
      }
    }

    const updateFields = {};
    if (name) updateFields.name = this.sanitizeName(name);
    if (email) updateFields.email = email.toLowerCase().trim();
    if (role) {
      const allowedRoles = ['ADMIN', 'AUDITOR', 'CLIENTE'];
      if (!allowedRoles.includes(role)) {
        throw new Error('Rol no permitido');
      }
      updateFields.role = role;
    }

    const updatedUser = await this.userRepository.update(userId, updateFields);
    const { password_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(userId) {
    if (!userId || isNaN(userId)) {
      throw new Error('ID de usuario inválido');
    }

    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.role === 'ADMIN') {
      const adminCount = await this.userRepository.count({ role: 'ADMIN' });
      if (adminCount <= 1) {
        throw new Error('No se puede eliminar el último administrador');
      }
    }

    await this.userRepository.delete(userId);
    return { message: 'Usuario eliminado correctamente' };
  }

  async getUsersByRole(role) {
    const allowedRoles = ['ADMIN', 'AUDITOR', 'CLIENTE'];
    if (!allowedRoles.includes(role)) {
      throw new Error('Rol no válido');
    }

    const users = await this.userRepository.findByRole(role);
    return users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async searchUsers(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
    }

    const users = await this.userRepository.searchByNameOrEmail(searchTerm);
    return users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async getUserStats() {
    return await this.userRepository.getUserStats();
  }

  validateUserData({ name, email, password, role }) {
    if (!name || name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (!email || !this.isValidEmail(email)) {
      throw new Error('Email inválido');
    }

    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    if (!role) {
      throw new Error('El rol es requerido');
    }

    if (!this.isValidPassword(password)) {
      throw new Error('La contraseña debe contener al menos una letra y un número');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPassword(password) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  }

  sanitizeName(name) {
    return name.trim().replace(/\s+/g, ' ');
  }
}

module.exports = UserService;
