import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from '../config/axios';

function RelacionesTable() {
  const [activeTab, setActiveTab] = useState(0);
  const [alumnosCompleto, setAlumnosCompleto] = useState([]);
  const [maestrosCompleto, setMaestrosCompleto] = useState([]);
  const [materiasCompleto, setMateriasCompleto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para modal de detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailRows, setDetailRows] = useState([]);
  const [detailColumns, setDetailColumns] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAlumnosCompleto = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/alumnos/materias');
      setAlumnosCompleto(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.reload();
      } else {
        setError('Error al cargar datos de alumnos');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMaestrosCompleto = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/maestros/materias');
      setMaestrosCompleto(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.reload();
      } else {
        setError('Error al cargar datos de maestros');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMateriasCompleto = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/materias/detalles');
      setMateriasCompleto(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.reload();
      } else {
        setError('Error al cargar datos de materias');
      }
    } finally {
      setLoading(false);
    }
  };

  // Abrir detalle de Alumno
  const openAlumnoDetalle = async (alumnoId, alumnoNombre) => {
    try {
      setDetailLoading(true);
      setDetailTitle(`Detalle de alumno: ${alumnoNombre}`);
      const res = await axios.get(`/alumnos/${alumnoId}/calificaciones`);
      setDetailColumns(['Materia', 'Código', 'Calificación', 'Maestro']);
      const rows = res.data.map(r => ({
        Materia: r.materia_nombre || '-',
        Código: r.materia_codigo || '-',
        Calificación: r.calificacion || '-',
        Maestro: r.maestro_nombre || 'Sin asignar'
      }));
      setDetailRows(rows);
      setDetailOpen(true);
    } catch (e) {
      setError('No fue posible cargar el detalle del alumno');
    } finally {
      setDetailLoading(false);
    }
  };

  // Abrir detalle de Materia
  const openMateriaDetalle = async (materiaId, materiaNombre) => {
    try {
      setDetailLoading(true);
      setDetailTitle(`Detalle de materia: ${materiaNombre}`);
      const res = await axios.get(`/materias/${materiaId}/alumnos`);
      setDetailColumns(['Alumno', 'Grado', 'Email', 'Calificación', 'Maestro']);
      const rows = res.data.map(r => ({
        Alumno: r.alumno_nombre || '-',
        Grado: r.grado || '-',
        Email: r.alumno_email || '-',
        Calificación: r.calificacion || '-',
        Maestro: r.maestro_nombre || 'Sin asignar'
      }));
      setDetailRows(rows);
      setDetailOpen(true);
    } catch (e) {
      setError('No fue posible cargar el detalle de la materia');
    } finally {
      setDetailLoading(false);
    }
  };

  // Abrir detalle de Maestro (filtra relaciones ya cargadas)
  const openMaestroDetalle = (maestroId, maestroNombre) => {
    setDetailTitle(`Detalle de maestro: ${maestroNombre}`);
    setDetailColumns(['Materia', 'Código', 'Créditos']);
    const rows = maestrosCompleto
      .filter(r => r.maestro_id === maestroId)
      .map(r => ({
        Materia: r.materia_nombre || '-',
        Código: r.materia_codigo || '-',
        'Créditos': r.creditos || '-'
      }));
    setDetailRows(rows);
    setDetailOpen(true);
  };

  // Cargar según pestaña activa y también una carga inicial
  useEffect(() => {
    const run = async () => {
      if (activeTab === 0) await fetchAlumnosCompleto();
      if (activeTab === 1) await fetchMaestrosCompleto();
      if (activeTab === 2) await fetchMateriasCompleto();
    };
    run();
  }, [activeTab]);

  // Refrescar automáticamente cuando se actualicen relaciones
  useEffect(() => {
    const refresh = () => {
      if (activeTab === 0) fetchAlumnosCompleto();
      if (activeTab === 1) fetchMaestrosCompleto();
      if (activeTab === 2) fetchMateriasCompleto();
    };
    window.addEventListener('relaciones-updated', refresh);
    return () => window.removeEventListener('relaciones-updated', refresh);
  }, [activeTab]);

  // Botón manual para refrescar (por si el usuario lo requiere)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderAlumnosCompleto = () => {
    if (loading) return <CircularProgress />;
    
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#192d63' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Alumno</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Materia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Créditos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Calificación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Maestro</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alumnosCompleto.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>{row.alumno_nombre}</TableCell>
                <TableCell>{row.grado}</TableCell>
                <TableCell>{row.materia_nombre || 'Sin materia'}</TableCell>
                <TableCell>{row.materia_codigo || '-'}</TableCell>
                <TableCell>{row.creditos || '-'}</TableCell>
                <TableCell>
                  {row.calificacion ? (
                    <Chip 
                      label={row.calificacion} 
                      color={row.calificacion >= 7 ? 'success' : 'error'}
                      size="small"
                    />
                  ) : (
                    'Sin calificación'
                  )}
                </TableCell>
                <TableCell>{row.maestro_nombre || 'Sin asignar'}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => openAlumnoDetalle(row.alumno_id, row.alumno_nombre)}>
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderMaestrosCompleto = () => {
    if (loading) return <CircularProgress />;
    
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#d4b012' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Maestro</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Materia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Créditos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maestrosCompleto.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>{row.maestro_nombre}</TableCell>
                <TableCell>{row.maestro_email}</TableCell>
                <TableCell>{row.materia_nombre || 'Sin materia'}</TableCell>
                <TableCell>{row.materia_codigo || '-'}</TableCell>
                <TableCell>{row.creditos || '-'}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => openMaestroDetalle(row.maestro_id, row.maestro_nombre)}>
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderMateriasCompleto = () => {
    if (loading) return <CircularProgress />;
    
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#735920' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Materia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Créditos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Maestro</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Alumnos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Promedio</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materiasCompleto.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>{row.materia_nombre}</TableCell>
                <TableCell>{row.materia_codigo}</TableCell>
                <TableCell>{row.creditos}</TableCell>
                <TableCell>{row.maestro_nombre || 'Sin asignar'}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.total_alumnos || 0} 
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {row.promedio_calificaciones ? (
                    <Chip 
                      label={parseFloat(row.promedio_calificaciones).toFixed(2)} 
                      color={row.promedio_calificaciones >= 7 ? 'success' : 'error'}
                      size="small"
                    />
                  ) : (
                    'Sin datos'
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => openMateriaDetalle(row.materia_id, row.materia_nombre)}>
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#192d63', fontWeight: 'bold', mb: 4 }}>
        Relaciones - Sistema Escolar UNACH
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { color: '#192d63' } }}>
          <Tab label="Alumnos con Materias" />
          <Tab label="Maestros con Materias" />
          <Tab label="Materias con Detalles" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderAlumnosCompleto()}
      {activeTab === 1 && renderMaestrosCompleto()}
      {activeTab === 2 && renderMateriasCompleto()}

      {/* Modal de detalle */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{detailTitle}</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {detailColumns.map((c) => (
                      <TableCell key={c} sx={{ fontWeight: 'bold' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailRows.map((r, idx) => (
                    <TableRow key={idx}>
                      {detailColumns.map((c) => (
                        <TableCell key={`${idx}-${c}`}>{r[c]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RelacionesTable;

