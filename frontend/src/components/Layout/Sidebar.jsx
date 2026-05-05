import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard,
  Assessment,
  People,
  Folder,
  Settings,
  Help,
  BarChart,
  Assignment,
  CloudUpload,
  Storage
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['ADMIN', 'AUDITOR', 'CLIENTE']
  },
  {
    text: 'Auditorías',
    icon: <Assessment />,
    path: '/audits',
    roles: ['ADMIN', 'AUDITOR', 'CLIENTE']
  },
  {
    text: 'Crear Auditoría',
    icon: <Assignment />,
    path: '/audits/create',
    roles: ['ADMIN', 'AUDITOR']
  },
  {
    text: 'Evidencias',
    icon: <Storage />,
    path: '/evidences',
    roles: ['ADMIN', 'AUDITOR', 'CLIENTE']
  },
  {
    text: 'Usuarios',
    icon: <People />,
    path: '/users',
    roles: ['ADMIN']
  },
  {
    text: 'Reportes',
    icon: <BarChart />,
    path: '/reports',
    roles: ['ADMIN', 'AUDITOR']
  },
  {
    text: 'Configuración',
    icon: <Settings />,
    path: '/settings',
    roles: ['ADMIN']
  }
];

const Sidebar = ({ user, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Menú Principal
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {user?.name} - {user?.role}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, py: 2 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ px: 2 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? 'white' : 'inherit'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <ListItem disablePadding>
          <ListItemButton
            sx={{ borderRadius: 2 }}
            onClick={() => window.open('/api-docs', '_blank')}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Help />
            </ListItemIcon>
            <ListItemText 
              primary="Documentación API"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(0,0,0,0.12)'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(0,0,0,0.12)',
            position: 'relative'
          }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
