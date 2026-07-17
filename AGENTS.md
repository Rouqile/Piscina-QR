# AGENTS.md — PiscinaQR

## Proyecto

Sistema de asistencias QR para control de ingreso a piscina. Cada miembro registrado obtiene un código QR vinculado a su DNI. El recepcionista escanea el QR desde su celular, valida horario, controla aforo y marca la asistencia.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11+, FastAPI 0.115+, SQLAlchemy 2.0+, PostgreSQL 18 |
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS 3.4 |
| Estado | Zustand 4.5 |
| HTTP | Axios 1.6 |
| QR | qrcode (Python backend) |
| Escáner | html5-qrcode (frontend) |
| Gráficas | Recharts 2.12 |

## Estructura del proyecto

```
piscinaQR/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Rutas de la API
│   │   ├── core/               # Config, seguridad, dependencias
│   │   ├── crud/               # Capa de acceso a datos
│   │   ├── models/             # Modelos SQLAlchemy
│   │   ├── schemas/            # Schemas Pydantic
│   │   └── services/           # QR, aforo, asistencias
│   ├── alembic/                # Migraciones de BD
│   └── seed_data.py            # Poblado inicial
├── frontend/
│   └── src/
│       ├── app/                # App Router de Next.js
│       │   ├── (auth)/login/   # Login
│       │   └── (dashboard)/    # Páginas protegidas
│       ├── components/         # UI, layout, features
│       ├── stores/             # Zustand
│       ├── services/           # Axios instance
│       └── types/              # TypeScript types
└── docker-compose.yml
```

## Comandos

### Backend
- `cd backend && pip install -r requirements.txt`
- `cd backend && uvicorn app.main:app --reload --port 8001`
- `cd backend && python seed_data.py` — Poblar BD inicial
- `http://localhost:8001/docs` — Swagger UI

### Frontend
- `cd frontend && npm install`
- `cd frontend && npm run dev` — Dev en puerto 3001
- `cd frontend && npm run build`

### Docker (producción)
- `docker compose up --build` — Levanta db (5433), backend (8001), frontend (3001)

## Endpoints de la API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | No | Login |
| POST | `/api/v1/auth/refresh` | No | Renovar token |
| GET | `/api/v1/auth/me` | Sí | Usuario actual |
| GET | `/api/v1/members/` | Sí | Listar miembros |
| POST | `/api/v1/members/` | Admin | Crear miembro |
| GET/PUT/DELETE | `/api/v1/members/{id}` | Admin | CRUD miembro |
| GET | `/api/v1/members/{dni}/qr` | Sí | Generar QR (PNG) |
| GET | `/api/v1/academies/` | Sí | Listar academias |
| POST/PUT/DELETE | `/api/v1/academies/{id}` | Admin | CRUD academia |
| GET | `/api/v1/age-ranges/` | Sí | Listar categorias |
| POST/PUT/DELETE | `/api/v1/age-ranges/{id}` | Admin | CRUD categoria |
| GET | `/api/v1/memberships/` | Sí | Listar membresías |
| POST | `/api/v1/memberships/` | Admin | Crear membresía |
| GET | `/api/v1/schedule-slots/` | Sí | Listar horarios |
| POST | `/api/v1/schedule-slots/` | Admin | Crear horario |
| POST | `/api/v1/schedule-slots/batch` | Admin | Crear varios horarios |
| GET | `/api/v1/checkin/{dni}` | Sí | Info para check-in |
| POST | `/api/v1/checkin/{dni}` | Sí | Registrar entrada |
| GET | `/api/v1/attendances/` | Sí | Historial asistencias |
| GET | `/api/v1/attendances/today` | Sí | Asistencias de hoy |
| PUT | `/api/v1/attendances/{id}` | Sí | Editar observación |
| GET | `/api/v1/dashboard/stats` | Sí | Estadísticas + ubicaciones en vivo |
| GET | `/api/v1/dashboard/cronograma-semanal` | Sí | Cronograma semanal por edades |
| POST | `/api/v1/dashboard/liberar/{id}` | Sí | Liberar ubicación |
| GET | `/api/v1/pool-config/` | Sí | Config aforo |
| PUT | `/api/v1/pool-config/` | Admin | Actualizar aforo |
| GET | `/api/v1/shift-assignments/calendario` | Sí | Eventos del calendario |

## Roles y permisos

- **admin**: acceso total a todo
- **recepcionista**: puede ver miembros, escanear QR, marcar asistencias, ver historial y dashboard

## Modelo de datos

- **User**: usuarios del sistema (login)
- **Member**: bañistas/ingresantes registrados (con categoria_id opcional)
- **Academy**: academias con nombre y número de estudiantes
- **Categoria**: categorias con nombre, edad min/max y color
- **Membership**: membresías con fechas y estado de pago
- **ScheduleSlot**: horarios recurrentes (día de semana + hora incio/fin)
- **Attendance**: registro de entrada (fecha, hora, observación)
- **ShiftAssignment**: asignación de turnos (miembro o academia, con horario)
- **PoolConfig**: configuración (capacidad máxima, ubicaciones, datos institución)

## Puertos

| Servicio | Puerto |
|----------|--------|
| PostgreSQL | 5433 (host) / 5432 (contenedor) |
| Backend | 8001 |
| Frontend | 3001 |

## Credenciales por defecto (seed)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | admin |
| recepcion | recepcion123 | recepcionista |
