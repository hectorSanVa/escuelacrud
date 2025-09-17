import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from '../config/axios';

const GestionRelaciones = () => {
  // Estados para datos
  const [maestros, setMaestros] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [relacionesMaestroMateria, setRelacionesMaestroMateria] = useState([]);
  const [relacionesAlumnoMateria, setRelacionesAlumnoMateria] = useState([]);

  // Estados para formularios
  const [selectedMaestro, setSelectedMaestro] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [calificacion, setCalificacion] = useState('');

  // Estados para diálogos
  const [openAsignarMateria, setOpenAsignarMateria] = useState(false);
  const [openInscribirAlumno, setOpenInscribirAlumno] = useState(false);
  const [openCalificacion, setOpenCalificacion] = useState(false);
  const [editingCalificacion, setEditingCalificacion] = useState(null);

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const cargarDatos = useCallback(async () => {
    console.log('=== INICIANDO CARGA DE DATOS ===');
    
    try {
      console.log('Cargando datos básicos...');
      const [maestrosRes, materiasRes, alumnosRes] = await Promise.all([
        axios.get('/maestros'),
        axios.get('/materias'),
        axios.get('/alumnos')
      ]);

      console.log('Datos básicos cargados:', {
        maestros: maestrosRes.data,
        materias: materiasRes.data,
        alumnos: alumnosRes.data
      });

      setMaestros(maestrosRes.data);
      setMaterias(materiasRes.data);
      setAlumnos(alumnosRes.data);

      // Intentar cargar relaciones, si falla es porque las tablas no existen
      console.log('Intentando cargar relaciones...');
      try {
        const [relacionesRes, alumnosMateriasRes] = await Promise.all([
          axios.get('/maestros/materias'),
          axios.get('/alumnos/materias')
        ]);
        
        console.log('Relaciones cargadas exitosamente:', {
          relacionesMaestro: relacionesRes.data,
          relacionesAlumno: alumnosMateriasRes.data
        });
        
        setRelacionesMaestroMateria(relacionesRes.data);
        setRelacionesAlumnoMateria(alumnosMateriasRes.data);
        
        console.log('Datos cargados:', {
          maestros: maestrosRes.data.length,
          materias: materiasRes.data.length,
          alumnos: alumnosRes.data.length,
          relacionesMaestro: relacionesRes.data.length,
          relacionesAlumno: alumnosMateriasRes.data.length
        });
      } catch (relError) {
        console.error('Error cargando relaciones:', relError);
        console.log('Tablas de relaciones no existen o hay error, inicializando vacías');
        setRelacionesMaestroMateria([]);
        setRelacionesAlumnoMateria([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      if (error.response?.status === 401) {
        console.log('Error 401 - Token inválido, recargando página');
        window.location.reload();
      } else {
        console.error('Error detallado:', error.response?.data || error.message);
        showSnackbar('Error al cargar los datos. Verifica que el servidor esté funcionando.', 'error');
      }
    }
    
    console.log('=== FIN CARGA DE DATOS ===');
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const crearTablasRelaciones = async () => {
    try {
      await axios.post('/setup-tables');
      showSnackbar('Tablas de relaciones creadas exitosamente');
      cargarDatos(); // Recargar datos
    } catch (error) {
      console.error('Error creando tablas:', error);
      showSnackbar('Error al crear las tablas de relaciones', 'error');
    }
  };

  const handleAsignarMateria = async () => {
    if (!selectedMaestro || !selectedMateria) {
      showSnackbar('Por favor selecciona un maestro y una materia', 'error');
      return;
    }

    try {
      await axios.post(`/maestros/${Number(selectedMaestro)}/materias`, {
        materia_id: Number(selectedMateria)
      });

      showSnackbar('Materia asignada al maestro exitosamente');
      cargarDatos();
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
      setOpenAsignarMateria(false);
      setSelectedMaestro('');
      setSelectedMateria('');
    } catch (error) {
      console.error('Error al asignar materia:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Error al asignar materia';
      showSnackbar(msg, 'error');
    }
  };

  const handleInscribirAlumno = async () => {
    if (!selectedAlumno || !selectedMateria) {
      showSnackbar('Por favor selecciona un alumno y una materia', 'error');
      return;
    }

    try {
      await axios.post(`/alumnos/${Number(selectedAlumno)}/materias`, {
        materia_id: Number(selectedMateria),
        calificacion: calificacion || null
      });

      showSnackbar('Alumno inscrito en la materia exitosamente');
      cargarDatos();
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
      setOpenInscribirAlumno(false);
      setSelectedAlumno('');
      setSelectedMateria('');
      setCalificacion('');
    } catch (error) {
      console.error('Error al inscribir alumno:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Error al inscribir alumno';
      showSnackbar(msg, 'error');
    }
  };

  const handleActualizarCalificacion = async () => {
    if (!editingCalificacion || !calificacion) {
      showSnackbar('Por favor ingresa una calificación válida', 'error');
      return;
    }

    try {
      await axios.put(`/alumnos/${editingCalificacion.alumno_id}/materias/${editingCalificacion.materia_id}`, {
        calificacion: parseFloat(calificacion)
      });

      showSnackbar('Calificación actualizada exitosamente');
      cargarDatos();
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
      setOpenCalificacion(false);
      setEditingCalificacion(null);
      setCalificacion('');
    } catch (error) {
      console.error('Error al actualizar calificación:', error);
      showSnackbar('Error al actualizar calificación', 'error');
    }
  };

  const handleEliminarRelacionMaestro = async (maestroId, materiaId) => {
    try {
      await axios.delete(`/maestros/${maestroId}/materias/${materiaId}`);
      showSnackbar('Relación eliminada exitosamente');
      cargarDatos();
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
    } catch (error) {
      console.error('Error al eliminar relación:', error);
      showSnackbar('Error al eliminar relación', 'error');
    }
  };

  const handleEliminarRelacionAlumno = async (alumnoId, materiaId) => {
    try {
      await axios.delete(`/alumnos/${alumnoId}/materias/${materiaId}`);
      showSnackbar('Inscripción eliminada exitosamente');
      cargarDatos();
      window.dispatchEvent(new CustomEvent('relaciones-updated'));
    } catch (error) {
      console.error('Error al eliminar inscripción:', error);
      showSnackbar('Error al eliminar inscripción', 'error');
    }
  };

  const abrirDialogCalificacion = (relacion) => {
    setEditingCalificacion(relacion);
    setCalificacion(relacion.calificacion || '');
    setOpenCalificacion(true);
  };

  const getCalificacionColor = (calificacion) => {
    if (!calificacion) return 'default';
    if (calificacion >= 8) return 'success';
    if (calificacion >= 6) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#192d63', fontWeight: 'bold' }}>
        <AssignmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Gestión de Relaciones
      </Typography>

      {/* Información de debugging */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
          🔍 Información de Debug
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Maestros cargados:</strong> {maestros.length}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Materias cargadas:</strong> {materias.length}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Alumnos cargados:</strong> {alumnos.length}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Relaciones maestro-materia:</strong> {relacionesMaestroMateria.length}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Relaciones alumno-materia:</strong> {relacionesAlumnoMateria.length}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Abre la consola del navegador (F12) para ver logs detallados
        </Typography>
      </Box>

      {/* Botón para crear tablas si no existen */}
      {(maestros.length > 0 && materias.length > 0 && alumnos.length > 0) && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Si es la primera vez que usas esta funcionalidad, necesitas crear las tablas de relaciones:
          </Typography>
          <Button
            variant="outlined"
            onClick={crearTablasRelaciones}
            sx={{ 
              borderColor: '#192d63',
              color: '#192d63',
              '&:hover': { 
                borderColor: '#0f1a42',
                backgroundColor: 'rgba(25, 45, 99, 0.04)'
              }
            }}
          >
            Crear Tablas de Relaciones
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Asignar Materias a Maestros */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#192d63', display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Asignar Materias a Maestros
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAsignarMateria(true)}
                sx={{ 
                  mb: 2, 
                  backgroundColor: '#192d63',
                  '&:hover': { backgroundColor: '#0f1a42' }
                }}
              >
                Asignar Nueva Materia
              </Button>

              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Maestro</TableCell>
                      <TableCell>Materia</TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relacionesMaestroMateria.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay materias asignadas a maestros aún.
                            <br />
                            Haz clic en "Asignar Nueva Materia" para comenzar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      relacionesMaestroMateria.map((relacion, index) => (
                        <TableRow key={index}>
                          <TableCell>{relacion.maestro_nombre}</TableCell>
                          <TableCell>{relacion.materia_nombre}</TableCell>
                          <TableCell>{relacion.materia_codigo}</TableCell>
                          <TableCell>
                            <Tooltip title="Eliminar asignación">
                              <IconButton
                                color="error"
                                onClick={() => handleEliminarRelacionMaestro(relacion.maestro_id, relacion.materia_id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Inscribir Alumnos en Materias */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#192d63', display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                Inscribir Alumnos en Materias
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenInscribirAlumno(true)}
                sx={{ 
                  mb: 2, 
                  backgroundColor: '#192d63',
                  '&:hover': { backgroundColor: '#0f1a42' }
                }}
              >
                Nueva Inscripción
              </Button>

              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alumno</TableCell>
                      <TableCell>Materia</TableCell>
                      <TableCell>Calificación</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relacionesAlumnoMateria.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay alumnos inscritos en materias aún.
                            <br />
                            Haz clic en "Nueva Inscripción" para comenzar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      relacionesAlumnoMateria.map((relacion, index) => (
                        <TableRow key={index}>
                          <TableCell>{relacion.alumno_nombre}</TableCell>
                          <TableCell>{relacion.materia_nombre}</TableCell>
                          <TableCell>
                            <Chip
                              label={relacion.calificacion ? `${relacion.calificacion}` : 'Sin calificar'}
                              color={getCalificacionColor(relacion.calificacion)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Editar calificación">
                              <IconButton
                                color="primary"
                                onClick={() => abrirDialogCalificacion(relacion)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar inscripción">
                              <IconButton
                                color="error"
                                onClick={() => handleEliminarRelacionAlumno(relacion.alumno_id, relacion.materia_id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para Asignar Materia a Maestro */}
      <Dialog open={openAsignarMateria} onClose={() => setOpenAsignarMateria(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Materia a Maestro</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Seleccionar Maestro</InputLabel>
            <Select
              value={selectedMaestro}
              onChange={(e) => setSelectedMaestro(e.target.value)}
            >
              {maestros.map((maestro) => (
                <MenuItem key={maestro.id} value={maestro.id}>
                  {maestro.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Seleccionar Materia</InputLabel>
            <Select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
            >
              {materias.map((materia) => (
                <MenuItem key={materia.id} value={materia.id}>
                  {materia.nombre} ({materia.codigo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAsignarMateria(false)}>Cancelar</Button>
          <Button onClick={handleAsignarMateria} variant="contained">Asignar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Inscribir Alumno */}
      <Dialog open={openInscribirAlumno} onClose={() => setOpenInscribirAlumno(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inscribir Alumno en Materia</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Seleccionar Alumno</InputLabel>
            <Select
              value={selectedAlumno}
              onChange={(e) => setSelectedAlumno(e.target.value)}
            >
              {alumnos.map((alumno) => (
                <MenuItem key={alumno.id} value={alumno.id}>
                  {alumno.nombre} - Grado: {alumno.grado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Seleccionar Materia</InputLabel>
            <Select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
            >
              {materias.map((materia) => (
                <MenuItem key={materia.id} value={materia.id}>
                  {materia.nombre} ({materia.codigo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Calificación (opcional)"
            type="number"
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: 10, step: 0.1 }}
            helperText="Calificación de 0 a 10 (opcional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInscribirAlumno(false)}>Cancelar</Button>
          <Button onClick={handleInscribirAlumno} variant="contained">Inscribir</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Editar Calificación */}
      <Dialog open={openCalificacion} onClose={() => setOpenCalificacion(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <GradeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Editar Calificación
        </DialogTitle>
        <DialogContent>
          {editingCalificacion && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Alumno:</strong> {editingCalificacion.alumno_nombre}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Materia:</strong> {editingCalificacion.materia_nombre}
              </Typography>
              
              <TextField
                fullWidth
                label="Calificación"
                type="number"
                value={calificacion}
                onChange={(e) => setCalificacion(e.target.value)}
                inputProps={{ min: 0, max: 10, step: 0.1 }}
                helperText="Calificación de 0 a 10"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCalificacion(false)}>Cancelar</Button>
          <Button onClick={handleActualizarCalificacion} variant="contained">Actualizar</Button>
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
};

export default GestionRelaciones;
