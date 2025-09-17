import React from 'react';
import { Box, TextField, Button } from '@mui/material';

function FormAlumno({ nuevoAlumno, setNuevoAlumno, onAdd }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      <TextField
        label="Nombre"
        value={nuevoAlumno.nombre}
        onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, nombre: e.target.value })}
      />
      <TextField
        label="Grado"
        type="number"
        value={nuevoAlumno.grado}
        onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, grado: Number(e.target.value) })}
      />
      <TextField
        label="ID Maestro"
        type="number"
        value={nuevoAlumno.maestro_id}
        onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, maestro_id: Number(e.target.value) })}
      />
      <TextField
        label="Email"
        value={nuevoAlumno.email}
        onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, email: e.target.value })}
      />
      <Button variant="contained" onClick={onAdd}>Agregar Alumno</Button>
    </Box>
  );
}

export default FormAlumno;



