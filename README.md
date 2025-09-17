# Escuela CRUD (React + Express + PostgreSQL)

Este repositorio contiene:
- `backend/`: API Express con PostgreSQL y autenticación JWT
- `frontend/`: React + MUI (Material UI)

## Requisitos
- Node.js 18+
- PostgreSQL 12+

## Variables de entorno (backend)
1) Copia `backend/env.example` a `backend/.env` y ajusta valores:
   - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
   - `JWT_SECRET`

## Base de datos
- Esquema: `backend/db/schema.sql`
- Datos (seed): `backend/db/seed.sql`

Restaurar localmente:
```bash
psql -h localhost -U postgres -d escueladb -f backend/db/schema.sql
psql -h localhost -U postgres -d escueladb -f backend/db/seed.sql
```

Exportar tu BD actual (opcional):
```bash
# PowerShell (Windows)
$env:PGPASSWORD="<password>"
pg_dump -h localhost -U <usuario> -d <basedatos> --schema-only > backend/db/schema.sql
pg_dump -h localhost -U <usuario> -d <basedatos> --data-only --inserts > backend/db/seed.sql
```

## Ejecutar backend
```bash
cd backend
npm install
node server.js
# Servidor en http://localhost:5000
```

## Ejecutar frontend
```bash
cd frontend
npm install
npm start
# App en http://localhost:3000
```

## Notas
- No subas `.env` al repo. Usa `backend/env.example` como plantilla.
- Para producción, mueve secretos a variables de entorno seguras.
