import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton
} from '@mui/material';
import {
  AccountBalance as UniversityIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import ReporteDatos from './ReporteDatos';

function Header({ user, onLogout, isMobile, onMobileMenuOpen }) {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#192d63', // Azul principal UNACH
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        {/* Botón de menú para móviles */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMobileMenuOpen}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <UniversityIcon sx={{ color: 'white', fontSize: 28, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            UNACH
          </Typography>
        </Box>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            ml: 2,
            display: { xs: 'none', lg: 'block' }
          }}
        >
          Sistema de Gestión Escolar
        </Typography>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: { xs: 'block', sm: 'block' } }}>
            <ReporteDatos />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white',
                display: { xs: 'none', lg: 'block' }
              }}
            >
              {user?.username}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {isMobile ? 'Salir' : 'Cerrar Sesión'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
