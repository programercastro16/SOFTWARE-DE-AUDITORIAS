import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Assessment,
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Conexión con API real del backend
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso con usuario real de la base de datos
        onLogin(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Credenciales inválidas. Por favor, verifique su email y contraseña.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión con el servidor. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Assessment sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Audit Platform
            </Typography>
          </Box>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
            Plataforma de Auditorías Sanitarias
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sistema completo para gestión de auditorías y control de calidad
          </Typography>
        </Box>

        <Card elevation={8} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              Iniciar Sesión
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />

              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
                disabled={loading}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={handleTogglePassword}
                      sx={{ minWidth: 'auto', p: 1 }}
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                © 2024 Audit Platform. Todos los derechos reservados.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Features */}
        <Box sx={{ mt: 4, display: { xs: 'none', md: 'block' } }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
            Características Principales
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
            <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Gestión de Auditorías
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Complete workflow
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Control de Evidencias
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Documentos y archivos
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Reportes PDF
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Exportación automática
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
