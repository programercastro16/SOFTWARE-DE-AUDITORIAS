import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Pagination,
  LinearProgress,
  Fab
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Visibility,
  Edit,
  Delete,
  GetApp,
  Assessment,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Audits = ({ user }) => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAudits();
  }, [page, searchTerm, statusFilter]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos - en producción conectar con API real
      const mockAudits = [
        {
          id: 1,
          title: 'Auditoría Sanitaria - Restaurante El Buen Sabor',
          description: 'Auditoría completa de condiciones sanitarias y manipulación de alimentos',
          status: 'APROBADO',
          score: 92,
          created_by: 'Carlos Rodríguez',
          created_by_email: 'carlos.auditor@auditorias.com',
          created_at: '2024-01-20T10:30:00Z',
          scheduled_visit_date: '2024-02-15',
          items_count: 21,
          evidences_count: 8,
          progress: 100
        },
        {
          id: 2,
          title: 'Auditoría de Instalaciones - Empresa ABC S.A.',
          description: 'Evaluación de instalaciones físicas y condiciones operativas',
          status: 'ENVIADO',
          score: 78,
          created_by: 'María González',
          created_by_email: 'maria.auditor@auditorias.com',
          created_at: '2024-01-18T14:15:00Z',
          scheduled_visit_date: '2024-03-20',
          items_count: 21,
          evidences_count: 5,
          progress: 85
        },
        {
          id: 3,
          title: 'Auditoría Integral - Cafetería Central',
          description: 'Auditoría integral de procesos y procedimientos',
          status: 'BORRADOR',
          score: null,
          created_by: 'Carlos Rodríguez',
          created_by_email: 'carlos.auditor@auditorias.com',
          created_at: '2024-01-15T09:00:00Z',
          scheduled_visit_date: '2024-04-10',
          items_count: 21,
          evidences_count: 2,
          progress: 45
        },
        {
          id: 4,
          title: 'Auditoría de Saneamiento - Restaurante El Buen Sabor',
          description: 'Verificación de sistemas de saneamiento y control de plagas',
          status: 'RECHAZADO',
          score: 45,
          created_by: 'María González',
          created_by_email: 'maria.auditor@auditorias.com',
          created_at: '2024-01-10T11:30:00Z',
          scheduled_visit_date: '2024-01-25',
          items_count: 21,
          evidences_count: 3,
          progress: 70
        },
        {
          id: 5,
          title: 'Auditoría de Equipos - Empresa ABC S.A.',
          description: 'Inspección de equipos y utensilios de cocina',
          status: 'APROBADO',
          score: 88,
          created_by: 'Carlos Rodríguez',
          created_by_email: 'carlos.auditor@auditorias.com',
          created_at: '2024-01-08T16:45:00Z',
          scheduled_visit_date: '2024-02-28',
          items_count: 21,
          evidences_count: 6,
          progress: 100
        }
      ];

      // Aplicar filtros
      let filteredAudits = mockAudits;
      
      if (searchTerm) {
        filteredAudits = filteredAudits.filter(audit =>
          audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          audit.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter) {
        filteredAudits = filteredAudits.filter(audit => audit.status === statusFilter);
      }

      setAudits(filteredAudits);
      setTotalPages(Math.ceil(filteredAudits.length / 10));
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      APROBADO: 'success',
      ENVIADO: 'warning',
      BORRADOR: 'info',
      RECHAZADO: 'error'
    };
    return colors[status] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'warning';
    if (score >= 60) return 'info';
    return 'error';
  };

  const getStatusLabel = (status) => {
    const labels = {
      APROBADO: 'Aprobado',
      ENVIADO: 'Enviado',
      BORRADOR: 'Borrador',
      RECHAZADO: 'Rechazado'
    };
    return labels[status] || status;
  };

  const handleViewAudit = (auditId) => {
    navigate(`/audits/${auditId}`);
  };

  const handleEditAudit = (auditId) => {
    navigate(`/audits/${auditId}/edit`);
  };

  const handleCreateAudit = () => {
    navigate('/audits/create');
  };

  const handleDeleteAudit = async (auditId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta auditoría?')) {
      try {
        // Lógica para eliminar auditoría
        console.log('Eliminando auditoría:', auditId);
        fetchAudits();
      } catch (error) {
        console.error('Error deleting audit:', error);
      }
    }
  };

  const handleExportAudit = (auditId) => {
    // Lógica para exportar auditoría
    console.log('Exportando auditoría:', auditId);
  };

  const filteredAudits = audits.filter((audit, index) => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return index >= startIndex && index < endIndex;
  });

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Auditorías
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gestiona y monitorea todas las auditorías del sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateAudit}
          disabled={!['ADMIN', 'AUDITOR'].includes(user?.role)}
        >
          Nueva Auditoría
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar auditorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="BORRADOR">Borrador</MenuItem>
                  <MenuItem value="ENVIADO">Enviado</MenuItem>
                  <MenuItem value="APROBADO">Aprobado</MenuItem>
                  <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAudits}
                fullWidth
              >
                Actualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Total Auditorías
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                {audits.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Aprobadas
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'success.main' }}>
                {audits.filter(a => a.status === 'APROBADO').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                En Progreso
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {audits.filter(a => a.status === 'ENVIADO' || a.status === 'BORRADOR').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Rechazadas
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'error.main' }}>
                {audits.filter(a => a.status === 'RECHAZADO').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Audits Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Auditoría</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Puntaje</TableCell>
                  <TableCell>Auditor</TableCell>
                  <TableCell>Fecha Visita</TableCell>
                  <TableCell>Items/Evidencias</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAudits.map((audit) => (
                  <TableRow key={audit.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {audit.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {audit.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(audit.status)}
                        color={getStatusColor(audit.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {audit.score ? (
                        <Chip
                          label={`${audit.score}%`}
                          color={getScoreColor(audit.score)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Sin puntaje
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {audit.created_by}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {audit.created_by_email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(audit.scheduled_visit_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={`${audit.items_count} items`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${audit.evidences_count} ev.`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleViewAudit(audit.id)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {['ADMIN', 'AUDITOR'].includes(user?.role) && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleEditAudit(audit.id)}
                                disabled={audit.status === 'APROBADO'}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Exportar">
                              <IconButton
                                size="small"
                                onClick={() => handleExportAudit(audit.id)}
                              >
                                <GetApp />
                              </IconButton>
                            </Tooltip>
                            {user?.role === 'ADMIN' && (
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAudit(audit.id)}
                                  color="error"
                                  disabled={audit.status === 'APROBADO'}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      {['ADMIN', 'AUDITOR'].includes(user?.role) && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={handleCreateAudit}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default Audits;
