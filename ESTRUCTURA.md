# Estructura del Proyecto — InventarioSA

Sistema de inventario web para colegio.
Backend: Python/FastAPI + PostgreSQL | Frontend: Next.js 14 + TypeScript + TailwindCSS

---

## Raíz del proyecto

```
inventarioSA/
├── docker-compose.yml          Orquestación de contenedores (PostgreSQL + Backend + Frontend)
├── AGENTS.md                   Instrucciones para asistentes de IA sobre la arquitectura
├── README.md                   Documentación general del proyecto
├── MIGRACION.md                Guía de migraciones de base de datos
├── TECHNOLOGY.md               Stack tecnológico detallado
├── .gitignore                  Archivos que Git ignora
├── .github/workflows/ci.yml    CI/CD: lint → test → build
└── .agents/skills/             Instrucciones para asistentes de IA
    ├── accessibility/          Auditoría WCAG 2.2
    ├── frontend-design/        Diseño de interfaces
    └── seo/                    Optimización para buscadores
```

---

## Backend (`backend/`)

API REST construida con FastAPI (Python 3.11+), SQLAlchemy 2.0 y PostgreSQL 16.

```
backend/
├── .env                        Variables de entorno (BD, JWT, CORS)
├── .env.example                Plantilla sin secretos para nuevos desarrolladores
├── requirements.txt            Dependencias Python del proyecto
├── pyproject.toml              Configuración de Ruff (lint), pytest y coverage
├── Dockerfile                  Imagen Docker para producción
├── entrypoint.sh               Script de arranque del contenedor
├── seed_data.py                Poblado inicial de la base de datos
├── test_db.py                  Script de verificación de conexión a BD
├── .pre-commit-config.yaml     Hooks de pre-commit: lint, formato, seguridad
│
├── uploads/                    📸 Imágenes de los bienes registrados
│   └── item_{id}_{fecha}.jpeg/png
│
├── alembic/                    🗄️ Migraciones de base de datos
│   ├── env.py                  Configuración de Alembic (detecta modelos automáticamente)
│   ├── script.py.mako          Plantilla para nuevas migraciones
│   └── versions/               📜 Historial de migraciones
│       ├── cc4bc1d64c18        Creación inicial de tablas
│       ├── 97a3088da301        (vacía, sin efectos)
│       ├── d8e2f1a3b4c5        Agrega tabla school_settings
│       ├── b5c4d3e2f1a0        Agrega columna color a status_types
│       ├── f4a3b2c1d0e6        Agrega furniture_type, env_type, campos de ubicación
│       ├── f12aaaab7ae9        Agrega created_at a roles, categories, locations
│       └── 39c5742a2482        Agrega 28 índices de rendimiento
│
├── tests/                      🧪 Tests automatizados
│   ├── conftest.py             Configuración de pytest (SQLite, fixtures, client)
│   ├── test_auth.py            9 tests: login, refresh, logout, /me
│   ├── test_items.py           11 tests: CRUD bienes, búsqueda, filtros, validaciones
│   ├── test_categories.py      6 tests: CRUD categorías, duplicados
│   ├── test_locations.py       5 tests: CRUD ubicaciones, duplicados
│   ├── test_entries_exits.py   6 tests: entrada/salida, stock, validaciones
│   ├── test_movements.py       3 tests: movimiento, misma ubicación, listado
│   └── test_permissions.py     5 tests: admin vs user, acceso no autenticado
│
└── app/                        🧠 Código fuente del backend
    ├── main.py                 Punto de entrada: crea la app FastAPI, monta middleware y rutas
    │
    ├── api/v1/                 🌐 Endpoints REST
    │   ├── router.py           Agrupador: importa y registra los 15 routers
    │   └── endpoints/          Controladores por recurso
    │       ├── auth.py         POST /login, /refresh, /logout, GET /me
    │       ├── users.py        CRUD de usuarios (solo accesible por admin)
    │       ├── items.py        CRUD de bienes + upload de imágenes + búsqueda con filtros
    │       ├── categories.py   CRUD de categorías
    │       ├── locations.py    CRUD de ubicaciones
    │       ├── entries_exits.py Registro de entradas/salidas + estadísticas
    │       ├── movements.py    Movimientos entre ubicaciones
    │       ├── dashboard.py    Estadísticas: totales, alertas stock cero, gráficas mensuales
    │       ├── notifications.py Notificaciones del sistema (leídas, no leídas)
    │       ├── reports.py      Exportación Excel/PDF de inventario y movimientos
    │       ├── roles.py        Listado de roles del sistema
    │       ├── school.py       Configuración del colegio
    │       ├── env_types.py    CRUD tipos de ambiente
    │       ├── furniture_types.py CRUD tipos de mobiliario
    │       └── status_types.py CRUD estados (Bueno, Regular, Malo)
    │
    ├── core/                   ⚙️ Configuración y utilidades centrales
    │   ├── config.py           Settings con Pydantic: lee variables de entorno
    │   ├── security.py         JWT (access/refresh tokens) + bcrypt (hashing de contraseñas)
    │   ├── dependencies.py     Dependencias FastAPI: get_current_user, require_permission
    │   ├── rate_limit.py       Limitador de peticiones (10 intentos/minuto en login)
    │   ├── cors_middleware.py  Middleware CORS que refleja el origen del request
    │   ├── security_headers.py Headers HTTP de seguridad (HSTS, X-Frame-Options, XSS)
    │   ├── log_middleware.py   Logger de cada request (método, ruta, status, tiempo)
    │   ├── logging_config.py   Configuración de logging estructurado con timestamps
    │   └── error_handlers.py   Manejador global de excepciones con respuesta JSON
    │
    ├── db/                     🛢️ Conexión a base de datos
    │   ├── base.py             DeclarativeBase de SQLAlchemy (base de todos los modelos ORM)
    │   └── session.py          Engine + sessionmaker + get_db (dependencia para FastAPI)
    │
    ├── models/                 🏗️ Modelos ORM (representan las tablas de PostgreSQL)
    │   ├── user.py             Usuarios: email, hashed_password, role_id, is_active
    │   ├── role.py             Roles: admin, user (con permisos en JSON)
    │   ├── category.py         Categorías de bienes: nombre, descripción
    │   ├── location.py         Ubicaciones físicas: nombre, ambiente, capacidad
    │   ├── item.py             Bienes: nombre, categoría, ubicación, stock, costo, serie, código
    │   ├── entry_exit.py       Entradas/salidas: item, tipo, cantidad, responsable
    │   ├── movement.py         Movimientos: item, ubicación origen/destino, responsable
    │   ├── notification.py     Notificaciones: usuario, título, mensaje, leída
    │   ├── activity_log.py     Auditoría: usuario, acción, módulo, detalle, IP
    │   ├── school.py           Configuración del colegio: nombre, dirección, teléfono
    │   ├── status_type.py      Estados predefinidos: nombre, color
    │   ├── env_type.py         Tipos de ambiente: nombre
    │   └── furniture_type.py   Tipos de mobiliario: nombre
    │
    ├── schemas/                📋 Schemas Pydantic (validación y serialización de datos)
    │   ├── auth.py             LoginRequest, TokenResponse, UserInfo, LoginResponse
    │   ├── user.py             UserBase, UserCreate, UserUpdate, UserResponse
    │   ├── role.py             RoleBase, RoleCreate, RoleUpdate, RoleResponse
    │   ├── category.py         CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse
    │   ├── location.py         LocationBase, LocationCreate, LocationUpdate, LocationResponse
    │   ├── item.py             ItemBase + ItemStatus enum + ItemCreate, ItemUpdate, ItemResponse
    │   ├── entry_exit.py       EntryExitType enum, EntryReason enum, EntryExitCreate/Response
    │   ├── movement.py         MovementBase, MovementCreate, MovementUpdate, MovementResponse
    │   ├── notification.py     NotificationBase, NotificationCreate, NotificationResponse
    │   ├── activity_log.py     ActivityLogBase, ActivityLogCreate, ActivityLogResponse
    │   ├── school.py           SchoolSettingsBase, SchoolSettingsCreate, SchoolSettingsResponse
    │   ├── status_type.py      StatusTypeBase, StatusTypeCreate, StatusTypeUpdate, StatusTypeResponse
    │   ├── env_type.py         EnvTypeBase, EnvTypeCreate, EnvTypeUpdate, EnvTypeResponse
    │   └── furniture_type.py   FurnitureTypeBase, FurnitureTypeCreate, FurnitureTypeResponse
    │
    ├── crud/                   🔧 Capa de acceso a datos (operaciones contra la BD)
    │   ├── base.py             CRUDBase genérico: get, get_all, get_by_name, create, update, remove
    │   ├── user.py             + get_by_email, authenticate, create con hash de contraseña
    │   ├── item.py             + get_by_barcode, get_by_serial, get_low_stock
    │   ├── entry_exit.py       + get_by_item, get_recent_movements
    │   ├── movement.py         + get_by_item, get_by_location
    │   ├── notification.py     + get_by_user, get_unread_count, mark_as_read
    │   ├── school.py           + get_first, upsert
    │   └── activity_log.py     + create_log (registro auditado de acciones)
    │   (category, location, role, status_type, env_type, furniture_type heredan de CRUDBase)
    │
    └── services/               🧪 Lógica de negocio
        ├── item_helper.py      Convierte modelo Item → ItemResponse con nombres relacionados
        ├── notification_service.py Alertas de stock bajo + bienes sin movimiento en 30 días
        └── report_service.py   Generación de archivos Excel (openpyxl) y PDF (reportlab)
```

