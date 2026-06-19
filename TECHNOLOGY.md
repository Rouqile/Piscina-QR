# Stack Tecnológico — InventarioSA

Este documento describe la arquitectura y tecnologías utilizadas en el sistema.
Sirve como **plantilla base** para construir nuevos sistemas (asistencia, gestión de archivos, etc.).

---

## Estructura del proyecto

```
proyecto/
├── backend/              # API REST (Python/FastAPI)
├── frontend/             # Interfaz web (Next.js)
├── docker-compose.yml    # Orquestación de servicios
├── .gitignore
├── AGENTS.md             # Instrucciones para la IA
├── MIGRACION.md          # Guía de despliegue
└── TECHNOLOGY.md         # Este archivo
```

---

## Backend — Python + FastAPI

### Lenguaje
- **Python 3.11+**

### Framework
- **FastAPI 0.115+** — Framework para construir APIs REST con documentación automática (Swagger/OpenAPI)
- Servidor: **Uvicorn 0.30+** (servidor ASGI)

### Base de datos
- **PostgreSQL 18** — Base de datos relacional
- **SQLAlchemy 2.0+** — ORM (mapea tablas SQL a objetos Python)
- **Alembic 1.13+** — Control de versiones de base de datos (migraciones)
- **psycopg2-binary** — Conector de Python a PostgreSQL

### Seguridad
- **JWT** — Autenticación por tokens (access_token + refresh_token)
- **python-jose** — Creación y validación de tokens JWT
- **bcrypt** — Hash de contraseñas

### Validación
- **Pydantic 2.5+** — Validación de datos de entrada/salida
- **pydantic-settings** — Variables de entorno tipadas
- **Pydantic EmailStr** — Validación de emails

### Reportes
- **ReportLab** — Generación de PDF
- **openpyxl** — Generación de Excel

### Archivos
- **Pillow** — Procesamiento de imágenes
- **python-multipart** — Subida de archivos

### Estructura del backend

```
backend/
├── app/
│   ├── api/v1/endpoints/    # Rutas de la API (auth, items, users, etc.)
│   ├── core/                # Configuración, seguridad, dependencias
│   ├── crud/                # Capa de acceso a datos (CRUD genérico)
│   ├── models/              # Modelos SQLAlchemy (tablas)
│   ├── schemas/             # Schemas Pydantic (validación)
│   └── services/            # Lógica de negocio (reportes, notificaciones)
├── alembic/                 # Migraciones de base de datos
├── uploads/                 # Archivos subidos (imágenes)
├── seed_data.py             # Poblado inicial de datos
├── Dockerfile               # Imagen Docker
├── entrypoint.sh            # Script de inicio (espera DB, migra, seed, inicia)
└── requirements.txt         # Dependencias Python
```

---

## Frontend — Next.js + TypeScript

### Lenguaje
- **TypeScript 5+**

### Framework
- **Next.js 14+** (App Router) — Framework de React con renderizado híbrido
- **React 18+** — Biblioteca de interfaces de usuario
- **Turbopack** — Bundler (por defecto en Next.js 15+)

### Estilos
- **Tailwind CSS 4+** — Framework de CSS utilitario (no CSS modules)
- Diseño responsive mínimo (1024px+)

### Estado global
- **Zustand 4.5+** — Estado global simple (store de autenticación)
- Token guardado en **sessionStorage** (no localStorage)

### Peticiones HTTP
- **Axios 1.6+** — Cliente HTTP con interceptores
- Interceptor de petición: adjunta token JWT automáticamente
- Interceptor de respuesta: refresca token automáticamente en 401

### Gráficas
- **Recharts 2.12+** — Gráficas (barras, pastel, líneas)

### Formularios
- **react-hook-form** (opcional) — Manejo de formularios
- **sonner** — Notificaciones toast

### Utilidades
- **date-fns** — Manejo de fechas

### Escáner
- **html5-qrcode** — Escaneo de códigos QR y de barras desde la cámara

