import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper
} from '@mui/material';
import {
  AccountBalance as UniversityIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from '../config/axios';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/login', credentials);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Configurar el token en axios para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        onLogin(response.data.user);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <UniversityIcon sx={{ color: '#192d63', fontSize: 48, mr: 2 }} />
            <Typography variant="h4" sx={{ color: '#192d63', fontWeight: 'bold' }}>
              UNACH
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: '#735920', mb: 1 }}>
            Sistema de Gestión Escolar
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Inicia sesión para acceder al sistema
          </Typography>
        </Box>

        <Card sx={{ bgcolor: '#f8f9fa' }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Usuario"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                margin="normal"
                required
                autoComplete="username"
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: '#192d63' }} />
                }}
              />
              
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                margin="normal"
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: '#192d63' }} />
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  bgcolor: '#192d63',
                  '&:hover': {
                    bgcolor: '#0f1a3f'
                  },
                  py: 1.5
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Credenciales por defecto:
          </Typography>
          <Typography variant="body2" sx={{ color: '#192d63', fontWeight: 'bold' }}>
            Usuario: admin | Contraseña: admin123
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
