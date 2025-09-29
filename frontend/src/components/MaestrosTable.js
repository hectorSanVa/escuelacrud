import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput
} from '@mui/material';
import axios from '../config/axios';

function MaestrosTable() {
  const [maestros, setMaestros] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [relacionesMaestroMateria, setRelacionesMaestroMateria] = useState([]);
  const [nuevoMaestro, setNuevoMaestro] = useState({ nombre: '', materia_id: '', email: '', foto_url: '' });
  const [editingMaestro, setEditingMaestro] = useState(null);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const fileInputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputEditRef = useRef(null);
  const [subiendoEdit, setSubiendoEdit] = useState(false);

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('foto', file);
    setSubiendo(true);
    try {
      const { data } = await axios.post('/upload/maestros', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNuevoMaestro((prev) => ({ ...prev, foto_url: data.url }));
    } catch (err) {
      // noop
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadFotoEdit = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('foto', file);
    setSubiendoEdit(true);
    try {
      const { data } = await axios.post('/upload/maestros', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingMaestro((prev) => ({ ...prev, foto_url: data.url }));
    } catch (err) {
      // noop
    } finally {
      setSubiendoEdit(false);
      if (fileInputEditRef.current) {
        fileInputEditRef.current.value = '';
      }
    }
  };
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchMaestros = useCallback(async () => {
    try {
      const res = await axios.get('/maestros');
      setMaestros(res.data);
      
      // Verificar si hay maestros con materias asignadas que no tienen relaciones
      for (const maestro of res.data) {
        if (maestro.materia && maestro.materia.trim() !== '') {
          const materiaEncontrada = materias.find(m => m.nombre === maestro.materia);
          if (materiaEncontrada) {
            try {
              // Intentar crear la relación si no existe
              await axios.post(`/maestros/${maestro.id}/materias`, {
                materia_id: materiaEncontrada.id
              });
              console.log(`✅ Relación creada para maestro ${maestro.nombre} con materia ${maestro.materia}`);
            } catch (relError) {
              // Si ya existe la relación, no es un error
              if (relError.response?.status !== 400) {
                console.warn(`⚠️ Error creando relación para maestro ${maestro.nombre}:`, relError);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // Redirigir al login si no está autenticado
        window.location.reload();
      }
      console.error('Error fetching maestros:', error);
    }
  }, [materias]);

  const fetchMaterias = useCallback(async () => {
    try {
      const res = await axios.get('/materias');
      setMaterias(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.reload();
      }
      console.error('Error fetching materias:', error);
    }
  }, []);

  const fetchRelacionesMaestroMateria = useCallback(async () => {
    try {
      const res = await axios.get('/maestros/materias');
      setRelacionesMaestroMateria(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.reload();
      }
      console.error('Error fetching relaciones maestro-materia:', error);
    }
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      await fetchMaterias();
      await fetchMaestros();
      await fetchRelacionesMaestroMateria();
    };
    cargarDatos();
  }, [fetchMaterias, fetchMaestros, fetchRelacionesMaestroMateria]);

  // Escuchar eventos de actualización de relaciones
  useEffect(() => {
    const handleRelacionesUpdated = () => {
      console.log('🔔 Evento relaciones-updated recibido en MaestrosTable');
      fetchRelacionesMaestroMateria();
    };

    window.addEventListener('relaciones-updated', handleRelacionesUpdated);

    return () => {
      window.removeEventListener('relaciones-updated', handleRelacionesUpdated);
    };
  }, [fetchRelacionesMaestroMateria]);

  const validateForm = (maestro) => {
    if (!maestro.nombre.trim()) return 'El nombre es requerido';
    // La materia ahora es opcional en la ficha del maestro
    if (!maestro.email.trim()) return 'El email es requerido';
    return null;
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getMateriasAsignadas = (maestroId) => {
    // Buscar materias asignadas desde las relaciones
    const materiasRelacionadas = relacionesMaestroMateria
      .filter(rel => rel.maestro_id === maestroId)
      .map(rel => rel.materia_nombre);
    
    return materiasRelacionadas;
  };

  const getMateriaDisplay = (maestro) => {
    // Si el maestro tiene materia en el campo directo, usarla
    if (maestro.materia && maestro.materia.trim() !== '') {
      return maestro.materia;
    }
    
    // Si no, buscar en las relaciones
    const materiasAsignadas = getMateriasAsignadas(maestro.id);
    if (materiasAsignadas.length > 0) {
      return materiasAsignadas.join(', ');
    }
    
    return '';
  };

  const handleAddMaestro = async () => {
    const error = validateForm(nuevoMaestro);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      // Preparar los datos para enviar
      const datosMaestro = {
        nombre: nuevoMaestro.nombre,
        email: nuevoMaestro.email,
        foto_url: nuevoMaestro.foto_url,
        materia: nuevoMaestro.materia_id ? materias.find(m => m.id === parseInt(nuevoMaestro.materia_id))?.nombre || '' : ''
      };
      
      const response = await axios.post('/maestros', datosMaestro);
      const maestroId = response.data.id;
      
      // Si se asignó una materia, crear la relación en maestro_materia
      if (nuevoMaestro.materia_id) {
        try {
          await axios.post(`/maestros/${maestroId}/materias`, {
            materia_id: parseInt(nuevoMaestro.materia_id)
          });
        } catch (relError) {
          console.warn('Error creando relación maestro-materia:', relError);
          // No mostramos error al usuario porque el maestro ya se creó exitosamente
        }
      }
      
      setNuevoMaestro({ nombre: '', materia_id: '', email: '', foto_url: '' });
      await fetchMaestros();
      await fetchRelacionesMaestroMateria();
      showSnackbar('Maestro agregado exitosamente');
      // Disparar evento para actualizar otros componentes
      console.log('🚀 Disparando eventos desde MaestrosTable - maestro agregado');
      window.dispatchEvent(new CustomEvent('maestros-updated'));
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
    } catch (error) {
      showSnackbar('Error al agregar maestro', 'error');
    }
  };

  const handleEditMaestro = (maestro) => {
    // Obtener las materias asignadas desde las relaciones
    const materiasAsignadas = getMateriasAsignadas(maestro.id);
    const materiasIds = materiasAsignadas.map(materiaNombre => {
      const materia = materias.find(m => m.nombre === materiaNombre);
      return materia ? materia.id.toString() : null;
    }).filter(Boolean);
    
    setEditingMaestro({ 
      ...maestro, 
      materia_id: '' // Ya no usamos este campo individual
    });
    setMateriasSeleccionadas(materiasIds);
    setOpenEditDialog(true);
  };

  const handleUpdateMaestro = async () => {
    const error = validateForm(editingMaestro);
    if (error) {
      showSnackbar(error, 'error');
      return;
    }

    try {
      // Obtener las materias anteriores desde las relaciones
      const materiasAnteriores = getMateriasAsignadas(editingMaestro.id);
      const materiasAnterioresIds = materiasAnteriores.map(materiaNombre => {
        const materia = materias.find(m => m.nombre === materiaNombre);
        return materia ? materia.id : null;
      }).filter(Boolean);
      
      // Preparar los datos para enviar (sin materia en el campo directo)
      const datosMaestro = {
        nombre: editingMaestro.nombre,
        email: editingMaestro.email,
        foto_url: editingMaestro.foto_url,
        materia: '' // Ya no guardamos materia en el campo directo
      };
      
      await axios.put(`/maestros/${editingMaestro.id}`, datosMaestro);
      
      // Obtener las nuevas materias seleccionadas
      const nuevasMateriasIds = materiasSeleccionadas.map(id => parseInt(id));
      
      // Eliminar todas las relaciones anteriores
      for (const materiaId of materiasAnterioresIds) {
        try {
          await axios.delete(`/maestros/${editingMaestro.id}/materias/${materiaId}`);
        } catch (delError) {
          console.warn('Error eliminando relación anterior:', delError);
        }
      }
      
      // Crear las nuevas relaciones
      for (const materiaId of nuevasMateriasIds) {
        try {
          await axios.post(`/maestros/${editingMaestro.id}/materias`, {
            materia_id: materiaId
          });
        } catch (relError) {
          console.warn('Error creando nueva relación maestro-materia:', relError);
        }
      }
      
      setOpenEditDialog(false);
      setEditingMaestro(null);
      setMateriasSeleccionadas([]);
      await fetchMaestros();
      await fetchRelacionesMaestroMateria();
      showSnackbar('Maestro actualizado exitosamente');
      // Disparar evento para actualizar otros componentes
      console.log('🚀 Disparando eventos desde MaestrosTable - maestro actualizado');
      window.dispatchEvent(new CustomEvent('maestros-updated'));
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
    } catch (error) {
      showSnackbar('Error al actualizar maestro', 'error');
    }
  };

  const handleDeleteMaestro = async (id) => {
    try {
      await axios.delete(`/maestros/${id}`);
      await fetchMaestros();
      await fetchRelacionesMaestroMateria();
      showSnackbar('Maestro eliminado exitosamente');
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new CustomEvent('maestros-updated'));
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
    } catch (error) {
      showSnackbar('Error al eliminar maestro', 'error');
    }
  };

  const filteredMaestros = maestros.filter(maestro => {
    const materiaDisplay = getMateriaDisplay(maestro);
    return maestro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           materiaDisplay.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const paginatedMaestros = filteredMaestros.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box id="maestros-section">
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
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Materia (opcional)</InputLabel>
          <Select
            value={nuevoMaestro.materia_id}
            onChange={(e) => setNuevoMaestro({ ...nuevoMaestro, materia_id: e.target.value })}
            label="Materia (opcional)"
          >
            <MenuItem value="">
              <em>Sin materia específica</em>
            </MenuItem>
            {materias.map((materia) => (
              <MenuItem key={materia.id} value={materia.id.toString()}>
                {materia.nombre} ({materia.codigo})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField 
          label="Email" 
          value={nuevoMaestro.email} 
          onChange={(e) => setNuevoMaestro({ ...nuevoMaestro, email: e.target.value })}
          required
        />
        <Button component="label" variant="outlined" disabled={subiendo}>
          {subiendo ? 'Subiendo...' : (nuevoMaestro.foto_url ? 'Cambiar foto' : 'Subir foto')}
          <input ref={fileInputRef} type="file" hidden accept="image/png,image/jpeg" onChange={handleUploadFoto} />
        </Button>
        {nuevoMaestro.foto_url && (
          <img src={`${axios.defaults.baseURL}${nuevoMaestro.foto_url}`} alt="Foto maestro" style={{ height: 48, borderRadius: 4 }} />
        )}
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
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Foto</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedMaestros.map((m) => (
            <TableRow key={m.id} hover>
              <TableCell>{m.id}</TableCell>
              <TableCell>{m.nombre}</TableCell>
              <TableCell>{getMateriaDisplay(m)}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>
                {m.foto_url ? (
                  <img src={`${axios.defaults.baseURL}${m.foto_url}`} alt="maestro" style={{ height: 36, borderRadius: 4 }} />
                ) : '-'}
              </TableCell>
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
      <Dialog open={openEditDialog} onClose={() => {
        setOpenEditDialog(false);
        setMateriasSeleccionadas([]);
        setEditingMaestro(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Maestro</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={editingMaestro?.nombre || ''}
              onChange={(e) => setEditingMaestro({ ...editingMaestro, nombre: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Materias</InputLabel>
              <Select
                multiple
                value={materiasSeleccionadas}
                onChange={(e) => setMateriasSeleccionadas(e.target.value)}
                input={<OutlinedInput label="Materias" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const materia = materias.find(m => m.id.toString() === value);
                      return (
                        <Chip 
                          key={value} 
                          label={materia ? `${materia.nombre} (${materia.codigo})` : value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {materias.map((materia) => (
                  <MenuItem key={materia.id} value={materia.id.toString()}>
                    {materia.nombre} ({materia.codigo})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Email"
              value={editingMaestro?.email || ''}
              onChange={(e) => setEditingMaestro({ ...editingMaestro, email: e.target.value })}
              fullWidth
            />
            <Button component="label" variant="outlined" disabled={subiendoEdit}>
              {subiendoEdit ? 'Subiendo...' : (editingMaestro?.foto_url ? 'Cambiar foto' : 'Subir foto')}
              <input ref={fileInputEditRef} type="file" hidden accept="image/png,image/jpeg" onChange={handleUploadFotoEdit} />
            </Button>
            {editingMaestro?.foto_url && (
              <img src={`${axios.defaults.baseURL}${editingMaestro.foto_url}`} alt="Foto maestro" style={{ height: 48, borderRadius: 4 }} />
            )}
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