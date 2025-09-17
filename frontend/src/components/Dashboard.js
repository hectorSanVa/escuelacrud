import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Container
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from '../config/axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const [estadisticas, setEstadisticas] = useState({
    totalAlumnos: 0,
    totalMaestros: 0,
    totalMaterias: 0,
    promedioCalificaciones: 0
  });
  const [alumnosPorGrado, setAlumnosPorGrado] = useState([]);

  useEffect(() => {
    fetchEstadisticas();
    fetchAlumnosPorGrado();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const res = await axios.get('/estadisticas');
      setEstadisticas({
        totalAlumnos: Number(res.data.totalAlumnos || 0),
        totalMaestros: Number(res.data.totalMaestros || 0),
        totalMaterias: Number(res.data.totalMaterias || 0),
        promedioCalificaciones: Number(res.data.promedioCalificaciones || 0).toFixed ? Number(res.data.promedioCalificaciones || 0).toFixed(2) : res.data.promedioCalificaciones
      });
    } catch (error) {
      if (error.response?.status === 401) {
        // Redirigir al login si no está autenticado
        window.location.reload();
      }
      console.error('Error fetching estadísticas:', error);
    }
  };

  const fetchAlumnosPorGrado = async () => {
    try {
      const res = await axios.get('/alumnos');
      const grados = {};
      res.data.forEach(alumno => {
        grados[alumno.grado] = (grados[alumno.grado] || 0) + 1;
      });
      setAlumnosPorGrado(Object.entries(grados).map(([grado, count]) => ({
        grado: `Grado ${grado}`,
        count
      })));
    } catch (error) {
      if (error.response?.status === 401) {
        // Redirigir al login si no está autenticado
        window.location.reload();
      }
      console.error('Error fetching alumnos por grado:', error);
    }
  };

  const barData = {
    labels: alumnosPorGrado.map(item => item.grado),
    datasets: [
      {
        label: 'Alumnos por Grado',
        data: alumnosPorGrado.map(item => item.count),
        backgroundColor: [
          'rgba(25, 45, 99, 0.8)',
          'rgba(212, 176, 18, 0.8)',
          'rgba(115, 89, 32, 0.8)',
          'rgba(45, 74, 138, 0.8)'
        ],
        borderColor: [
          'rgba(25, 45, 99, 1)',
          'rgba(212, 176, 18, 1)',
          'rgba(115, 89, 32, 1)',
          'rgba(45, 74, 138, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const doughnutData = {
    labels: ['Alumnos', 'Maestros', 'Materias'],
    datasets: [
      {
        data: [estadisticas.totalAlumnos, estadisticas.totalMaestros, estadisticas.totalMaterias],
        backgroundColor: [
          'rgba(25, 45, 99, 0.8)',
          'rgba(212, 176, 18, 0.8)',
          'rgba(115, 89, 32, 0.8)'
        ],
        borderColor: [
          'rgba(25, 45, 99, 1)',
          'rgba(212, 176, 18, 1)',
          'rgba(115, 89, 32, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Distribución de Alumnos por Grado'
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Distribución General'
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#192d63', fontWeight: 'bold', mb: 4 }}>
        Dashboard - Sistema Escolar UNACH
      </Typography>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#192d63', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {estadisticas.totalAlumnos}
              </Typography>
              <Typography variant="body2">
                Total de Alumnos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#d4b012', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {estadisticas.totalMaestros}
              </Typography>
              <Typography variant="body2">
                Total de Maestros
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#735920', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {estadisticas.totalMaterias}
              </Typography>
              <Typography variant="body2">
                Total de Materias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#2d4a8a', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {estadisticas.promedioCalificaciones}
              </Typography>
              <Typography variant="body2">
                Promedio Calificaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Bar data={barData} options={options} />
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
