# Matriz Tecnológica — PiscinaQR

> Documento de referencia para que una IA pueda reconstruir un sistema similar con otro dominio de negocio.
> Proyecto original: Sistema de asistencias QR para control de ingreso a piscina.
> Proyecto destino: Sistema de registro para feria de emprendimiento escolar.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Backend | Python | 3.11+ | Lenguaje principal del servidor |
| Framework web | FastAPI | 0.136+ | API REST con tipado y OpenAPI automático |
| ORM | SQLAlchemy | 2.0+ | Mapeo objeto-relacional |
| Driver BD | psycopg (binary) | 3.3+ | Conexión a PostgreSQL |
| Migraciones | Alembic | 1.18+ | Control de versiones de esquema BD |
| Auth tokens | python-jose | 3.5+ | JWT (access + refresh tokens) |
| Hashing | bcrypt / passlib | — | Hash de contraseñas |
| Validación | Pydantic | 2.13+ | Schemas de datos y validación |
| Config | pydantic-settings | — | Variables de entorno tipadas |
| QR | qrcode (PIL) | 8.2 | Generación de códigos QR en backend |
| Imágenes | Pillow | 12+ | Manipulación de imágenes |
| Excel | openpyxl | 3.1+ | Exportar reportes a Excel |
| PDF | reportlab | 4.5+ | Exportar reportes a PDF |
| Frontend | Node.js | 20+ | Entorno de desarrollo |
| Framework UI | Next.js | 14.2 | App Router, SSR/SPA |
| UI Library | React | 18.3 | Componentes de interfaz |
| Lenguaje | TypeScript | 5+ / 6+ | Tipado estático |
| Estilos | Tailwind CSS | 3.4 | CSS utility-first |
| Estado global | Zustand | 5+ | Store de autenticación |
| HTTP client | Axios | 1.6 | Peticiones a la API |
| QR scanner | html5-qrcode | 2.3 | Lector de QR desde cámara |
| Gráficas | Recharts | 3.8 | Dashboard charts |
| Notificaciones | sonner | 2.0 | Toast notifications |
| Fechas | date-fns | 4.3 | Manejo de fechas |
| Contenedores | Docker | — | Entorno unificado |
| Base de datos | PostgreSQL | 16 | Base de datos relacional |
| Proxy reverso | cloudflared | — | Túnel Cloudflare para HTTPS |

---

## 2. Estructura de Directorios (Backend)

```
backend/
├── Dockerfile
├── alembic.ini
├── requirements.txt
├── seed_data.py                    # Datos iniciales de prueba
└── app/
    ├── __init__.py
    ├── main.py                     # FastAPI app, CORS, routers
    ├── api/
    │   ├── __init__.py
    │   └── v1/
    │       ├── __init__.py
    │       ├── router.py           # Agrega todos los routers con prefix /api/v1
    │       └── endpoints/          # Un archivo por recurso
    │           ├── __init__.py
    │           ├── auth.py         # POST /login, /refresh, GET /me
    │           ├── members.py      # CRUD miembros
    │           ├── memberships.py  # CRUD membresías
    │           ├── schedule_slots.py # CRUD horarios de membresía
    │           ├── horarios.py     # CRUD horarios genéricos (turnos)
    │           ├── shift_assignments.py # Asignación de turnos
    │           ├── attendances.py  # Historial de asistencias
    │           ├── checkin.py      # GET info + POST registrar entrada
    │           ├── dashboard.py    # GET /stats
    │           ├── pool_config.py  # GET/PUT config piscina
    │           ├── reports.py      # Reportes + export Excel/PDF
    │           └── users.py        # CRUD usuarios (solo admin)
    ├── core/
    │   ├── __init__.py
    │   ├── config.py               # Settings class con pydantic-settings
    │   ├── dependencies.py         # get_current_user, require_admin
    │   └── security.py             # hash/verify password, JWT create/decode
    ├── crud/
    │   ├── __init__.py
    │   ├── base.py                 # CRUDBase genérico (get, get_all, create, update, remove)
    │   ├── crud_user.py
    │   ├── crud_member.py
    │   ├── crud_membership.py
    │   ├── crud_schedule_slot.py
    │   ├── crud_horario.py
    │   ├── crud_shift_assignment.py
    │   ├── crud_attendance.py
    │   └── crud_pool_config.py
    ├── db/
    │   ├── __init__.py
    │   ├── base.py                 # DeclarativeBase
    │   └── session.py              # engine, SessionLocal, get_db
    ├── models/
    │   ├── __init__.py
    │   ├── user.py                 # User (id, username, email, hashed_password, nombre, rol, is_active)
    │   ├── member.py               # Member (id, dni, nombre, apellidos, email, teléfono, fec_nac, obs, is_active)
    │   ├── membership.py           # Membership (id, member_id, tipo, fec_inicio, fec_fin, monto, estado_pago)
    │   ├── schedule_slot.py        # ScheduleSlot (id, membership_id, dia_semana, hora_inicio, hora_fin)
    │   ├── horario.py              # Horario (id, nombre, hora_inicio, hora_fin)
    │   ├── shift_assignment.py     # ShiftAssignment (id, member_id, horario_id, hora_inicio/fin, dia_semana, fec_inicio/fin)
    │   ├── attendance.py           # Attendance (id, member_id, fecha, hora_entrada, ubicacion, observacion, liberado, registrado_por)
    │   └── pool_config.py          # PoolConfig (id, capacidad_maxima, ubicaciones, datos institución)
    ├── schemas/
    │   ├── __init__.py
    │   ├── auth.py
    │   ├── user.py
    │   ├── member.py
    │   ├── membership.py
    │   ├── schedule_slot.py
    │   ├── horario.py
    │   ├── shift_assignment.py
    │   ├── attendance.py
    │   ├── checkin.py
    │   ├── dashboard.py
    │   ├── pool_config.py
    │   └── report.py
    └── services/
        ├── __init__.py
        ├── qr_service.py           # generate_qr(dni, codigo_unico) -> PNG
        ├── capacity_service.py     # get_current_count, check_capacity
        ├── attendance_service.py   # get_checkin_info, register_entry
        └── report_service.py       # Reportes + export Excel/PDF
```

