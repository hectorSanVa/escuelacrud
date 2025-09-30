import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  PictureAsPdf as PDFIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import axios from '../config/axios';

const ReporteDatos = () => {
  const [open, setOpen] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [tipoReporte, setTipoReporte] = useState('maestros');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Datos para los reportes
  const [maestros, setMaestros] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [relacionesMaestroMateria, setRelacionesMaestroMateria] = useState([]);
  const [relacionesAlumnoMateria, setRelacionesAlumnoMateria] = useState([]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [maestrosRes, alumnosRes, materiasRes, relacionesMaestroRes, relacionesAlumnoRes] = await Promise.all([
        axios.get('/maestros'),
        axios.get('/alumnos'),
        axios.get('/materias'),
        axios.get('/maestros/materias'),
        axios.get('/alumnos/materias')
      ]);

      setMaestros(maestrosRes.data);
      setAlumnos(alumnosRes.data);
      setMaterias(materiasRes.data);
      setRelacionesMaestroMateria(relacionesMaestroRes.data);
      setRelacionesAlumnoMateria(relacionesAlumnoRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      showSnackbar('Error al cargar datos para el reporte', 'error');
    }
  }, [showSnackbar]);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open, cargarDatos]);

  const generarReporteMaestros = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE MAESTROS Y SUS MATERIAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Agrupar maestros con sus materias
    const maestrosConMaterias = maestros.map(maestro => {
      const materiasAsignadas = relacionesMaestroMateria
        .filter(rel => rel.maestro_id === maestro.id)
        .map(rel => rel.materia_nombre);
      
      return {
        ...maestro,
        materias: materiasAsignadas
      };
    });

    // Generar tabla
    maestrosConMaterias.forEach((maestro, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      // Nombre del maestro
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${maestro.nombre}`, 20, yPosition);
      yPosition += 8;

      // Email
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Email: ${maestro.email || 'No especificado'}`, 20, yPosition);
      yPosition += 6;

      // Materias
      if (maestro.materias.length > 0) {
        pdf.text('Materias asignadas:', 20, yPosition);
        yPosition += 5;
        maestro.materias.forEach(materia => {
          pdf.text(`• ${materia}`, 25, yPosition);
          yPosition += 5;
        });
      } else {
        pdf.text('Sin materias asignadas', 20, yPosition);
        yPosition += 5;
      }

      yPosition += 10;
    });

    // Estadísticas al final
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTADÍSTICAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de maestros: ${maestros.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de materias: ${materias.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de asignaciones: ${relacionesMaestroMateria.length}`, 20, yPosition);

    pdf.save(`Reporte_Maestros_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generarReporteAlumnos = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE ALUMNOS Y SUS MATERIAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Agrupar alumnos con sus materias
    const alumnosConMaterias = alumnos.map(alumno => {
      const materiasInscritas = relacionesAlumnoMateria
        .filter(rel => rel.alumno_id === alumno.id)
        .map(rel => ({
          materia: rel.materia_nombre,
          maestro: rel.maestro_nombre || 'Sin asignar',
          calificacion: rel.calificacion || 'Sin calificar'
        }));
      
      return {
        ...alumno,
        materias: materiasInscritas
      };
    });

    // Generar tabla
    alumnosConMaterias.forEach((alumno, index) => {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      // Nombre del alumno
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${alumno.nombre}`, 20, yPosition);
      yPosition += 8;

      // Información básica
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Grado: ${alumno.grado}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Email: ${alumno.email || 'No especificado'}`, 20, yPosition);
      yPosition += 8;

      // Materias
      if (alumno.materias.length > 0) {
        pdf.text('Materias inscritas:', 20, yPosition);
        yPosition += 5;
        alumno.materias.forEach(materia => {
          pdf.text(`• ${materia.materia} (Maestro: ${materia.maestro}, Calificación: ${materia.calificacion})`, 25, yPosition);
          yPosition += 5;
        });
      } else {
        pdf.text('Sin materias inscritas', 20, yPosition);
        yPosition += 5;
      }

      yPosition += 10;
    });

    // Estadísticas
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTADÍSTICAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de alumnos: ${alumnos.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de inscripciones: ${relacionesAlumnoMateria.length}`, 20, yPosition);
    yPosition += 6;
    
    // Calificaciones
    const calificaciones = relacionesAlumnoMateria
      .filter(rel => rel.calificacion && rel.calificacion > 0)
      .map(rel => rel.calificacion);
    
    if (calificaciones.length > 0) {
      const promedio = calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length;
      pdf.text(`Promedio general: ${promedio.toFixed(2)}`, 20, yPosition);
    }

    pdf.save(`Reporte_Alumnos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generarReporteMaterias = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE MATERIAS Y ESTADÍSTICAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Lista de materias
    materias.forEach((materia, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${materia.nombre}`, 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Código: ${materia.codigo || 'No especificado'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Créditos: ${materia.creditos || 'No especificado'}`, 20, yPosition);
      yPosition += 5;

      // Contar maestros asignados
      const maestrosAsignados = relacionesMaestroMateria
        .filter(rel => rel.materia_id === materia.id)
        .map(rel => rel.maestro_nombre);
      
      pdf.text(`Maestros asignados: ${maestrosAsignados.length}`, 20, yPosition);
      yPosition += 5;
      
      if (maestrosAsignados.length > 0) {
        pdf.text(`• ${maestrosAsignados.join(', ')}`, 25, yPosition);
        yPosition += 5;
      }

      // Contar alumnos inscritos
      const alumnosInscritos = relacionesAlumnoMateria
        .filter(rel => rel.materia_id === materia.id)
        .length;
      
      pdf.text(`Alumnos inscritos: ${alumnosInscritos}`, 20, yPosition);
      yPosition += 10;
    });

    // Estadísticas generales
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTADÍSTICAS GENERALES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de materias: ${materias.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de maestros: ${maestros.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de alumnos: ${alumnos.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de asignaciones maestro-materia: ${relacionesMaestroMateria.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de inscripciones alumno-materia: ${relacionesAlumnoMateria.length}`, 20, yPosition);

    pdf.save(`Reporte_Materias_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generarReporteCompleto = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Portada
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE COMPLETO DEL SISTEMA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.text('Sistema de Gestión Escolar UNACH', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Resumen ejecutivo
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN EJECUTIVO', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de maestros registrados: ${maestros.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de alumnos registrados: ${alumnos.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de materias disponibles: ${materias.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de asignaciones maestro-materia: ${relacionesMaestroMateria.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Total de inscripciones alumno-materia: ${relacionesAlumnoMateria.length}`, 20, yPosition);
    yPosition += 6;

    // Calificaciones promedio
    const calificaciones = relacionesAlumnoMateria
      .filter(rel => rel.calificacion && rel.calificacion > 0)
      .map(rel => rel.calificacion);
    
    if (calificaciones.length > 0) {
      const promedio = calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length;
      pdf.text(`Promedio general de calificaciones: ${promedio.toFixed(2)}`, 20, yPosition);
      yPosition += 6;
    }

    yPosition += 10;

    // SECCIÓN 1: MAESTROS
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. MAESTROS Y SUS MATERIAS', 20, yPosition);
    yPosition += 15;

    const maestrosConMaterias = maestros.map(maestro => {
      const materiasAsignadas = relacionesMaestroMateria
        .filter(rel => rel.maestro_id === maestro.id)
        .map(rel => rel.materia_nombre);
      
      return {
        ...maestro,
        materias: materiasAsignadas
      };
    });

    maestrosConMaterias.forEach((maestro, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${maestro.nombre}`, 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Email: ${maestro.email || 'No especificado'}`, 20, yPosition);
      yPosition += 6;

      if (maestro.materias.length > 0) {
        pdf.text('Materias asignadas:', 20, yPosition);
        yPosition += 5;
        maestro.materias.forEach(materia => {
          pdf.text(`• ${materia}`, 25, yPosition);
          yPosition += 5;
        });
      } else {
        pdf.text('Sin materias asignadas', 20, yPosition);
        yPosition += 5;
      }

      yPosition += 10;
    });

    // SECCIÓN 2: ALUMNOS
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. ALUMNOS Y SUS MATERIAS', 20, yPosition);
    yPosition += 15;

    const alumnosConMaterias = alumnos.map(alumno => {
      const materiasInscritas = relacionesAlumnoMateria
        .filter(rel => rel.alumno_id === alumno.id)
        .map(rel => ({
          materia: rel.materia_nombre,
          maestro: rel.maestro_nombre || 'Sin asignar',
          calificacion: rel.calificacion || 'Sin calificar'
        }));
      
      return {
        ...alumno,
        materias: materiasInscritas
      };
    });

    alumnosConMaterias.forEach((alumno, index) => {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${alumno.nombre}`, 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Grado: ${alumno.grado}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Email: ${alumno.email || 'No especificado'}`, 20, yPosition);
      yPosition += 8;

      if (alumno.materias.length > 0) {
        pdf.text('Materias inscritas:', 20, yPosition);
        yPosition += 5;
        alumno.materias.forEach(materia => {
          pdf.text(`• ${materia.materia} (Maestro: ${materia.maestro}, Calificación: ${materia.calificacion})`, 25, yPosition);
          yPosition += 5;
        });
      } else {
        pdf.text('Sin materias inscritas', 20, yPosition);
        yPosition += 5;
      }

      yPosition += 10;
    });

    // SECCIÓN 3: MATERIAS
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. MATERIAS Y ESTADÍSTICAS', 20, yPosition);
    yPosition += 15;

    materias.forEach((materia, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${materia.nombre}`, 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Código: ${materia.codigo || 'No especificado'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Créditos: ${materia.creditos || 'No especificado'}`, 20, yPosition);
      yPosition += 5;

      const maestrosAsignados = relacionesMaestroMateria
        .filter(rel => rel.materia_id === materia.id)
        .map(rel => rel.maestro_nombre);
      
      pdf.text(`Maestros asignados: ${maestrosAsignados.length}`, 20, yPosition);
      yPosition += 5;
      
      if (maestrosAsignados.length > 0) {
        pdf.text(`• ${maestrosAsignados.join(', ')}`, 25, yPosition);
        yPosition += 5;
      }

      const alumnosInscritos = relacionesAlumnoMateria
        .filter(rel => rel.materia_id === materia.id)
        .length;
      
      pdf.text(`Alumnos inscritos: ${alumnosInscritos}`, 20, yPosition);
      yPosition += 10;
    });

    // SECCIÓN 4: ESTADÍSTICAS FINALES
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4. ESTADÍSTICAS FINALES DEL SISTEMA', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resumen General:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Total de maestros: ${maestros.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`• Total de alumnos: ${alumnos.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`• Total de materias: ${materias.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`• Total de asignaciones maestro-materia: ${relacionesMaestroMateria.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`• Total de inscripciones alumno-materia: ${relacionesAlumnoMateria.length}`, 20, yPosition);
    yPosition += 10;

    // Distribución por grado
    const alumnosPorGrado = {};
    alumnos.forEach(alumno => {
      alumnosPorGrado[alumno.grado] = (alumnosPorGrado[alumno.grado] || 0) + 1;
    });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Distribución de Alumnos por Grado:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    Object.entries(alumnosPorGrado).forEach(([grado, cantidad]) => {
      pdf.text(`• Grado ${grado}: ${cantidad} alumnos`, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Materias más populares
    const materiasPopulares = materias.map(materia => {
      const alumnosInscritos = relacionesAlumnoMateria
        .filter(rel => rel.materia_id === materia.id)
        .length;
      return {
        nombre: materia.nombre,
        alumnos: alumnosInscritos
      };
    }).sort((a, b) => b.alumnos - a.alumnos);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Materias con más alumnos inscritos:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    materiasPopulares.slice(0, 5).forEach((materia, index) => {
      pdf.text(`${index + 1}. ${materia.nombre}: ${materia.alumnos} alumnos`, 20, yPosition);
      yPosition += 6;
    });

    pdf.save(`Reporte_Completo_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generarReporte = async () => {
    setGenerando(true);
    
    try {
      switch (tipoReporte) {
        case 'maestros':
          generarReporteMaestros();
          break;
        case 'alumnos':
          generarReporteAlumnos();
          break;
        case 'materias':
          generarReporteMaterias();
          break;
        case 'completo':
          generarReporteCompleto();
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      showSnackbar('Reporte generado exitosamente');
      setOpen(false);
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      showSnackbar('Error al generar el reporte', 'error');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<ReportIcon />}
        onClick={() => setOpen(true)}
        size="small"
        sx={{
          backgroundColor: '#d4b012',
          color: '#192d63',
          fontWeight: 'bold',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          px: { xs: 1, sm: 2 },
          '&:hover': {
            backgroundColor: '#b8940f'
          }
        }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
          Generar Reportes
        </Box>
        <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>
          Reportes
        </Box>
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PDFIcon sx={{ color: '#d4b012' }} />
            <Typography variant="h6" sx={{ color: '#192d63', fontWeight: 'bold' }}>
              Generar Reportes de Datos
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selecciona el tipo de reporte que deseas generar:
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              label="Tipo de Reporte"
            >
              <MenuItem value="maestros">Maestros y sus Materias</MenuItem>
              <MenuItem value="alumnos">Alumnos y sus Materias</MenuItem>
              <MenuItem value="materias">Materias y Estadísticas</MenuItem>
              <MenuItem value="completo">Reporte Completo (Todo)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Contenido del reporte:
            </Typography>
            {tipoReporte === 'maestros' && (
              <Box component="ul" sx={{ pl: 2, fontSize: '0.875rem' }}>
                <li>Lista completa de maestros</li>
                <li>Materias asignadas a cada maestro</li>
                <li>Información de contacto</li>
                <li>Estadísticas generales</li>
              </Box>
            )}
            {tipoReporte === 'alumnos' && (
              <Box component="ul" sx={{ pl: 2, fontSize: '0.875rem' }}>
                <li>Lista completa de alumnos</li>
                <li>Materias inscritas por cada alumno</li>
                <li>Maestros asignados y calificaciones</li>
                <li>Estadísticas de rendimiento</li>
              </Box>
            )}
            {tipoReporte === 'materias' && (
              <Box component="ul" sx={{ pl: 2, fontSize: '0.875rem' }}>
                <li>Lista completa de materias</li>
                <li>Maestros asignados a cada materia</li>
                <li>Número de alumnos inscritos</li>
                <li>Estadísticas generales del sistema</li>
              </Box>
            )}
            {tipoReporte === 'completo' && (
              <Box component="ul" sx={{ pl: 2, fontSize: '0.875rem' }}>
                <li>Reporte completo de maestros y sus materias</li>
                <li>Reporte completo de alumnos y sus materias</li>
                <li>Reporte completo de materias y estadísticas</li>
                <li>Estadísticas generales del sistema</li>
                <li>Resumen ejecutivo con todos los datos</li>
              </Box>
            )}
          </Box>
          
          {generando && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="body2">
                Generando reporte... Esto puede tomar unos momentos.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={generando}>
            Cancelar
          </Button>
          <Button
            onClick={generarReporte}
            variant="contained"
            disabled={generando}
            startIcon={generando ? <CircularProgress size={16} /> : <PDFIcon />}
            sx={{
              backgroundColor: '#192d63',
              '&:hover': { backgroundColor: '#0f1a42' }
            }}
          >
            {generando ? 'Generando...' : 'Generar PDF'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default ReporteDatos;
