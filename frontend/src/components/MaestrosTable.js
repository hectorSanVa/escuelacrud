import React, { useEffect, useState } from 'react';
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
  TablePagination,
  Alert,
  Snackbar,
  Typography
} from '@mui/material';
import axios from '../config/axios';

function MaestrosTable() {
  const [maestros, setMaestros] = useState([]);
  const [nuevoMaestro, setNuevoMaestro] = useState({ nombre: '', materia: '', email: '' });
  const [editingMaestro, setEditingMaestro] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchMaestros = async () => {
    try {
      const res = await axios.get('/maestros');
      setMaestros(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Redirigir al login si no está autenticado
        window.location.reload();
      }
      console.error('Error fetching maestros:', error);
    }
  };

  useEffect(() => {
    fetchMaestros();
  }, []);

  const validateForm = (maestro) => {
    if (!maestro.nombre.trim()) return 'El nombre es requerido';
    // La materia ahora es opcional en la ficha del maestro
    if (!maestro.email.trim()) return 'El email es requerido';
    return null;
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddMaestro = async () => {
    const error = validateForm(nuevoMaestro);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      await axios.post('/maestros', nuevoMaestro);
      setNuevoMaestro({ nombre: '', materia: '', email: '' });
      fetchMaestros();
      showSnackbar('Maestro agregado exitosamente');
    } catch (error) {
      showSnackbar('Error al agregar maestro', 'error');
    }
  };

  const handleEditMaestro = (maestro) => {
    setEditingMaestro({ ...maestro });
    setOpenEditDialog(true);
  };

  const handleUpdateMaestro = async () => {
    const error = validateForm(editingMaestro);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      await axios.put(`/maestros/${editingMaestro.id}`, editingMaestro);
      setOpenEditDialog(false);
      setEditingMaestro(null);
      fetchMaestros();
      showSnackbar('Maestro actualizado exitosamente');
    } catch (error) {
      showSnackbar('Error al actualizar maestro', 'error');
    }
  };

  const handleDeleteMaestro = async (id) => {
    try {
      await axios.delete(`/maestros/${id}`);
      fetchMaestros();
      showSnackbar('Maestro eliminado exitosamente');
    } catch (error) {
      showSnackbar('Error al eliminar maestro', 'error');
    }
  };

  const filteredMaestros = maestros.filter(maestro =>
    maestro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maestro.materia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMaestros = filteredMaestros.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: '#192d63', fontWeight: 'bold', mb: 3 }}>
        Gestión de Maestros
      </Typography>

      {/* Formulario de agregar */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <TextField 
          label="Nombre" 
          value={nuevoMaestro.nombre} 
          onChange={(e) => setNuevoMaestro({ ...nuevoMaestro, nombre: e.target.value })}
          required
        />
        <TextField 
          label="Materia (opcional)" 
          value={nuevoMaestro.materia} 
          onChange={(e) => setNuevoMaestro({ ...nuevoMaestro, materia: e.target.value })}
        />
        <TextField 
          label="Email" 
          value={nuevoMaestro.email} 
          onChange={(e) => setNuevoMaestro({ ...nuevoMaestro, email: e.target.value })}
          required
        />
        <Button variant="contained" onClick={handleAddMaestro} sx={{ bgcolor: '#192d63' }}>
          Agregar Maestro
        </Button>
      </Box>

      {/* Búsqueda */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Buscar por nombre o materia"
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
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Materia</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedMaestros.map((m) => (
            <TableRow key={m.id} hover>
              <TableCell>{m.id}</TableCell>
              <TableCell>{m.nombre}</TableCell>
              <TableCell>{m.materia}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => handleEditMaestro(m)}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => handleDeleteMaestro(m.id)}
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
        count={filteredMaestros.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      {/* Modal de edición */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Maestro</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={editingMaestro?.nombre || ''}
              onChange={(e) => setEditingMaestro({ ...editingMaestro, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Materia"
              value={editingMaestro?.materia || ''}
              onChange={(e) => setEditingMaestro({ ...editingMaestro, materia: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editingMaestro?.email || ''}
              onChange={(e) => setEditingMaestro({ ...editingMaestro, email: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdateMaestro} variant="contained" sx={{ bgcolor: '#192d63' }}>
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
    </Box>
  );
}

export default MaestrosTable;