### 2.1 Convenciones del Backend

- **Modelos**: SQLAlchemy `Base` (DeclarativeBase), UUID como PK, `created_at`/`updated_at` con timezone
- **Schemas**: Pydantic v2 (`model_dump()` en lugar de `dict()`)
- **CRUD**: Clase genérica `CRUDBase[ModelType, CreateSchema, UpdateSchema]` con singleton por recurso
- **Endpoints**: FastAPIRouter con prefix, dependencias `Depends(get_db)` y `Depends(get_current_user)`
- **Roles**: `admin` (todo) y `recepcionista` (lectura + checkin)
- **Auth**: JWT Bearer token, acceso 30 min, refresh 7 días, contraseñas con bcrypt
- **Servicios**: Lógica de negocio separada de endpoints

---

## 3. Estructura de Directorios (Frontend)

```
frontend/
├── .dockerignore
├── .env.local                     # Variables de entorno
├── Dockerfile
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.mjs
├── tsconfig.json
└── src/
    ├── globals.d.ts
    ├── app/
    │   ├── globals.css             # Tailwind directives
    │   ├── layout.tsx              # Root layout con sonner Toaster
    │   ├── page.tsx                # Redirige a /login
    │   ├── api/
    │   │   └── v1/
    │   │       └── [[...route]]/
    │   │           └── route.ts    # Proxy a backend (http://backend:8001)
    │   ├── (auth)/
    │   │   ├── layout.tsx          # Layout centrado con gradiente
    │   │   └── login/
    │   │       └── page.tsx        # Formulario login
    │   └── (dashboard)/
    │       ├── layout.tsx          # ProtectedLayout wrapper
    │       ├── dashboard/
    │       │   └── page.tsx        # Stats, aforo, grid ubicaciones drag & drop
    │       ├── miembros/
    │       │   └── page.tsx        # CRUD miembros con QR
    │       ├── checkin/
    │       │   └── page.tsx        # Scanner QR + registro entrada
    │       ├── asistencias/
    │       │   └── page.tsx        # Tabla asistencias hoy
    │       ├── config/
    │       │   └── page.tsx        # Config aforo + institución + ubicaciones
    │       ├── turnos/
    │       │   ├── page.tsx        # Redirige a /turnos/asignacion
    │       │   ├── asignacion/
    │       │   │   └── page.tsx    # Asignación masiva de turnos
    │       │   └── vista-general/
    │       │       └── page.tsx    # Calendario de turnos
    │       ├── reportes/
    │       │   └── page.tsx        # Reportes + export Excel/PDF
    │       └── usuarios/
    │           └── page.tsx        # CRUD usuarios (admin)
    ├── components/
    │   ├── layout/
    │   │   ├── ProtectedLayout.tsx  # Auth guard + Sidebar + Topbar
    │   │   ├── Sidebar.tsx         # Menú basado en rol
    │   │   └── Topbar.tsx          # Nombre usuario + logout
    │   └── ui/
    │       ├── Modal.tsx           # Modal reutilizable
    │       ├── Badge.tsx           # Badge de estado (success/warning/danger/info)
    │       └── Icons.tsx           # Iconos SVG (Edit, Delete, Download, Plus, Qr)
    ├── services/
    │   └── api.ts                  # Axios instance con interceptors
    ├── stores/
    │   └── authStore.ts            # Zustand store (token, user, hydrate, logout)
    └── types/
        └── index.ts                # Interfaces TypeScript
```

