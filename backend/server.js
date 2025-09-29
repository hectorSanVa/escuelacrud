const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configuración CORS para producción
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// JWT Secret (usar variable de entorno en producción)
const JWT_SECRET = process.env.JWT_SECRET || 'unach_secret_key_2024';

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'escueladb',
  password: process.env.PGPASSWORD || '210504',
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Probar conexión al iniciar
pool
  .connect()
  .then((client) => {
    return client
      .query('SELECT NOW() as now')
      .then((res) => {
        console.log('DB conectada. Hora:', res.rows[0].now);
        client.release();
      })
      .catch((err) => {
        client.release();
        console.error('Error verificando la conexión a DB:', err.message);
      });
  })
  .catch((err) => console.error('No se pudo conectar a DB:', err.message));

// Utilidad: manejo de errores
function handleError(res, error) {
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error en el servidor' });
}

// Migraciones simples: añadir columnas de foto si no existen
(async () => {
  try {
    await pool.query("ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS foto_url TEXT");
    await pool.query("ALTER TABLE maestros ADD COLUMN IF NOT EXISTS foto_url TEXT");
    await pool.query("ALTER TABLE alumno_materia ADD COLUMN IF NOT EXISTS maestro_id INTEGER REFERENCES maestros(id) ON DELETE SET NULL");
  } catch (e) {
    console.warn('No se pudieron aplicar migraciones:', e.message);
  }
})();

// ---------------------- Subida de imágenes (local) ----------------------
// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configurar Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}_${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Usa JPG o PNG.'));
    }
    cb(null, true);
  }
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadsDir));

