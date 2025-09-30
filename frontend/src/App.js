import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Button, 
  TextField, 
  Box, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TablePagination,
  Alert,
  Snackbar,
  CssBaseline,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Menu,
  MenuItem
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from './config/axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MaestrosTable from './components/MaestrosTable';
import MateriasTable from './components/MateriasTable';
import RelacionesTable from './components/RelacionesTable';
import GestionRelaciones from './components/GestionRelaciones';
import { useAuth } from './hooks/useAuth';

// Tema personalizado UNACH con colores oficiales
const theme = createTheme({
  palette: {
    primary: {
      main: '#192d63', // Azul principal UNACH RGB(25, 45, 99)
      light: '#2d4a8a',
      dark: '#0f1a3f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d4b012', // Dorado UNACH RGB(212, 176, 18)
      light: '#e6c73a',
      dark: '#b8960a',
      contrastText: '#ffffff',
    },
    tertiary: {
      main: '#735920', // Café UNACH RGB(115, 89, 32)
      light: '#8a6f3a',
      dark: '#5c4519',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Arial, sans-serif', // Tipografía oficial UNACH
    h4: {
      fontWeight: 'bold',
      color: '#192d63',
    },
    h5: {
      fontWeight: 'bold',
      color: '#192d63',
    },
    h6: {
      fontWeight: 'bold',
      color: '#192d63',
    },
  },
});

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { user, login, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alumnos, setAlumnos] = useState([]);
  const [nuevoAlumno, setNuevoAlumno] = useState({ nombre: '', grado: '', maestro_id: '', email: '', foto_url: '' });
  const [editingAlumno, setEditingAlumno] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const uploadInputNuevoRef = useRef(null);
  const uploadInputEditRef = useRef(null);
  const [subiendoNuevo, setSubiendoNuevo] = useState(false);
  const [subiendoEdit, setSubiendoEdit] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleUploadAlumnoNuevo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('foto', file);
    setSubiendoNuevo(true);
    try {
      const { data } = await axios.post('/upload/alumnos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNuevoAlumno((prev) => ({ ...prev, foto_url: data.url }));
      showSnackbar('Foto subida');
    } catch (_) {
      showSnackbar('Error al subir foto', 'error');
    } finally {
      setSubiendoNuevo(false);
      if (uploadInputNuevoRef.current) {
        uploadInputNuevoRef.current.value = '';
      }
    }
  };

  const handleUploadAlumnoEdit = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('foto', file);
    setSubiendoEdit(true);
    try {
      const { data } = await axios.post('/upload/alumnos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditingAlumno((prev) => ({ ...prev, foto_url: data.url }));
      showSnackbar('Foto subida');
    } catch (_) {
      showSnackbar('Error al subir foto', 'error');
    } finally {
      setSubiendoEdit(false);
      if (uploadInputEditRef.current) {
        uploadInputEditRef.current.value = '';
      }
    }
  };

  const fetchAlumnos = useCallback(async () => {
    try {
      const res = await axios.get('/alumnos');
      setAlumnos(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    if (user) {
      fetchAlumnos();
    }
  }, [user, fetchAlumnos]);

  const validateForm = (alumno) => {
    if (!alumno.nombre.trim()) return 'El nombre es requerido';
    if (!alumno.grado || alumno.grado <= 0) return 'El grado debe ser mayor a 0';
    if (!alumno.email.trim()) return 'El email es requerido';
    return null;
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddAlumno = async () => {
    const error = validateForm(nuevoAlumno);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      await axios.post('/alumnos', {
        ...nuevoAlumno,
        grado: Number(nuevoAlumno.grado),
        maestro_id: nuevoAlumno.maestro_id ? Number(nuevoAlumno.maestro_id) : null,
        foto_url: nuevoAlumno.foto_url || null
      });
      setNuevoAlumno({ nombre: '', grado: '', maestro_id: '', email: '', foto_url: '' });
      fetchAlumnos();
      showSnackbar('Alumno agregado exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('alumnos-updated'));
    } catch (error) {
      showSnackbar('Error al agregar alumno', 'error');
    }
  };

  const handleEditAlumno = (alumno) => {
    setEditingAlumno({ ...alumno });
    setOpenEditDialog(true);
  };

  const handleUpdateAlumno = async () => {
    const error = validateForm(editingAlumno);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      await axios.put(`/alumnos/${editingAlumno.id}`, {
        ...editingAlumno,
        grado: Number(editingAlumno.grado),
        maestro_id: editingAlumno.maestro_id ? Number(editingAlumno.maestro_id) : null,
        foto_url: editingAlumno.foto_url || null
      });
      setOpenEditDialog(false);
      setEditingAlumno(null);
      fetchAlumnos();
      showSnackbar('Alumno actualizado exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('alumnos-updated'));
    } catch (error) {
      showSnackbar('Error al actualizar alumno', 'error');
    }
  };

  const handleDeleteAlumno = async (id) => {
    try {
      await axios.delete(`/alumnos/${id}`);
      fetchAlumnos();
      showSnackbar('Alumno eliminado exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('alumnos-updated'));
    } catch (error) {
      showSnackbar('Error al eliminar alumno', 'error');
    }
  };

  const filteredAlumnos = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.grado.toString().includes(searchTerm)
  );

  const paginatedAlumnos = filteredAlumnos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleMobileTabChange = (tabId) => {
    setActiveTab(tabId);
    handleMobileMenuClose();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'alumnos':
        return (
          <Box id="alumnos-section">
            <Typography variant="h5" gutterBottom sx={{ color: '#192d63', fontWeight: 'bold', mb: 3 }}>
              Gestión de Alumnos
            </Typography>
            
            {/* Formulario de agregar - Responsivo */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 2, 
              flexWrap: 'wrap', 
              mb: 3, 
              p: { xs: 1, sm: 2 }, 
              bgcolor: '#f5f5f5', 
              borderRadius: 2 
            }}>
              <TextField 
                label="Nombre" 
                value={nuevoAlumno.nombre} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, nombre: e.target.value })}
                required
                fullWidth={isMobile}
                sx={{ minWidth: { xs: '100%', lg: 200 } }}
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField 
                label="Grado" 
                type="number" 
                value={nuevoAlumno.grado} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, grado: e.target.value })}
                required
                fullWidth={isMobile}
                sx={{ minWidth: { xs: '100%', lg: 120 } }}
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField 
                label="Email" 
                value={nuevoAlumno.email} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, email: e.target.value })}
                required
                fullWidth={isMobile}
                sx={{ minWidth: { xs: '100%', lg: 250 } }}
                size={isMobile ? 'small' : 'medium'}
              />
              <Button 
                component="label" 
                variant="outlined" 
                disabled={subiendoNuevo}
                fullWidth={isMobile}
                sx={{ minWidth: { xs: '100%', lg: 150 } }}
                size={isMobile ? 'small' : 'medium'}
              >
                {subiendoNuevo ? 'Subiendo...' : (nuevoAlumno.foto_url ? 'Cambiar foto' : 'Subir foto')}
                <input ref={uploadInputNuevoRef} type="file" hidden accept="image/png,image/jpeg" onChange={handleUploadAlumnoNuevo} />
              </Button>
              {nuevoAlumno.foto_url && (
                <img src={`${axios.defaults.baseURL}${nuevoAlumno.foto_url}`} alt="alumno" style={{ height: 48, borderRadius: 4 }} />
              )}
              <Button 
                variant="contained" 
                onClick={handleAddAlumno} 
                sx={{ 
                  bgcolor: '#192d63',
                  minWidth: { xs: '100%', lg: 150 }
                }}
                size={isMobile ? 'small' : 'medium'}
              >
                Agregar Alumno
              </Button>
            </Box>

            {/* Búsqueda */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Buscar por nombre o grado"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: { xs: '100%', lg: 300 } }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>

            {/* Vista de tabla o cards según el tamaño de pantalla */}
            {isMobile ? (
              // Vista de cards para móviles y tablets
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {paginatedAlumnos.map((a) => (
                  <Card key={a.id} sx={{ p: { xs: 1, sm: 2 } }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {a.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        ID: {a.id} | Grado: {a.grado}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Email: {a.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          onClick={() => handleEditAlumno(a)}
                          fullWidth={isMobile}
                          size="small"
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleDeleteAlumno(a.id)}
                          fullWidth={isMobile}
                          size="small"
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              // Vista de tabla para desktop
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#192d63' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Nombre</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Grado</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Email</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAlumnos.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{a.id}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{a.nombre}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{a.grado}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{a.email}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            onClick={() => handleEditAlumno(a)}
                            sx={{ mr: 1 }}
                            size="small"
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={() => handleDeleteAlumno(a.id)}
                            size="small"
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Paginación */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAlumnos.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Box>
        );
      case 'maestros':
        return <MaestrosTable />;
      case 'materias':
        return <MateriasTable />;
      case 'relaciones':
        return <RelacionesTable />;
      case 'gestion-relaciones':
        return <GestionRelaciones />;
      default:
        return <Dashboard />;
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h6">Cargando...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Mostrar login si no está autenticado
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={login} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header 
          user={user} 
          onLogout={logout} 
          isMobile={isMobile}
          onMobileMenuOpen={handleMobileMenuOpen}
        />
        {!isMobile && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            width: { xs: '100%', lg: `calc(100% - 240px)` },
            ml: { xs: 0, lg: '240px' },
            mt: '64px' // Espacio para el header fijo
          }}
        >
          {renderContent()}
        </Box>
      </Box>

      {/* Menú móvil */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        <MenuItem onClick={() => handleMobileTabChange('dashboard')}>
          Dashboard
        </MenuItem>
        <MenuItem onClick={() => handleMobileTabChange('alumnos')}>
          Alumnos
        </MenuItem>
        <MenuItem onClick={() => handleMobileTabChange('maestros')}>
          Maestros
        </MenuItem>
        <MenuItem onClick={() => handleMobileTabChange('materias')}>
          Materias
        </MenuItem>
        <MenuItem onClick={() => handleMobileTabChange('relaciones')}>
          Relaciones
        </MenuItem>
        <MenuItem onClick={() => handleMobileTabChange('gestion-relaciones')}>
          Gestión Relaciones
        </MenuItem>
      </Menu>

      {/* Modal de edición */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Alumno</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={editingAlumno?.nombre || ''}
              onChange={(e) => setEditingAlumno({ ...editingAlumno, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Grado"
              type="number"
              value={editingAlumno?.grado || ''}
              onChange={(e) => setEditingAlumno({ ...editingAlumno, grado: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editingAlumno?.email || ''}
              onChange={(e) => setEditingAlumno({ ...editingAlumno, email: e.target.value })}
              fullWidth
            />
            <Button component="label" variant="outlined" disabled={subiendoEdit}>
              {subiendoEdit ? 'Subiendo...' : (editingAlumno?.foto_url ? 'Cambiar foto' : 'Subir foto')}
              <input ref={uploadInputEditRef} type="file" hidden accept="image/png,image/jpeg" onChange={handleUploadAlumnoEdit} />
            </Button>
            {editingAlumno?.foto_url && (
              <img src={`${axios.defaults.baseURL}${editingAlumno.foto_url}`} alt="alumno" style={{ height: 48, borderRadius: 4 }} />
            )}
            {/* Campo de ID Maestro opcional
            <TextField
              label="ID Maestro (opcional)"
              type="number"
              value={editingAlumno?.maestro_id || ''}
              onChange={(e) => setEditingAlumno({ ...editingAlumno, maestro_id: e.target.value })}
              fullWidth
            />
            */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdateAlumno} variant="contained" sx={{ bgcolor: '#192d63' }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