### 3.1 Convenciones del Frontend

- **App Router**: Next.js 14 con carpetas `(auth)` y `(dashboard)` como route groups
- **Auth**: Zustand store persistido en sessionStorage, hydratado en layout
- **API proxy**: `src/app/api/v1/[[...route]]/route.ts` redirige todas las llamadas al backend
- **Axios interceptors**: Adjunta Bearer token, redirige a /login en 401
- **Layout protegido**: `ProtectedLayout.tsx` verifica token antes de renderizar
- **Sidebar dinámico**: Muestra menú según `rol` del usuario
- **Componentes UI**: Modales, Badges e Iconos reutilizables

---

## 4. Docker / Infraestructura

```yaml
# docker-compose.yml
services:
  db:        # PostgreSQL 16, puerto 5433, volumen pgdata
  backend:   # Python 3.11, puerto 8001, depende de db (healthcheck)
  frontend:  # Node 20, puerto 3001, depende de backend
  cloudflared: # Túnel Cloudflare (opcional)
```

- **Entrypoint backend**: `alembic upgrade head && python seed_data.py && uvicorn`
- **Puertos locales**: BD 5433, Backend 8001, Frontend 3001
- **Variables de entorno**: `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`

---

## 5. Flujo de Autenticación

1. Login → POST `/api/v1/auth/login` → recibe `access_token` (30 min) + `refresh_token` (7 días)
2. Frontend guarda en sessionStorage via Zustand
3. Cada request: Axios interceptor adjunta `Authorization: Bearer <token>`
4. Refresh: POST `/api/v1/auth/refresh` con `refresh_token`
5. Logout: Zustand limpia sessionStorage, redirige a /login
6. Backend: dependencia `get_current_user` decodifica token y obtiene usuario de BD

---

## 6. Flujo de Check-in (QR)

1. Frontend abre cámara con `html5-qrcode` o ingresa DNI manual
2. GET `/api/v1/checkin/{dni}` → devuelve info del miembro + horario + aforo
3. Si `ya_entro` = true o `puede_entrar` = false, se bloquea
4. POST `/api/v1/checkin/{dni}` con `{ ubicacion: "..." }` → registra Attendance
5. Backend verifica: miembro activo, no entró hoy, aforo disponible
6. QR se genera desde backend con `GET /api/v1/members/{dni}/qr` → PNG

---

## 7. Modelo de Datos (ER conceptual)

```
User (1) ──── registra ────> Attendance (N)
Member (1) ──── tiene ────> Membership (N)
Membership (1) ──── tiene ────> ScheduleSlot (N)
Member (1) ──── tiene ────> ShiftAssignment (N)
Horario (1) ──── referenciado ────> ShiftAssignment (N)
PoolConfig (1) ──── singleton ────> configuración global
```

### Convenciones BD

- **PK**: UUID v4 generado con `uuid.uuid4()`
- **Timestamps**: `DateTime(timezone=True)` con `server_default=func.now()`
- **Enums**: `Enum` de SQLAlchemy para roles y estados
- **Indexes**: DNI en members, member_id en tablas relacionadas
- **Cascadas**: `delete-orphan` en relaciones hijo

---

## 8. Patrón de Capas (Backend)

```
Endpoint (ruta HTTP)
    │
    ▼
Schema Pydantic (validación I/O)
    │
    ▼
Service (lógica de negocio)
    │
    ▼
CRUD (acceso a datos genérico)
    │
    ▼
Model SQLAlchemy (mapeo BD)
    │
    ▼
PostgreSQL
```

---

## 9. Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **admin** | CRUD todos los recursos, configuración, usuarios |
| **recepcionista** | Ver miembros, escanear QR, marcar asistencias, ver historial y dashboard |

---

## 10. Reportes

- **Resumen asistencias**: GET `/api/v1/reports/attendance`
- **Detalle asistencias**: GET `/api/v1/reports/attendance-detail`
- **Listado miembros**: GET `/api/v1/reports/members`
- **Export Excel**: 3 endpoints (`export-excel`, `export-detalle-excel`, `export-miembros-excel`)
- **Export PDF**: 3 endpoints (`export-pdf`, `export-detalle-pdf`, `export-miembros-pdf`)
- Librerías: `openpyxl` para Excel, `reportlab` para PDF
- Headers de institución obtenidos de `PoolConfig`

---

## 11. Checklist para Reconstruir un Sistema Similar

