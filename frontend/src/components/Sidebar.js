import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Subject as SubjectIcon,
  AccountBalance as UniversityIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Panel Principal', icon: <DashboardIcon />, id: 'dashboard' },
  { text: 'Gestión de Estudiantes', icon: <PeopleIcon />, id: 'alumnos' },
  { text: 'Maestros', icon: <SchoolIcon />, id: 'maestros' },
  { text: 'Materias', icon: <SubjectIcon />, id: 'materias' },
  { text: 'Relaciones', icon: <SubjectIcon />, id: 'relaciones' },
  { text: 'Gestión Relaciones', icon: <AssignmentIcon />, id: 'gestion-relaciones' }
];

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#192d63', // Azul principal UNACH
          color: 'white'
        }
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <UniversityIcon sx={{ color: 'white', fontSize: 32, mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
            UNACH
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Sistema Escolar
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
          Universidad Autónoma de Chiapas
        </Typography>
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => setActiveTab(item.id)}
              sx={{
                bgcolor: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    color: 'white',
                    fontWeight: activeTab === item.id ? 'bold' : 'normal'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
