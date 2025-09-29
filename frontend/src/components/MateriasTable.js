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

function MateriasTable() {
  const [materias, setMaterias] = useState([]);
  const [nuevaMateria, setNuevaMateria] = useState({ nombre: '', codigo: '', creditos: '' });
  const [editingMateria, setEditingMateria] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchMaterias = async () => {
    try {
      const res = await axios.get('/materias');
      setMaterias(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Redirigir al login si no está autenticado
        window.location.reload();
      }
      console.error('Error fetching materias:', error);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const validateForm = (materia) => {
    if (!materia.nombre.trim()) return 'El nombre es requerido';
    if (!materia.codigo.trim()) return 'El código es requerido';
    if (!materia.creditos || materia.creditos <= 0) return 'Los créditos deben ser mayor a 0';
    return null;
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddMateria = async () => {
    const error = validateForm(nuevaMateria);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      await axios.post('/materias', {
        ...nuevaMateria,
        creditos: Number(nuevaMateria.creditos)
      });
      setNuevaMateria({ nombre: '', codigo: '', creditos: '' });
      fetchMaterias();
      showSnackbar('Materia agregada exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('materias-updated'));
    } catch (error) {
      showSnackbar('Error al agregar materia', 'error');
    }
  };

  const handleEditMateria = (materia) => {
    setEditingMateria({ ...materia });
    setOpenEditDialog(true);
  };

  const handleUpdateMateria = async () => {
    const error = validateForm(editingMateria);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      await axios.put(`/materias/${editingMateria.id}`, {
        ...editingMateria,
        creditos: Number(editingMateria.creditos)
      });
      setOpenEditDialog(false);
      setEditingMateria(null);
      fetchMaterias();
      showSnackbar('Materia actualizada exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('materias-updated'));
    } catch (error) {
      showSnackbar('Error al actualizar materia', 'error');
    }
  };

  const handleDeleteMateria = async (id) => {
    try {
      await axios.delete(`/materias/${id}`);
      fetchMaterias();
      showSnackbar('Materia eliminada exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('materias-updated'));
    } catch (error) {
      showSnackbar('Error al eliminar materia', 'error');
    }
  };

  const filteredMaterias = materias.filter(materia =>
    materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    materia.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMaterias = filteredMaterias.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box id="materias-section">
      <Typography variant="h5" gutterBottom sx={{ color: '#192d63', fontWeight: 'bold', mb: 3 }}>
        Gestión de Materias
      </Typography>

      {/* Formulario de agregar */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <TextField 
          label="Nombre" 
          value={nuevaMateria.nombre} 
          onChange={(e) => setNuevaMateria({ ...nuevaMateria, nombre: e.target.value })}
          required
        />
        <TextField 
          label="Código" 
          value={nuevaMateria.codigo} 
          onChange={(e) => setNuevaMateria({ ...nuevaMateria, codigo: e.target.value })}
          required
        />
        <TextField 
          label="Créditos" 
          type="number"
          value={nuevaMateria.creditos} 
          onChange={(e) => setNuevaMateria({ ...nuevaMateria, creditos: e.target.value })}
          required
        />
        <Button variant="contained" onClick={handleAddMateria} sx={{ bgcolor: '#192d63' }}>
          Agregar Materia
        </Button>
      </Box>

      {/* Búsqueda */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Buscar por nombre o código"
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
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Créditos</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedMaterias.map((m) => (
            <TableRow key={m.id} hover>
              <TableCell>{m.id}</TableCell>
              <TableCell>{m.nombre}</TableCell>
              <TableCell>{m.codigo}</TableCell>
              <TableCell>{m.creditos}</TableCell>
              <TableCell>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => handleEditMateria(m)}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => handleDeleteMateria(m.id)}
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
        count={filteredMaterias.length}
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
        <DialogTitle>Editar Materia</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={editingMateria?.nombre || ''}
              onChange={(e) => setEditingMateria({ ...editingMateria, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Código"
              value={editingMateria?.codigo || ''}
              onChange={(e) => setEditingMateria({ ...editingMateria, codigo: e.target.value })}
              fullWidth
            />
            <TextField
              label="Créditos"
              type="number"
              value={editingMateria?.creditos || ''}
              onChange={(e) => setEditingMateria({ ...editingMateria, creditos: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdateMateria} variant="contained" sx={{ bgcolor: '#192d63' }}>
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

export default MateriasTable;