// Endpoints de subida
app.post('/upload/alumnos', authenticateToken, upload.single('foto'), (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/upload/maestros', authenticateToken, upload.single('foto'), (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- RUTAS DE AUTENTICACIÓN ----------------------

// Crear tablas de relaciones si no existen
app.post('/setup-tables', authenticateToken, async (req, res) => {
  try {
    // Crear tabla maestro_materia
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maestro_materia (
        id SERIAL PRIMARY KEY,
        maestro_id INTEGER REFERENCES maestros(id) ON DELETE CASCADE,
        materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
        UNIQUE(maestro_id, materia_id)
      )
    `);
    
    // Crear tabla alumno_materia
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alumno_materia (
        id SERIAL PRIMARY KEY,
        alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
        materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
        maestro_id INTEGER REFERENCES maestros(id) ON DELETE SET NULL,
        calificacion DECIMAL(3,1),
        UNIQUE(alumno_id, materia_id, maestro_id)
      )
    `);
    
    res.json({ message: 'Tablas de relaciones creadas exitosamente' });
  } catch (error) {
    console.error('Error creando tablas:', error);
    res.status(500).json({ error: 'Error creando tablas de relaciones' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Usuario admin por defecto (en producción esto vendría de la base de datos)
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { username: 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({
        message: 'Login exitoso',
        token,
        user: { username: 'admin', role: 'admin' }
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Endpoint temporal para inicializar la base de datos
app.post('/init-db', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Leer el archivo schema.sql
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Ejecutar el schema
    await pool.query(schemaSQL);
    
    res.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente' 
    });
  } catch (error) {
    console.error('Error inicializando DB:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Verificar token
app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ---------------------- Rutas CRUD ALUMNOS ----------------------

// Obtener todos
app.get('/alumnos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alumnos ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Crear
app.post('/alumnos', authenticateToken, async (req, res) => {
  try {
    const { nombre, grado, maestro_id, email, foto_url } = req.body;
    const result = await pool.query(
      'INSERT INTO alumnos(nombre, grado, maestro_id, email, foto_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, grado, maestro_id, email, foto_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Actualizar
app.put('/alumnos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, grado, maestro_id, email, foto_url } = req.body;
    const result = await pool.query(
      'UPDATE alumnos SET nombre=$1, grado=$2, maestro_id=$3, email=$4, foto_url=$5 WHERE id=$6 RETURNING *',
      [nombre, grado, maestro_id, email, foto_url || null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Eliminar
app.delete('/alumnos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM alumnos WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json({ message: 'Alumno eliminado' });
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- Rutas CRUD MAESTROS ----------------------

// Obtener todos
app.get('/maestros', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maestros ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Crear
app.post('/maestros', authenticateToken, async (req, res) => {
  try {
    const { nombre, materia, email, foto_url } = req.body;
    const result = await pool.query(
      'INSERT INTO maestros(nombre, materia, email, foto_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, materia, email, foto_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Actualizar
app.put('/maestros/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, materia, email, foto_url } = req.body;
    const result = await pool.query(
      'UPDATE maestros SET nombre=$1, materia=$2, email=$3, foto_url=$4 WHERE id=$5 RETURNING *',
      [nombre, materia, email, foto_url || null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Maestro no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Eliminar
app.delete('/maestros/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM maestros WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Maestro no encontrado' });
    res.json({ message: 'Maestro eliminado' });
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- Rutas CRUD MATERIAS ----------------------

// Obtener todas las materias
app.get('/materias', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materias ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Crear materia
app.post('/materias', authenticateToken, async (req, res) => {
  try {
    const { nombre, codigo, creditos } = req.body;
    const result = await pool.query(
      'INSERT INTO materias(nombre, codigo, creditos) VALUES ($1, $2, $3) RETURNING *',
      [nombre, codigo, creditos]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Actualizar materia
app.put('/materias/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, creditos } = req.body;
    const result = await pool.query(
      'UPDATE materias SET nombre=$1, codigo=$2, creditos=$3 WHERE id=$4 RETURNING *',
      [nombre, codigo, creditos, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Materia no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Eliminar materia
app.delete('/materias/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM materias WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Materia no encontrada' });
    res.json({ message: 'Materia eliminada' });
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- RUTAS CON JOINS ----------------------

// Obtener alumnos con sus materias y calificaciones
app.get('/alumnos/materias', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (a.id, m.id, am.maestro_id)
        a.id as alumno_id,
        a.nombre as alumno_nombre,
        a.grado,
        a.email as alumno_email,
        a.foto_url as alumno_foto_url,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        m.creditos,
        am.calificacion,
        am.materia_id as materia_id,
        am.maestro_id as maestro_id,
        COALESCE(ma.nombre, 'Sin asignar') as maestro_nombre,
        ma.foto_url as maestro_foto_url
      FROM alumnos a
      INNER JOIN alumno_materia am ON a.id = am.alumno_id
      INNER JOIN materias m ON am.materia_id = m.id
      LEFT JOIN maestros ma ON am.maestro_id = ma.id
      ORDER BY a.id, m.id, am.maestro_id NULLS LAST
    `);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Obtener maestros con sus materias
app.get('/maestros/materias', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ma.id as maestro_id,
        ma.nombre as maestro_nombre,
        ma.email as maestro_email,
        ma.foto_url as maestro_foto_url,
        m.id as materia_id,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        m.creditos
      FROM maestros ma
      INNER JOIN maestro_materia mm ON ma.id = mm.maestro_id
      INNER JOIN materias m ON mm.materia_id = m.id
      ORDER BY ma.nombre, m.nombre
    `);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Materias con detalles (maestro asignado, total alumnos, promedio)
app.get('/materias/detalles', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id as materia_id,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        m.creditos,
        COALESCE(MAX(ma.nombre), 'Sin asignar') as maestro_nombre,
        MAX(ma.foto_url) as maestro_foto_url,
        COUNT(DISTINCT am.alumno_id) as total_alumnos,
        COALESCE(ROUND(AVG(NULLIF(am.calificacion, 0))::numeric, 2), 0) as promedio_calificaciones
      FROM materias m
      LEFT JOIN maestro_materia mm ON mm.materia_id = m.id
      LEFT JOIN maestros ma ON ma.id = mm.maestro_id
      LEFT JOIN alumno_materia am ON am.materia_id = m.id
      GROUP BY m.id, m.nombre, m.codigo, m.creditos
      ORDER BY m.nombre
    `);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Obtener estadísticas generales
app.get('/estadisticas', authenticateToken, async (req, res) => {
  try {
    const [alumnosCount, maestrosCount, materiasCount, calificacionesAvg] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM alumnos'),
      pool.query('SELECT COUNT(*) as total FROM maestros'),
      pool.query('SELECT COUNT(*) as total FROM materias'),
      pool.query('SELECT AVG(calificacion) as promedio FROM alumno_materia WHERE calificacion IS NOT NULL AND calificacion > 0')
    ]);

    res.json({
      totalAlumnos: parseInt(alumnosCount.rows[0].total),
      totalMaestros: parseInt(maestrosCount.rows[0].total),
      totalMaterias: parseInt(materiasCount.rows[0].total),
      promedioCalificaciones: parseFloat(calificacionesAvg.rows[0].promedio || 0).toFixed(2)
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- NUEVAS RUTAS CON JOINS MEJORADOS ----------------------

// Ruta de debug para verificar tablas
app.get('/debug/tablas', authenticateToken, async (req, res) => {
  try {
    const tablas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    res.json(tablas.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener alumnos con sus materias, calificaciones y maestros
app.get('/alumnos/completo', authenticateToken, async (req, res) => {
  try {
    // Consulta muy simple que solo trae alumnos
    const result = await pool.query(`
      SELECT 
        a.id as alumno_id,
        a.nombre as alumno_nombre,
        a.grado,
        a.email as alumno_email,
        'Sin materia' as materia_nombre,
        '-' as materia_codigo,
        0 as creditos,
        0 as calificacion,
        'Sin asignar' as maestro_nombre,
        '-' as maestro_email
      FROM alumnos a
      ORDER BY a.nombre
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en /alumnos/completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener maestros con sus materias y alumnos
app.get('/maestros/completo', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ma.id as maestro_id,
        ma.nombre as maestro_nombre,
        ma.email as maestro_email,
        'Sin materia' as materia_nombre,
        '-' as materia_codigo,
        0 as creditos,
        0 as total_alumnos,
        0 as promedio_calificaciones
      FROM maestros ma
      ORDER BY ma.nombre
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en /maestros/completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener materias con sus maestros y alumnos
app.get('/materias/completo', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id as materia_id,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        m.creditos,
        'Sin asignar' as maestro_nombre,
        '-' as maestro_email,
        0 as total_alumnos,
        0 as promedio_calificaciones
      FROM materias m
      ORDER BY m.nombre
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en /materias/completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener calificaciones por alumno
app.get('/alumnos/:id/calificaciones', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        a.nombre as alumno_nombre,
        a.grado,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        am.calificacion,
        am.maestro_id as maestro_id,
        COALESCE(ma.nombre, 'Sin asignar') as maestro_nombre,
        ma.foto_url as maestro_foto_url
      FROM alumnos a
      JOIN alumno_materia am ON a.id = am.alumno_id
      JOIN materias m ON am.materia_id = m.id
      LEFT JOIN maestros ma ON am.maestro_id = ma.id
      WHERE a.id = $1
      ORDER BY m.nombre
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Obtener alumnos por materia
app.get('/materias/:id/alumnos', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        m.nombre as materia_nombre,
        a.nombre as alumno_nombre,
        a.grado,
        a.email as alumno_email,
        a.foto_url as alumno_foto_url,
        am.calificacion,
        am.maestro_id as maestro_id,
        COALESCE(ma.nombre, 'Sin asignar') as maestro_nombre,
        ma.foto_url as maestro_foto_url
      FROM materias m
      JOIN alumno_materia am ON m.id = am.materia_id
      JOIN alumnos a ON am.alumno_id = a.id
      LEFT JOIN maestros ma ON am.maestro_id = ma.id
      WHERE m.id = $1
      ORDER BY a.nombre
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// Obtener maestros que enseñan una materia específica
app.get('/materias/:id/maestros', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        ma.id as maestro_id,
        ma.nombre as maestro_nombre,
        ma.email as maestro_email,
        ma.foto_url as maestro_foto_url
      FROM maestros ma
      INNER JOIN maestro_materia mm ON ma.id = mm.maestro_id
      WHERE mm.materia_id = $1
      ORDER BY ma.nombre
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- RUTAS PARA GESTIÓN DE RELACIONES ----------------------

// Asignar materia a maestro
app.post('/maestros/:id/materias', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { materia_id } = req.body;
    
    // Verificar que el maestro existe
    const maestroCheck = await pool.query('SELECT id FROM maestros WHERE id = $1', [id]);
    if (maestroCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Maestro no encontrado' });
    }
    
    // Verificar que la materia existe
    const materiaCheck = await pool.query('SELECT id FROM materias WHERE id = $1', [materia_id]);
    if (materiaCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Materia no encontrada' });
    }
    
    // Verificar que no existe ya la relación
    const existingRelation = await pool.query(
      'SELECT id FROM maestro_materia WHERE maestro_id = $1 AND materia_id = $2',
      [id, materia_id]
    );
    if (existingRelation.rowCount > 0) {
      return res.status(400).json({ message: 'El maestro ya está asignado a esta materia' });
    }
    
    // Crear la relación
    const result = await pool.query(
      'INSERT INTO maestro_materia(maestro_id, materia_id) VALUES ($1, $2) RETURNING *',
      [Number(id), Number(materia_id)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Mensajes claros de error
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El maestro ya está asignado a esta materia' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Maestro o materia no existen' });
    }
    handleError(res, error);
  }
});

// Eliminar asignación de materia a maestro
app.delete('/maestros/:id/materias/:materiaId', authenticateToken, async (req, res) => {
  try {
    const { id, materiaId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM maestro_materia WHERE maestro_id = $1 AND materia_id = $2',
      [Number(id), Number(materiaId)]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Relación no encontrada' });
    }
    
    res.json({ message: 'Relación eliminada exitosamente' });
  } catch (error) {
    handleError(res, error);
  }
});

// Inscribir alumno en materia
app.post('/alumnos/:id/materias', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { materia_id, maestro_id, calificacion } = req.body;
    
    // Verificar que el alumno existe
    const alumnoCheck = await pool.query('SELECT id FROM alumnos WHERE id = $1', [id]);
    if (alumnoCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    
    // Verificar que la materia existe
    const materiaCheck = await pool.query('SELECT id FROM materias WHERE id = $1', [materia_id]);
    if (materiaCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Materia no encontrada' });
    }
    
    // Si se especifica un maestro, verificar que existe y que enseña esa materia
    if (maestro_id) {
      const maestroCheck = await pool.query('SELECT id FROM maestros WHERE id = $1', [maestro_id]);
      if (maestroCheck.rowCount === 0) {
        return res.status(404).json({ message: 'Maestro no encontrado' });
      }
      
      const maestroMateriaCheck = await pool.query(
        'SELECT id FROM maestro_materia WHERE maestro_id = $1 AND materia_id = $2',
        [maestro_id, materia_id]
      );
      if (maestroMateriaCheck.rowCount === 0) {
        return res.status(400).json({ message: 'El maestro no enseña esta materia' });
      }
    }
    
    // Verificar que no existe ya la inscripción (única por alumno+materia+maestro)
    const existingInscription = await pool.query(
      'SELECT id FROM alumno_materia WHERE alumno_id = $1 AND materia_id = $2 AND (maestro_id = $3 OR (maestro_id IS NULL AND $3 IS NULL))',
      [id, materia_id, maestro_id || null]
    );
    if (existingInscription.rowCount > 0) {
      return res.status(400).json({ message: 'El alumno ya está inscrito en esta materia con este maestro' });
    }
    
    // Crear la inscripción
    const result = await pool.query(
      'INSERT INTO alumno_materia(alumno_id, materia_id, maestro_id, calificacion) VALUES ($1, $2, $3, $4) RETURNING *',
      [Number(id), Number(materia_id), maestro_id ? Number(maestro_id) : null, calificacion || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El alumno ya está inscrito en esta materia con este maestro' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Alumno, materia o maestro no existen' });
    }
    handleError(res, error);
  }
});

// Actualizar calificación de alumno en materia
app.put('/alumnos/:id/materias/:materiaId', authenticateToken, async (req, res) => {
  try {
    const { id, materiaId } = req.params;
    const { calificacion } = req.body;
    
    // Validar calificación
    if (calificacion !== null && (calificacion < 0 || calificacion > 10)) {
      return res.status(400).json({ message: 'La calificación debe estar entre 0 y 10' });
    }
    
    const result = await pool.query(
      'UPDATE alumno_materia SET calificacion = $1 WHERE alumno_id = $2 AND materia_id = $3 RETURNING *',
      [calificacion, Number(id), Number(materiaId)]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// Eliminar inscripción de alumno en materia
app.delete('/alumnos/:id/materias/:materiaId', authenticateToken, async (req, res) => {
  try {
    const { id, materiaId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM alumno_materia WHERE alumno_id = $1 AND materia_id = $2',
      [Number(id), Number(materiaId)]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }
    
    res.json({ message: 'Inscripción eliminada exitosamente' });
  } catch (error) {
    handleError(res, error);
  }
});

// ---------------------- Inicio del servidor ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));