### Backend
- [ ] `app/main.py` — FastAPI app + CORS + router
- [ ] `app/core/config.py` — Settings con pydantic-settings
- [ ] `app/core/security.py` — JWT + bcrypt
- [ ] `app/core/dependencies.py` — get_current_user, require_admin
- [ ] `app/db/base.py` — DeclarativeBase
- [ ] `app/db/session.py` — engine + SessionLocal + get_db
- [ ] `app/crud/base.py` — CRUDBase genérico
- [ ] `app/models/*.py` — Modelos SQLAlchemy
- [ ] `app/schemas/*.py` — Schemas Pydantic
- [ ] `app/crud/*.py` — CRUD específicos con singleton
- [ ] `app/services/*.py` — Lógica de negocio
- [ ] `app/api/v1/router.py` — Router principal
- [ ] `app/api/v1/endpoints/*.py` — Endpoints REST
- [ ] `requirements.txt` — Dependencias
- [ ] `Dockerfile` — Python 3.11-slim
- [ ] `alembic.ini` + `alembic/` — Migraciones
- [ ] `seed_data.py` — Datos de prueba

### Frontend
- [ ] `src/app/layout.tsx` — Root layout
- [ ] `src/app/globals.css` — Tailwind
- [ ] `src/app/page.tsx` — Redirección
- [ ] `src/app/(auth)/layout.tsx` — Layout login
- [ ] `src/app/(auth)/login/page.tsx` — Login form
- [ ] `src/app/(dashboard)/layout.tsx` — Protected layout
- [ ] `src/app/(dashboard)/*/page.tsx` — Páginas del dashboard
- [ ] `src/app/api/v1/[[...route]]/route.ts` — Proxy API
- [ ] `src/components/layout/ProtectedLayout.tsx` — Auth guard
- [ ] `src/components/layout/Sidebar.tsx` — Menú por rol
- [ ] `src/components/layout/Topbar.tsx` — Topbar
- [ ] `src/components/ui/Modal.tsx` — Modal
- [ ] `src/components/ui/Badge.tsx` — Badge
- [ ] `src/components/ui/Icons.tsx` — Iconos SVG
- [ ] `src/services/api.ts` — Axios instance
- [ ] `src/stores/authStore.ts` — Zustand store
- [ ] `src/types/index.ts` — Interfaces TS
- [ ] `tailwind.config.mjs`, `tsconfig.json`, `next.config.js`, `postcss.config.js`
- [ ] `Dockerfile` — Node 20, multi-stage build
- [ ] `.env.local` — Variables de entorno

### Infraestructura
- [ ] `docker-compose.yml` — db + backend + frontend (+ cloudflared opcional)

### Instrucciones para la IA

1. Reemplazar nombres de dominio (piscina → feria escolar)
2. Adaptar modelos de datos al nuevo dominio manteniendo la misma estructura de capas
3. Mantener el patrón CRUD genérico y singleton
4. Conservar el sistema de autenticación JWT con roles
5. Adaptar el flujo QR al nuevo contexto (ej: QR del emprendimiento, no del miembro)
6. Mantener la estructura exacta de carpetas para que el clon sea reconocible

---

## 12. Puertos por Defecto

| Servicio | Puerto |
|----------|--------|
| PostgreSQL (host) | 5433 |
| Backend | 8001 |
| Frontend | 3001 |

---

## 13. Dependencias Clave (requirements.txt)

```
fastapi==0.136.3
uvicorn[standard]==0.48.0
sqlalchemy==2.0.50
psycopg[binary]==3.3.4
alembic==1.18.4
python-jose[cryptography]==3.5.0
bcrypt==4.1.3
pydantic==2.13.4
pydantic-settings==2.14.1
python-multipart==0.0.29
qrcode[pil]==8.2
Pillow==12.2.0
python-dotenv==1.2.2
passlib[bcrypt]==1.7.4
openpyxl==3.1.5
reportlab==4.5.1
```

## 14. Dependencias Clave (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.16.1",
    "zustand": "^5.0.14",
    "html5-qrcode": "^2.3.8",
    "recharts": "^3.8.1",
    "sonner": "^2.0.7",
    "date-fns": "^4.3.0"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "tailwindcss": "^3.4.19",
    "postcss": "^8.5.15",
    "autoprefixer": "^10.5.0",
    "@types/react": "^19.2.15",
    "@types/node": "^25.9.1",
    "eslint": "^9.39.4",
    "eslint-config-next": "^16.2.6"
  }
}
```

---

## 15. Archivo docker-compose.yml (referencia)

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: <proyecto>-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: <db_name>
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: <proyecto>-backend
    restart: unless-stopped
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql+psycopg://postgres:postgres@db:5432/<db_name>
      SECRET_KEY: <secret_key>
      FRONTEND_URL: http://frontend:3001
      BACKEND_PORT: 8001
    depends_on:
      db:
        condition: service_healthy
    entrypoint: >
      sh -c "cd /app && alembic upgrade head && python seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port 8001"

  frontend:
    build: ./frontend
    container_name: <proyecto>-frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: /api/v1
    depends_on:
      - backend

volumes:
  pgdata:
```
