class UserDTO {
  static toResponse(user) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login || null
    };
  }

  static toListResponse(users) {
    if (!Array.isArray(users)) return [];
    
    return users.map(user => this.toResponse(user));
  }

  static toDetailedResponse(user, additionalData = {}) {
    if (!user) return null;

    const baseResponse = this.toResponse(user);
    
    return {
      ...baseResponse,
      audit_count: additionalData.audit_count || 0,
      assigned_audits: additionalData.assigned_audits || [],
      permissions: this.getUserPermissions(user.role),
      profile: {
        full_name: user.name,
        role_display: this.getRoleDisplay(user.role),
        member_since: user.created_at
      }
    };
  }

  static toCreateResponse(user) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      message: 'Usuario creado exitosamente'
    };
  }

  static toUpdateResponse(user) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      updated_at: new Date().toISOString(),
      message: 'Usuario actualizado exitosamente'
    };
  }

  static toAuthResponse(user, token, expiresIn) {
    if (!user || !token) return null;

    return {
      user: this.toResponse(user),
      token,
      expires_in: expiresIn,
      token_type: 'Bearer',
      permissions: this.getUserPermissions(user.role)
    };
  }

  static toStatsResponse(stats) {
    if (!stats) return null;

    return {
      total_users: stats.reduce((sum, stat) => sum + stat.count, 0),
      by_role: stats.map(stat => ({
        role: stat.role,
        count: stat.count,
        display_name: this.getRoleDisplay(stat.role),
        recent_count: stat.recent_count || 0
      })),
      new_users_this_month: stats.reduce((sum, stat) => sum + (stat.recent_count || 0), 0)
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

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeUserData(userData) {
    if (!userData) return {};

    return {
      name: userData.name?.trim()?.replace(/\s+/g, ' ') || '',
      email: userData.email?.toLowerCase()?.trim() || '',
      role: userData.role?.toUpperCase() || '',
      password: userData.password || ''
    };
  }
}

module.exports = UserDTO;
