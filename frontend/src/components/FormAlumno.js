import React, { useRef, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import axios from '../config/axios';

function FormAlumno({ nuevoAlumno, setNuevoAlumno, onAdd }) {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef(null);

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('foto', file);
    setSubiendo(true);
    try {
      const { data } = await axios.post('/upload/alumnos', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNuevoAlumno({ ...nuevoAlumno, foto_url: data.url });
    } catch (err) {
      // noop UI; el backend valida tipo/tamaño
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

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
        label="Email"
        value={nuevoAlumno.email}
        onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, email: e.target.value })}
      />
      <Button component="label" variant="outlined" disabled={subiendo}>
        {subiendo ? 'Subiendo...' : (nuevoAlumno.foto_url ? 'Cambiar foto' : 'Subir foto')}
        <input ref={inputRef} type="file" hidden accept="image/png,image/jpeg" onChange={handleUploadFoto} />
      </Button>
      {nuevoAlumno.foto_url && (
        <img src={`${axios.defaults.baseURL}${nuevoAlumno.foto_url}`} alt="Foto alumno" style={{ height: 48, borderRadius: 4 }} />
      )}
      <Button variant="contained" onClick={onAdd}>Agregar Alumno</Button>
    </Box>
  );
}

export default FormAlumno;