### Estructura del frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # Página de inicio de sesión
│   │   ├── (dashboard)/        # Páginas protegidas (dashboard, items, etc.)
│   │   ├── layout.tsx          # Layout raíz
│   │   ├── error.tsx           # Página de error global
│   │   ├── not-found.tsx       # Página 404
│   │   └── loading.tsx         # Estado de carga global
│   ├── components/
│   │   ├── items/              # Componentes de bienes
│   │   ├── locations/          # Componentes de ubicaciones
│   │   ├── movements/          # Componentes de movimientos
│   │   ├── entries-exits/      # Componentes de entradas/salidas
│   │   ├── users/              # Componentes de usuarios
│   │   ├── layout/             # Sidebar, TopBar
│   │   └── ui/                 # Componentes reutilizables (Modal, Badge, PageTitle, ScannerModal)
│   ├── lib/                    # Configuración de Axios
│   ├── services/               # Llamadas a la API (cada módulo tiene su servicio)
│   ├── stores/                 # Stores de Zustand
│   ├── types/                  # Interfaces TypeScript
│   └── middleware.ts           # Redirección de rutas
├── Dockerfile                  # Imagen Docker (multi-etapa)
├── next.config.ts              # Configuración de Next.js
├── tailwind.config.ts          # Configuración de Tailwind
└── package.json
```

---

## Infraestructura

### Docker
- **Docker Desktop** para desarrollo local
- **docker-compose.yml** con 3 servicios:
  - `db` — PostgreSQL 16
  - `backend` — FastAPI (Python 3.11)
  - `frontend` — Next.js (Node 20)

### Acceso remoto
- **Cloudflared** — Tunnel para exponer el sistema públicamente
  - Frontend: 
  - Backend: 
- Alternativa: red local (sin tunnel)

---

## Roles y permisos

El sistema puede tener roles con permisos granulares por módulo:

| Rol | Descripción |
|-----|-------------|
| **admin** | Acceso total (CRUD en todo) |
...

Los permisos se almacenan como JSON en la tabla `roles` y se validan mediante dependencias de FastAPI.

---

## Patrones de diseño

### Backend
- **Patrón Repository (CRUD genérico)**: `CRUDBase[ModelType, CreateSchema, UpdateSchema]` reutilizable
- **Inyección de dependencias**: FastAPI `Depends()` para sesiones DB, autenticación, permisos
- **MVC simplificado**: Models → CRUD → Endpoints (sin capa de servicio compleja)

### Frontend
- **Columna + acciones**: Tablas con botones de editar/eliminar en la última columna
- **Modales para formularios**: Todos los CRUD usan modales (no páginas separadas)
- **Buscador global en TopBar**: Búsqueda que redirige a la página de bienes con filtro
- **Sidebar por rol**: El menú cambia según el rol del usuario
- **Protección de rutas**: Redirección a login si no hay token

---

## Variables de entorno

### Backend (`.env`)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/inventariosa
SECRET_KEY=clave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:7000/api/v1
```

---

## Resumen para empezar un nuevo proyecto

Si quieres crear un nuevo sistema con la misma base:

1. **Copia esta estructura** de carpetas (backend + frontend + docker)
2. **Cambia los modelos** SQLAlchemy según las tablas que necesites
3. **Crea los CRUD** con el patrón genérico
4. **Genera las migraciones** con Alembic
5. **Crea las páginas** en Next.js siguiendo el mismo patrón de componentes
6. **Reutiliza** los componentes UI (Modal, Badge, PageTitle)
7. **Usa el mismo sistema** de autenticación JWT + roles
8. **Despliega** con docker-compose + cloudflared

### Stack mínimo para cualquier proyecto CRUD

```
Backend:  Python + FastAPI + SQLAlchemy + PostgreSQL
Frontend: Next.js + TypeScript + Tailwind + Zustand + Axios
Infra:    Docker + Cloudflared (opcional)
```
