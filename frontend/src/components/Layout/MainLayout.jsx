import React, { useState } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children, user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header */}
      <Header 
        user={user} 
        onLogout={onLogout} 
        onMenuClick={handleDrawerToggle}
      />

      {/* Sidebar */}
      <Sidebar 
        user={user} 
        open={mobileOpen} 
        onClose={handleDrawerClose}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - 280px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          pt: 8, // Header height
          px: { xs: 2, sm: 3 }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
