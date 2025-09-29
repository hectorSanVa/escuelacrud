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
  CssBaseline
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
            
            {/* Formulario de agregar */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <TextField 
                label="Nombre" 
                value={nuevoAlumno.nombre} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, nombre: e.target.value })}
                required
              />
              <TextField 
                label="Grado" 
                type="number" 
                value={nuevoAlumno.grado} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, grado: e.target.value })}
                required
              />
              <TextField 
                label="Email" 
                value={nuevoAlumno.email} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, email: e.target.value })}
                required
              />
              <Button component="label" variant="outlined" disabled={subiendoNuevo}>
                {subiendoNuevo ? 'Subiendo...' : (nuevoAlumno.foto_url ? 'Cambiar foto' : 'Subir foto')}
                <input ref={uploadInputNuevoRef} type="file" hidden accept="image/png,image/jpeg" onChange={handleUploadAlumnoNuevo} />
              </Button>
              {nuevoAlumno.foto_url && (
                <img src={`${axios.defaults.baseURL}${nuevoAlumno.foto_url}`} alt="alumno" style={{ height: 48, borderRadius: 4 }} />
              )}
              {/* Campo de ID Maestro opcional (tutor). Puedes habilitarlo si lo necesitas.
              <TextField 
                label="ID Maestro (opcional)" 
                type="number" 
                value={nuevoAlumno.maestro_id} 
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, maestro_id: e.target.value })}
              />
              */}
              <Button variant="contained" onClick={handleAddAlumno} sx={{ bgcolor: '#192d63' }}>
                Agregar Alumno
              </Button>
            </Box>

            {/* Búsqueda */}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Buscar por nombre o grado"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 300 }}
              />
            </Box>

            {/* Tabla */}
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#192d63' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAlumnos.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{a.nombre}</TableCell>
                    <TableCell>{a.grado}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={() => handleEditAlumno(a)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={() => handleDeleteAlumno(a.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
        <Header user={user} onLogout={logout} />
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 240px)` },
            ml: { sm: '240px' },
            mt: '64px' // Espacio para el header fijo
          }}
        >
          {renderContent()}
        </Box>
      </Box>

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
