# Implementation Plan: Aticama MVP

## 1. Stack and Architecture

- **Frontend:** React 18 + Vite + TailwindCSS 3
- **Backend:** Node.js + Express, empaquetado como una única función serverless en `api/index.js`
- **Plataforma de Despliegue:** Vercel (mismo proyecto para frontend y backend) con archivo `vercel.json` configurado para enrutar todas las peticiones `/api/*` hacia `api/index.js`
- **Base de Datos y Auth:** Supabase (PostgreSQL + Supabase Auth + Row Level Security).
- **Mailing:** Nodemailer + Gmail SMTP.

## 2. Estructura del Proyecto (Monorepo)

```
aticama-system/
├── vercel.json
├── package.json
├── api/
│   └── index.js                 <-- Función serverless Express
├── backend/
│   └── src/
│       ├── app.js               <-- Configuración de Express
│       ├── routes/              <-- Rutas por dominio
│       ├── controllers/         <-- Lógica de negocio HTTP
│       ├── services/            <-- Servicios comunes
│       ├── middleware/          <-- Auth, Roles, Errores
│       └── config/              <-- Supabase client
└── src/                         <-- Frontend React
    ├── components/
    ├── pages/
    ├── hooks/
    ├── services/                <-- Cliente API Frontend
    └── App.jsx
```

## 3. Fases de Implementación del MVP

La implementación se dividirá en 7 fases claras que garantizan una entrega de valor continua y ordenada por dependencias.

### Fase 1: Configuración monorepo + Auth
- Inicialización de Vite React app.
- Configuración de TailwindCSS.
- Setup de Express en la carpeta `backend/` y envoltorio en `api/index.js`.
- Configuración de `vercel.json` con rewrites para `/api/*`.
- Configuración de Supabase (tablas iniciales de Auth y perfiles con RLS básico).
- Creación de middleware de autenticación (verificación de JWT).

### Fase 2: Insumos
- Creación de tabla `insumos` y políticas RLS (solo compras, admin, cocina).
- Backend: CRUD en `backend/src/routes/insumos_routes.js` y `insumos_controller.js`.
- Frontend: `InsumosPage.jsx` con alertas si el stock está por debajo del mínimo.

### Fase 3: Productos y Marcas
- Creación de tablas `marcas` y `productos`.
- Backend: CRUD de productos (asociados a marcas).
- Frontend: `ProductosPage.jsx`.

### Fase 4: Recetas (BOM)
- Creación de tablas `recetas` y `receta_insumos` (ligando PT con múltiples insumos base).
- Backend: Endpoint para alta de receta validando integridad referencial.
- Frontend: `RecetasPage.jsx` para construir el árbol de materiales.

### Fase 5: Producción
- Creación de tablas `producciones` y `movimientos_inventario` (como bitácora general).
- Backend: Lógica transaccional (o simulación RPC) en `produccion_controller.js` para descontar insumos proporcionalmente y dar de alta producto terminado.
- Frontend: `ProduccionPage.jsx`.

### Fase 6: Clientes
- Creación de tabla `clientes` con campos obligatorios para facturación (RFC, Razón Social) bloqueados por `CHECK` constraints si `requiere_factura` es true.
- Backend: CRUD de clientes.
- Frontend: `ClientesPage.jsx`.

### Fase 7: Rutas + Entregas + Ventas + Corte de ruta
- Tablas: `rutas`, `ruta_clientes`, `entregas`, `entrega_detalle`, `ventas` y `cortes_ruta`.
- Políticas RLS fuertes: El rol `distribuidor` solo ve clientes, entregas y ventas de las rutas asignadas a su `auth.uid()`.
- Backend: Endpoints transaccionales para abrir/cerrar entregas, calcular devoluciones, procesar ventas individuales y generar el corte automático con diferencias reportadas.
- Frontend: Flujo de inicio de ruta, vista simplificada para registrar venta a la tiendita y resumen final de corte de ruta (dashboard para admin, vista personal para distribuidor).

## 4. Supabase - Database Constraints & RLS
- Se habilitará Row Level Security (`alter table X enable row level security;`) en todas las tablas del MVP.
- Todo borrado será `activo = false` mediante funciones en backend en vez de sentencias `DELETE`.
- La consistencia se delegará a Supabase (PostgreSQL) usando Constraints y Foréign Keys estrictos.

## 5. Pruebas y Validación (Ponytail)
- En cada fase, se garantizará que el código sea el mínimo necesario.
- No se creará ninguna abstracción prematura.
- Todo endpoint de Express será testeado mediante cliente rest/ThunderClient, y se integrará al frontend de inmediato en el mismo PR lógico.
