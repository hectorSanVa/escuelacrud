import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';

function AlumnosTable({ alumnos, onDelete }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>Nombre</TableCell>
          <TableCell>Grado</TableCell>
          <TableCell>ID Maestro</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {alumnos.map((a) => (
          <TableRow key={a.id}>
            <TableCell>{a.id}</TableCell>
            <TableCell>{a.nombre}</TableCell>
            <TableCell>{a.grado}</TableCell>
            <TableCell>{a.maestro_id}</TableCell>
            <TableCell>{a.email}</TableCell>
            <TableCell>
              <Button variant="outlined" color="error" onClick={() => onDelete(a.id)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default AlumnosTable;