---

## Frontend (`frontend/`)

Aplicación web con Next.js 14 App Router, TypeScript, Tailwind CSS y Zustand.

```
frontend/
├── .env.local                  NEXT_PUBLIC_API_URL (URL del backend)
├── package.json                Dependencias: next, react, zustand, axios, recharts, tailwindcss
├── tsconfig.json               Configuración de TypeScript
├── next.config.ts              Configuración de Next.js
├── eslint.config.mjs           Reglas de ESLint
├── postcss.config.mjs          PostCSS para Tailwind CSS
├── Dockerfile                  Imagen Docker para producción
│
├── public/                     🌐 Archivos estáticos públicos
│   └── *.svg                   Iconos SVG (file, globe, next, vercel, window)
│
└── src/                        🧠 Código fuente
    ├── middleware.ts            Protección de rutas: redirige a /login si no hay token
    │
    ├── app/                    📄 Páginas (App Router)
    │   ├── layout.tsx          Layout raíz: HTML, fonts, importa globals.css
    │   ├── page.tsx            Página de inicio (redirige a dashboard o login)
    │   ├── error.tsx           Página de error global
    │   ├── loading.tsx         Pantalla de carga mientras se renderiza
    │   ├── not-found.tsx       Página 404 personalizada
    │   ├── globals.css         Estilos globales con Tailwind
    │   ├── favicon.ico         Icono de la pestaña del navegador
    │   │
    │   ├── (auth)/             🔐 Grupo de rutas de autenticación
    │   │   ├── layout.tsx      Layout del login (centrado, sin sidebar, sin menú)
    │   │   └── login/
    │   │       └── page.tsx    Página de inicio de sesión (formulario email + contraseña)
    │   │
    │   └── (dashboard)/        🖥️ Grupo de rutas del sistema
    │       ├── layout.tsx      Layout principal: TopBar (superior) + Sidebar (lateral) + contenido
    │       ├── dashboard/
    │       │   └── page.tsx    Panel principal con tarjetas de stats, gráficas y movimientos recientes
    │       ├── items/
    │       │   └── page.tsx    Gestión de bienes: tabla paginada con búsqueda y filtros
    │       ├── categories/
    │       │   └── page.tsx    Gestión de categorías
    │       ├── locations/
    │       │   └── page.tsx    Gestión de ubicaciones
    │       ├── entries-exits/
    │       │   └── page.tsx    Control de entradas y salidas de inventario
    │       ├── movements/
    │       │   └── page.tsx    Movimientos entre ubicaciones
    │       ├── users/
    │       │   └── page.tsx    Administración de usuarios (solo rol admin)
    │       ├── reports/
    │       │   └── page.tsx    Exportación de reportes Excel y PDF
    │       ├── school/
    │       │   └── page.tsx    Configuración de datos del colegio
    │       └── settings/
    │           ├── page.tsx              Pestañas de configuración del sistema
    │           ├── CategoriesTab.tsx      Pestaña: CRUD de categorías
    │           ├── StatusTypesTab.tsx     Pestaña: CRUD de estados
    │           ├── EnvTypesTab.tsx        Pestaña: CRUD de tipos de ambiente
    │           └── FurnitureTypesTab.tsx  Pestaña: CRUD de tipos de mobiliario
    │
    ├── components/             🧩 Componentes React reutilizables
    │   ├── layout/             📐 Componentes de layout
    │   │   ├── Sidebar.tsx     Menú lateral que cambia según el rol del usuario
    │   │   └── TopBar.tsx      Barra superior: buscador global + campana notificaciones + perfil
    │   │
    │   ├── ui/                 🎨 Componentes de interfaz genéricos
    │   │   ├── Modal.tsx       Modal reutilizable para formularios CRUD
    │   │   ├── Badge.tsx       Badge de colores (verde=activo, amarillo=reparación, rojo=baja)
    │   │   ├── PageTitle.tsx   Título de página estandarizado con icono
    │   │   └── ScannerModal.tsx Escáner de código de barras con cámara
    │   │
    │   ├── items/              📦 Componentes de bienes
    │   │   ├── ItemFormModal.tsx       Formulario crear/editar bien
    │   │   ├── DeleteConfirmDialog.tsx Confirmación de baja lógica de bien
    │   │   └── ImageViewModal.tsx      Visor de imagen ampliada del bien
    │   │
    │   ├── entries-exits/
    │   │   └── EntryExitFormModal.tsx  Formulario de entrada o salida de inventario
    │   │
    │   ├── movements/
    │   │   └── MovementFormModal.tsx   Formulario de movimiento entre ubicaciones
    │   │
    │   ├── locations/
    │   │   ├── LocationFormModal.tsx      Formulario crear/editar ubicación
    │   │   ├── LocationDetailModal.tsx    Detalle de ubicación con bienes asignados
    │   │   ├── DeleteLocationDialog.tsx   Confirmación eliminar ubicación
    │   │   └── MoveItemModal.tsx          Diálogo para mover bien a otra ubicación
    │   │
    │   └── users/
    │       ├── UserFormModal.tsx       Formulario crear/editar usuario
    │       └── DeleteUserDialog.tsx    Confirmación eliminar usuario (baja lógica)
    │
    ├── services/               📡 Llamadas a la API (Axios)
    │   ├── auth.ts             login(), refresh(), logout(), getMe()
    │   ├── items.ts            CRUD + búsqueda + upload de imagen
    │   ├── categories.ts       CRUD categorías
    │   ├── locations.ts        CRUD ubicaciones
    │   ├── entriesExits.ts     CRUD entradas/salidas + stats
    │   ├── movements.ts        CRUD movimientos
    │   ├── users.ts            CRUD usuarios
    │   ├── notifications.ts    Listar, contar no leídas, marcar como leídas
    │   ├── reports.ts          Descargar Excel/PDF
    │   ├── school.ts           Obtener/actualizar configuración
    │   ├── roles.ts            Listar roles
    │   ├── statusTypes.ts      CRUD estados
    │   ├── envTypes.ts         CRUD tipos de ambiente
    │   └── furnitureTypes.ts   CRUD tipos de mobiliario
    │
    ├── lib/
    │   └── axios.ts            🔌 Cliente Axios configurado: baseURL, interceptor para JWT
    │                            El token se almacena en sessionStorage (no localStorage)
    │
    ├── stores/
    │   └── authStore.ts        🗃️ Estado global con Zustand: user, token, role, login/logout
    │
    └── types/
        └── index.ts            📝 Tipos TypeScript compartidos (interfaces User, Item, Category, etc.)
```

