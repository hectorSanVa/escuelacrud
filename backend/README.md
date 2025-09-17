# Backend - Escuela CRUD

API Express + PostgreSQL

## Variables de entorno

Copia `env.example` a `.env` y ajusta valores.

## Base de datos

1) Crear esquema y datos:
```bash
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f db/schema.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f db/seed.sql
```

2) Ejecutar servidor
```bash
npm install
node server.js
```

## Exportar tu BD actual

- Esquema:
```bash
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE --schema-only > db/schema.sql
```
- Datos:
```bash
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE --data-only --inserts > db/seed.sql
```
