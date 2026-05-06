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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Fade,
  Grow,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  GetApp,
  Refresh,
  ExpandMore
} from '@mui/icons-material';
import { auditService } from '../services/api';

const Audits = ({ user }) => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newAudit, setNewAudit] = useState({ title: '', description: '', scheduled_visit_date: '' });
  const [openFill, setOpenFill] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [expandedSection, setExpandedSection] = useState('1');
  const [snack, setSnack] = useState({ open: false, type: 'success', message: '' });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, [page, searchTerm, statusFilter]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const filteredAudits = await auditService.getAudits({
        search: searchTerm || undefined,
        status: statusFilter || undefined
      });

      setAudits(filteredAudits);
      setTotalPages(Math.ceil(filteredAudits.length / 10));
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSnack = (type, message) => {
    setSnack({ open: true, type, message });
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

  const handleCreateAudit = async () => {
    try {
      setCreating(true);
      await auditService.createAudit(newAudit);
      setNewAudit({ title: '', description: '', scheduled_visit_date: '' });
      fetchAudits();
      showSnack('success', 'Auditoria creada correctamente.');
    } catch (error) {
      console.error('Error creating audit:', error);
      showSnack('error', 'No se pudo crear la auditoria.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAudit = async (auditId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta auditoría?')) {
      try {
        await auditService.deleteAudit(auditId);
        fetchAudits();
        showSnack('success', 'Auditoria eliminada.');
      } catch (error) {
        console.error('Error deleting audit:', error);
        showSnack('error', 'No se pudo eliminar la auditoria.');
      }
    }
  };

  const handleExportAudit = (auditId) => {
    window.open(`http://localhost:4000/audits/${auditId}/pdf`, '_blank');
  };

  const handleOpenFill = async (audit) => {
    try {
      const items = await fetch(`http://localhost:4000/audits/${audit.id}/items`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then((r) => r.json());
      setSelectedAudit(audit);
      setAuditItems(items || []);
      setOpenFill(true);
      setExpandedSection('1');
    } catch (error) {
      console.error('Error loading items:', error);
      showSnack('error', 'No se pudieron cargar los puntos de auditoria.');
    }
  };

  const handleSaveFill = async () => {
    if (!selectedAudit) return;
    try {
      setSaving(true);
      await fetch(`http://localhost:4000/audits/${selectedAudit.id}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: auditItems.map((it) => ({
            code: it.code,
            score: Number(it.score) || 0,
            observations: it.observations || ''
          }))
        })
      });
      setOpenFill(false);
      setSelectedAudit(null);
      setAuditItems([]);
      fetchAudits();
      showSnack('success', 'Formato diligenciado y guardado correctamente.');
    } catch (error) {
      console.error('Error saving items:', error);
      showSnack('error', 'No se pudo guardar el diligenciamiento.');
    } finally {
      setSaving(false);
    }
  };

  const sectionMap = {
    '1': 'INSTALACIONES FISICAS',
    '2': 'EQUIPOS Y UTENSILIOS',
    '3': 'PERSONAL MANIPULADOR',
    '4': 'REQUISITOS HIGIENICOS',
    '5': 'SANEAMIENTO'
  };

  const groupedItems = auditItems.reduce((acc, item) => {
    const section = String(item.code || '').split('.')[0] || '1';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const sectionScore = (section) => {
    const list = groupedItems[section] || [];
    return list.reduce((acc, it) => acc + (Number(it.score) || 0), 0);
  };

  const totalWeight = auditItems.reduce((acc, it) => acc + (Number(it.weight) || 0), 0);
  const totalScore = auditItems.reduce((acc, it) => acc + (Number(it.score) || 0), 0);
  const compliance = totalWeight ? ((totalScore / totalWeight) * 100) : 0;

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
      <Fade in timeout={450}>
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
          disabled={!newAudit.title || !newAudit.scheduled_visit_date || !['ADMIN', 'AUDITOR'].includes(user?.role)}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : 'Guardar Auditoria'}
        </Button>
      </Box>
      </Fade>

      <Grow in timeout={500}>
      <Card sx={{ mb: 3, transition: 'all 250ms ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Título" value={newAudit.title} onChange={(e) => setNewAudit((p) => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Descripción" value={newAudit.description} onChange={(e) => setNewAudit((p) => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="date" label="Fecha visita" InputLabelProps={{ shrink: true }} value={newAudit.scheduled_visit_date} onChange={(e) => setNewAudit((p) => ({ ...p, scheduled_visit_date: e.target.value }))} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      </Grow>

      <Grow in timeout={650}>
      <Card sx={{ mb: 3, transition: 'all 250ms ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
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
      </Grow>

      <Grow in timeout={800}>
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
      </Grow>

      <Grow in timeout={900}>
      <Card sx={{ transition: 'all 250ms ease', '&:hover': { boxShadow: 6 } }}>
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
                        {['ADMIN', 'AUDITOR'].includes(user?.role) && (
                          <>
                            <Tooltip title="Exportar">
                              <IconButton
                                size="small"
                                onClick={() => handleExportAudit(audit.id)}
                              >
                                <GetApp />
                              </IconButton>
                            </Tooltip>
                            <Button size="small" variant="outlined" onClick={() => handleOpenFill(audit)}>
                              Diligenciar
                            </Button>
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
      </Grow>

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
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Add />
        </Fab>
      )}

      <Dialog open={openFill} onClose={() => setOpenFill(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Diligenciar Formato EPS001 - {selectedAudit?.title}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              Cumplimiento actual: <strong>{compliance.toFixed(1)}%</strong>. Diligencia por secciones 1 a 5, igual que el formato fisico.
            </Alert>
          </Box>

          {Object.keys(sectionMap).map((section) => (
            <Accordion
              key={section}
              expanded={expandedSection === section}
              onChange={() => setExpandedSection(expandedSection === section ? '' : section)}
              TransitionProps={{ timeout: 300 }}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {section}. {sectionMap[section]}
                  </Typography>
                  <Chip label={`Calificacion del bloque: ${sectionScore(section).toFixed(1)}`} size="small" color="primary" variant="outlined" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={2}><strong>Codigo</strong></Grid>
                  <Grid item xs={4}><strong>Aspecto</strong></Grid>
                  <Grid item xs={2}><strong>Calificacion</strong></Grid>
                  <Grid item xs={4}><strong>Observaciones / Hallazgos</strong></Grid>
                </Grid>
                {(groupedItems[section] || []).map((it) => {
                  const idx = auditItems.findIndex((row) => row.code === it.code);
                  return (
                    <Fade in key={it.id || it.code} timeout={250}>
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={2}><Typography variant="body2">{it.code}</Typography></Grid>
                        <Grid item xs={4}><Typography variant="body2">{it.label}</Typography></Grid>
                        <Grid item xs={2}>
                          <TextField
                            type="number"
                            size="small"
                            fullWidth
                            inputProps={{ min: 0, max: it.weight, step: 0.5 }}
                            value={it.score ?? 0}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAuditItems((prev) => prev.map((row, i) => i === idx ? { ...row, score: value } : row));
                            }}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            size="small"
                            fullWidth
                            value={it.observations || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAuditItems((prev) => prev.map((row, i) => i === idx ? { ...row, observations: value } : row));
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Fade>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFill(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveFill} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar diligenciamiento'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={2600}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snack.type} variant="filled" onClose={() => setSnack((prev) => ({ ...prev, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Audits;
