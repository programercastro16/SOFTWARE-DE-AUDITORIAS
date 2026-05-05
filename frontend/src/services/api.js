import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de Autenticación
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register-admin', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  }
};

// Servicios de Auditorías
export const auditService = {
  getAudits: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/audits?${params}`);
    return response.data;
  },

  getAudit: async (id) => {
    const response = await api.get(`/audits/${id}`);
    return response.data;
  },

  createAudit: async (auditData) => {
    const response = await api.post('/audits', auditData);
    return response.data;
  },

  updateAudit: async (id, auditData) => {
    const response = await api.put(`/audits/${id}`, auditData);
    return response.data;
  },

  deleteAudit: async (id) => {
    const response = await api.delete(`/audits/${id}`);
    return response.data;
  },

  updateScores: async (id, items) => {
    const response = await api.put(`/audits/${id}/scores`, { items });
    return response.data;
  },

  getAuditStats: async () => {
    const response = await api.get('/audits/stats');
    return response.data;
  }
};

// Servicios de Evidencias
export const evidenceService = {
  getEvidences: async (auditId) => {
    const response = await api.get(`/audits/${auditId}/evidences`);
    return response.data;
  },

  uploadEvidence: async (auditId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/audits/${auditId}/evidences`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteEvidence: async (auditId, evidenceId) => {
    const response = await api.delete(`/audits/${auditId}/evidences/${evidenceId}`);
    return response.data;
  }
};

// Servicios de Items de Auditoría
export const auditItemService = {
  getAuditItems: async (auditId) => {
    const response = await api.get(`/audits/${auditId}/items`);
    return response.data;
  },

  updateAuditItem: async (auditId, itemData) => {
    const response = await api.put(`/audits/${auditId}/items/${itemData.code}`, itemData);
    return response.data;
  },

  updateAuditItems: async (auditId, items) => {
    const response = await api.put(`/audits/${auditId}/scores`, { items });
    return response.data;
  }
};

// Servicios de Reportes
export const reportService = {
  generatePDF: async (auditId) => {
    const response = await api.get(`/audits/${auditId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getReportStats: async () => {
    const response = await api.get('/reports/stats');
    return response.data;
  }
};

// Servicios del Sistema
export const systemService = {
  getHealth: async () => {
    const response = await api.get('/');
    return response.data;
  },

  getSystemInfo: async () => {
    const response = await api.get('/system/info');
    return response.data;
  }
};

// Utilidades
export const apiUtils = {
  // Manejo de errores
  handleError: (error) => {
    if (error.response) {
      // Error del servidor
      console.error('API Error:', error.response.data);
      return error.response.data.message || 'Error del servidor';
    } else if (error.request) {
      // Error de red
      console.error('Network Error:', error.request);
      return 'Error de conexión. Verifique su internet.';
    } else {
      // Error de configuración
      console.error('Config Error:', error.message);
      return 'Error de configuración.';
    }
  },

  // Formateo de fechas
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Formateo de fecha y hora
  formatDateTime: (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Descargar archivo
  downloadFile: async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Error al descargar el archivo');
    }
  }
};

export default api;
