import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountCircle,
  Notifications,
  Menu as MenuIcon,
  Logout,
  Settings,
  Dashboard,
  Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout, onMenuClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleDashboard = () => {
    handleClose();
    navigate('/dashboard');
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: '#f44336',
      AUDITOR: '#2196f3',
      CLIENTE: '#4caf50'
    };
    return colors[role] || '#757575';
  };

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'Administrador',
      AUDITOR: 'Auditor',
      CLIENTE: 'Cliente'
    };
    return labels[role] || role;
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Assessment sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" noWrap component="div">
            Plataforma de Auditorías
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notificaciones */}
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{ 
                bgcolor: getRoleColor(user?.role),
                width: 32,
                height: 32,
                cursor: 'pointer'
              }}
              onClick={handleMenu}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {getRoleLabel(user?.role)}
              </Typography>
            </Box>
          </Box>

          {/* Menu Usuario */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 3,
              sx: { mt: 1.5 }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleDashboard}>
              <Dashboard sx={{ mr: 2 }} />
              Dashboard
            </MenuItem>
            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 2 }} />
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleProfile}>
              <Settings sx={{ mr: 2 }} />
              Configuración
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 2 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