---

## Flujo de datos simplificado

```
Frontend (Next.js)                    Backend (FastAPI)                    Base de Datos
═══════════════════                   ═══════════════════                  ═════════════
                                     
src/app/(dashboard)/layout.tsx  ───→  app/main.py                         PostgreSQL 16
  (Sidebar + TopBar)                    (middleware: CORS, logging,       ├── users
                                        seguridad, rate limit)            ├── roles
src/services/auth.ts            ───→  api/v1/endpoints/auth.py            ├── items
  (axios)                               → core/security.py (JWT)         ├── categories
                                        → crud/user.py                   ├── locations
src/stores/authStore.ts                 → models/user.py                  ├── entries_exits
  (Zustand: token en sessionStorage)                                      ├── movements
                                                                          ├── notifications
src/app/(dashboard)/items/      ───→  api/v1/endpoints/items.py           ├── activity_logs
  (tabla + ItemFormModal)               → schemas/item.py (validación)   ├── school_settings
                                        → crud/item.py                   ├── status_types
src/components/items/                   → models/item.py                  ├── env_types
  (ItemFormModal, etc.)                                                    └── furniture_types
```

---

## Roles y permisos

| Rol    | Acceso |
|--------|--------|
| admin  | CRUD completo en todos los módulos, incluido Usuarios |
| user   | CRUD completo en todos los módulos EXCEPTO Usuarios |

Los permisos se verifican por carácter: `"c"` (create), `"r"` (read), `"u"` (update), `"d"` (delete) contra el string de permisos del rol (`"crud"`).

---

## Convenciones del proyecto

- **Backend**: Python 3.11+, tipado moderno (`X | None` en vez de `Optional[X]`)
- **Frontend**: App Router de Next.js 14, componentes modales para formularios CRUD
- **Token JWT**: en `sessionStorage`, no `localStorage`
- **Estado**: Zustand para estado global
- **Estilos**: Tailwind CSS (no CSS modules)
- **Gráficas**: Recharts
- **BD**: migraciones con Alembic, modelos con SQLAlchemy 2.0
- **Tests**: pytest con SQLite, TestClient de FastAPI
