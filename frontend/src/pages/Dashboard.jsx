import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  People,
  Assignment,
  Visibility,
  Launch,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos - en producción conectar con API real
      const mockStats = {
        totalAudits: 25,
        auditsByStatus: [
          { status: 'APROBADO', count: 15, trend: 'up' },
          { status: 'ENVIADO', count: 8, trend: 'stable' },
          { status: 'BORRADOR', count: 2, trend: 'down' }
        ],
        usersCount: 6,
        evidencesCount: 45,
        monthlyGrowth: 12.5
      };

      const mockRecentAudits = [
        {
          id: 1,
          title: 'Auditoría Sanitaria - Restaurante El Buen Sabor',
          status: 'APROBADO',
          score: 92,
          created_by: 'Carlos Rodríguez',
          created_at: '2024-01-20',
          progress: 100
        },
        {
          id: 2,
          title: 'Auditoría de Instalaciones - Empresa ABC S.A.',
          status: 'ENVIADO',
          score: 78,
          created_by: 'María González',
          created_at: '2024-01-18',
          progress: 85
        },
        {
          id: 3,
          title: 'Auditoría Integral - Cafetería Central',
          status: 'BORRADOR',
          score: null,
          created_by: 'Carlos Rodríguez',
          created_at: '2024-01-15',
          progress: 45
        }
      ];

      setStats(mockStats);
      setRecentAudits(mockRecentAudits);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.main`,
              color: 'white',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {trend === 'up' ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
            ) : trend === 'down' ? (
              <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
            ) : null}
            <Typography variant="caption" color="textSecondary">
              {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : 'Estable'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

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
            Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Bienvenido de nuevo, {user?.name}. Aquí está el resumen de tu plataforma.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboardData}
        >
          Actualizar
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Auditorías"
            value={stats?.totalAudits || 0}
            subtitle="Este mes"
            icon={<Assessment />}
            color="primary"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Usuarios Activos"
            value={stats?.usersCount || 0}
            subtitle="Registrados"
            icon={<People />}
            color="secondary"
            trend="stable"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Evidencias"
            value={stats?.evidencesCount || 0}
            subtitle="Archivos subidos"
            icon={<Assignment />}
            color="info"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Crecimiento"
            value={`${stats?.monthlyGrowth || 0}%`}
            subtitle="Mensual"
            icon={<TrendingUp />}
            color="success"
            trend="up"
          />
        </Grid>
      </Grid>

      {/* Status Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Auditorías por Estado
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {stats?.auditsByStatus?.map((status) => (
                  <Box key={status.status} sx={{ flex: 1, minWidth: 150 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{status.status}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {status.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(status.count / stats.totalAudits) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStatusColor(status.status) + '.main'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Acciones Rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Assessment />}
                  onClick={() => navigate('/audits/create')}
                  disabled={!['ADMIN', 'AUDITOR'].includes(user?.role)}
                >
                  Nueva Auditoría
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Visibility />}
                  onClick={() => navigate('/audits')}
                >
                  Ver Auditorías
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Launch />}
                  onClick={() => window.open('/api-docs', '_blank')}
                >
                  API Docs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Audits Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Auditorías Recientes
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/audits')}
              sx={{ textTransform: 'none' }}
            >
              Ver todas
            </Button>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Auditoría</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Puntaje</TableCell>
                  <TableCell>Auditor</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAudits.map((audit) => (
                  <TableRow key={audit.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {audit.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={audit.status}
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
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {audit.created_by}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/audits/${audit.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
