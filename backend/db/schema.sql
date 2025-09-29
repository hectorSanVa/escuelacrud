-- Esquema de base de datos para la app Escuela CRUD
-- Compatible con PostgreSQL 12+

CREATE TABLE IF NOT EXISTS maestros (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(150),
  telefono VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS alumnos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(150),
  telefono VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS materias (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo VARCHAR(50) UNIQUE,
  creditos INTEGER
);

-- Relación muchos-a-muchos: maestro imparte materia
CREATE TABLE IF NOT EXISTS maestro_materia (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  maestro_id INTEGER NOT NULL REFERENCES maestros(id) ON DELETE CASCADE,
  materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  UNIQUE (maestro_id, materia_id)
);

-- Relación muchos-a-muchos: alumno inscrito en materia
CREATE TABLE IF NOT EXISTS alumno_materia (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  calificacion NUMERIC(4,2),
  UNIQUE (alumno_id, materia_id)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_maestro_materia_maestro ON maestro_materia(maestro_id);
CREATE INDEX IF NOT EXISTS idx_maestro_materia_materia ON maestro_materia(materia_id);
CREATE INDEX IF NOT EXISTS idx_alumno_materia_alumno ON alumno_materia(alumno_id);
CREATE INDEX IF NOT EXISTS idx_alumno_materia_materia ON alumno_materia(materia_id);






