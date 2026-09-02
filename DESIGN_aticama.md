# ANÁLISIS DEL NEGOCIO (previo al DESIGN.md)

**Giro del negocio:** Aticama Preparado para Mariscos es una empresa de Nayarit que produce concentrados/sazonadores en sobre para preparar mariscos (pescado zarandeado, camarones a la diabla, etc.), bajo dos marcas propias. El producto ya trae etiqueta con tabla nutrimental, código de barras y QR. La venta se hace por reparto directo: distribuidores llevan el producto en ruta y lo venden principalmente a changarros/tienditas de Nayarit, cobrando en efectivo.

Carlos (dueño/operador) está fusionando su base de clientes con la de un socio para unificar rutas, y busca formalizar procesos que hoy son manuales o inexistentes antes de seguir creciendo (su meta de largo plazo es exportar, pero por ahora el alcance es solo Nayarit).

**Software/proceso actual:** Una hoja de Excel con recetas costeadas por ingrediente. No hay sistema de inventario, ni de rutas, ni de clientes — todo el control de campo es informal y depende de la memoria/honestidad de cada distribuidor.

## Necesidades EXPLÍCITAS (dichas textualmente)

* Control de entradas de mercancía al almacén y salidas de producto terminado \[MVP]
* Que al hacer una producción se descuenten automáticamente los insumos usados por receta \[MVP]
* Alerta automática cuando un insumo está por agotarse \[MVP]
* Saber cuánto hay en almacén de producto terminado y cuánto se lleva cada vendedor \[MVP]
* Base de datos de clientes: nombre, teléfono, WhatsApp, dirección, nombre de contacto \[MVP]
* Clasificar clientes que piden factura (con RFC/constancia) vs. los que no \[MVP]
* Control de rutas de distribución y qué distribuidor tiene asignada cuál \[MVP]
* Ver ubicación de clientes en un mapa \[MVP]
* "Candado" con GPS para ver dónde están vendiendo los distribuidores \[OPCIONAL]
* Mensajes masivos a clientes anunciando nuevos productos \[MVP]
* Registrar de un corte de ruta (lo entregado vs. lo vendido vs. el efectivo reportado) \[MVP]
* Preventa/pedido anticipado tipo refresquera \[OPCIONAL — Carlos dijo explícitamente que no es prioritario]
* Enlazar a futuro con contabilidad/facturación \[OPCIONAL — "eso ya después"]

## Necesidades IMPLÍCITAS (deducidas de su operación)

* Roles distintos de acceso: compras, administración, ventas, cocina/producción — cada uno viendo solo lo suyo \[MVP]
* Estructura de receta tipo BOM (bill of materials): un producto terminado se compone de N insumos en cantidades fijas \[MVP]
* Dos marcas bajo el mismo catálogo de productos, que deben poder reportarse por separado \[MVP]
* Unificación de dos bases de clientes (la de Carlos y la del socio) en un solo sistema \[MVP]
* Trazabilidad para prevenir disputas de "esa ruta es mía" con distribuidores que se van de la empresa — los datos de clientes/rutas deben ser propiedad de la empresa, no del distribuidor \[MVP, vía control de acceso]
* Baja lógica en vez de borrado físico (para no perder historial ante rotación de personal) \[MVP]

## Pain points actuales

* Cero visibilidad de inventario real: solo Excel de costeo, sin descuento automático ni alertas
* Riesgo de disputas legales/operativas por rutas y clientes "informalmente apropiados" por ex-empleados
* Manejo de efectivo riesgoso para los distribuidores
* Fragmentación de datos entre las dos marcas/socios

\---

# DESIGN.md

## 1\. CONTEXTO DEL NEGOCIO

Aticama Preparado para Mariscos (Nayarit, México) produce concentrados en sobre para sazonar mariscos bajo dos marcas. Opera con un modelo de distribución directa: 3 distribuidores reparten producto en rutas fijas por municipios de Nayarit cada \~15 días, cobrando en efectivo a tienditas/changarros. Actualmente no existe ningún sistema — solo una hoja de Excel para costeo de recetas. Carlos (dueño) está en proceso de fusionar su operación con la de un socio para unificar rutas y bases de clientes, y quiere digitalizar antes de seguir escalando.

Equipo involucrado: Carlos (dueño/producción), un administrador, personal de compras, personal de ventas/cocina, y los distribuidores en ruta.

## 2\. NECESIDADES IDENTIFICADAS

*(ver tabla de Análisis del Negocio arriba — todas las necesidades quedan clasificadas \[MVP]/\[OPCIONAL] ahí)*

## 3\. STACK TECNOLÓGICO

* **Frontend:** React 18 + Vite 5 + TailwindCSS 3
* **Backend:** Node.js 20 + Express 4, empaquetado como función serverless en Vercel (`api/index.js`) — mismo proyecto Vercel que el frontend, NUNCA un servicio separado
* **Base de datos / Auth / Storage:** Supabase (Postgres + Supabase Auth + Storage para fotos de producto)
* **Email:** Nodemailer + Gmail SMTP (`GMAIL\_USER`, `GMAIL\_APP\_PASSWORD`) — nunca Resend
* **WhatsApp \[OPCIONAL]:** Meta Cloud API (mensajería masiva)
* **Mapas \[OPCIONAL]:** cualquier proveedor de mapas embebible (ej. Google Maps JS API) solo para visualización de clientes/rutas

## 4\. ARQUITECTURA DE MÓDULOS

```
┌─────────────────────────────────────────────────────────────┐
│                        ATICAMA SYSTEM                        │
├───────────────────────────┬───────────────────────────────────┤
│           MVP             │            OPCIONAL               │
├───────────────────────────┼───────────────────────────────────┤
│ Auth + Roles               │ Geolocalización de distribuidores │
│ Insumos (inventario MP)    │                   │
│ Productos (inventario PT)  │         │
│ Recetas (BOM)              │ Preventa / pedido anticipado       │
│ Producción (descuento auto)│ Terminal de pago con tarjeta       │
│ Clientes (con flag factura)│ Contabilidad / CFDI                │
│ Rutas y asignación         │                                    │
│ Entregas y Ventas de ruta  │                                    │
│ Corte de ruta (reconciliación)

Mensajería masiva WhatsApp 

Mapa de clientes│                                │
└───────────────────────────┴───────────────────────────────────┘
```

## 5\. ARQUITECTURA DE DESPLIEGUE

Un solo proyecto de Vercel sirve el frontend estático (build de Vite) y el backend Express empaquetado en `api/index.js` como función serverless; `vercel.json` reescribe todo `/api/\*` hacia esa función. No existen dos dominios ni dos despliegues.

```
Navegador (React SPA)
        │
        ▼
  Vercel Edge/CDN ── sirve estáticos (dist/)
        │
        ▼  /api/\*  (rewrite)
  api/index.js (función serverless = Express app completa)
        │
        ▼
     Supabase (Postgres + Auth + Storage)
```

## 6\. ESTRUCTURA DE CARPETAS

```
aticama-system/
├── vercel.json
├── package.json
├── api/
│   └── index.js
├── backend/
│   └── src/
│       ├── app.js
│       ├── routes/
│       │   ├── auth\_routes.js
│       │   ├── insumos\_routes.js
│       │   ├── productos\_routes.js
│       │   ├── recetas\_routes.js
│       │   ├── produccion\_routes.js
│       │   ├── clientes\_routes.js
│       │   ├── rutas\_routes.js
│       │   ├── entregas\_routes.js
│       │   ├── ventas\_routes.js
│       │   └── cortes\_routes.js
│       ├── controllers/
│       │   ├── insumos\_controller.js
│       │   ├── productos\_controller.js
│       │   ├── recetas\_controller.js
│       │   ├── produccion\_controller.js
│       │   ├── clientes\_controller.js
│       │   ├── rutas\_controller.js
│       │   ├── entregas\_controller.js
│       │   ├── ventas\_controller.js
│       │   └── cortes\_controller.js
│       ├── services/
│       │   ├── inventario\_service.js
│       │   └── emailService.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── roleMiddleware.js
│       └── config/
│           └── supabaseClient.js
└── src/
    ├── components/
    ├── pages/
    │   ├── InsumosPage.jsx
    │   ├── ProductosPage.jsx
    │   ├── RecetasPage.jsx
    │   ├── ProduccionPage.jsx
    │   ├── ClientesPage.jsx
    │   ├── RutasPage.jsx
    │   ├── EntregasPage.jsx
    │   └── CorteRutaPage.jsx
    ├── hooks/
    ├── services/
    │   └── apiClient.js
    └── App.jsx
```

## 7\. ESQUEMA DE BASE DE DATOS

```sql
-- ============================================================
-- ROLES Y PERFILES
-- ============================================================
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('admin','compras','ventas','cocina','distribuidor')),
  activo boolean not null default true,
  created\_at timestamptz not null default now()
);

alter table perfiles enable row level security;

create policy "usuario ve su propio perfil"
  on perfiles for select
  using (auth.uid() = id);

create policy "admin ve todos los perfiles"
  on perfiles for select
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

-- ============================================================
-- MARCAS
-- ============================================================
create table marcas (
  id uuid primary key default gen\_random\_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  created\_at timestamptz not null default now()
);

alter table marcas enable row level security;

create policy "usuarios autenticados leen marcas"
  on marcas for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- INSUMOS (materia prima)
-- ============================================================
create table insumos (
  id uuid primary key default gen\_random\_uuid(),
  nombre text not null,
  unidad\_medida text not null,
  stock\_actual numeric not null default 0 check (stock\_actual >= 0),
  stock\_minimo numeric not null default 0 check (stock\_minimo >= 0),
  costo\_unitario numeric not null default 0 check (costo\_unitario >= 0),
  activo boolean not null default true,
  created\_at timestamptz not null default now()
);

alter table insumos enable row level security;

create policy "compras cocina admin gestionan insumos"
  on insumos for all
  using (exists (
    select 1 from perfiles p
    where p.id = auth.uid() and p.rol in ('admin','compras','cocina')
  ));

-- ============================================================
-- PRODUCTOS (producto terminado)
-- ============================================================
create table productos (
  id uuid primary key default gen\_random\_uuid(),
  marca\_id uuid not null references marcas(id),
  nombre text not null,
  codigo\_barras text unique,
  precio\_venta numeric not null default 0 check (precio\_venta >= 0),
  stock\_actual numeric not null default 0 check (stock\_actual >= 0),
  stock\_minimo numeric not null default 0 check (stock\_minimo >= 0),
  activo boolean not null default true,
  created\_at timestamptz not null default now()
);

alter table productos enable row level security;

create policy "admin ventas cocina leen productos"
  on productos for select
  using (exists (
    select 1 from perfiles p
    where p.id = auth.uid() and p.rol in ('admin','ventas','cocina','compras')
  ));

create policy "admin cocina escriben productos"
  on productos for insert
  with check (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','cocina')
  ));

create policy "admin cocina actualizan productos"
  on productos for update
  using (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','cocina')
  ));

-- ============================================================
-- RECETAS (BOM) y sus líneas de insumos
-- ============================================================
create table recetas (
  id uuid primary key default gen\_random\_uuid(),
  producto\_id uuid not null references productos(id),
  nombre text not null,
  activo boolean not null default true,
  created\_at timestamptz not null default now()
);

alter table recetas enable row level security;

create policy "admin cocina gestionan recetas"
  on recetas for all
  using (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','cocina')
  ));

create table receta\_insumos (
  id uuid primary key default gen\_random\_uuid(),
  receta\_id uuid not null references recetas(id) on delete cascade,
  insumo\_id uuid not null references insumos(id),
  cantidad\_requerida numeric not null check (cantidad\_requerida > 0)
);

alter table receta\_insumos enable row level security;

create policy "admin cocina gestionan receta\_insumos"
  on receta\_insumos for all
  using (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','cocina')
  ));

-- ============================================================
-- PRODUCCIÓN (dispara descuento de insumos + alta de producto)
-- ============================================================
create table producciones (
  id uuid primary key default gen\_random\_uuid(),
  receta\_id uuid not null references recetas(id),
  cantidad\_producida numeric not null check (cantidad\_producida > 0),
  usuario\_id uuid not null references perfiles(id),
  created\_at timestamptz not null default now()
);

alter table producciones enable row level security;

create policy "admin cocina registran producciones"
  on producciones for all
  using (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','cocina')
  ));

-- ============================================================
-- MOVIMIENTOS DE INVENTARIO (bitácora general)
-- ============================================================
create table movimientos\_inventario (
  id uuid primary key default gen\_random\_uuid(),
  tipo\_item text not null check (tipo\_item in ('insumo','producto')),
  item\_id uuid not null,
  tipo\_movimiento text not null check (tipo\_movimiento in ('entrada','salida','produccion','ajuste')),
  cantidad numeric not null,
  referencia text,
  usuario\_id uuid references perfiles(id),
  created\_at timestamptz not null default now()
);

alter table movimientos\_inventario enable row level security;

create policy "admin compras cocina leen movimientos"
  on movimientos\_inventario for select
  using (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','compras','cocina')
  ));

create policy "admin compras cocina insertan movimientos"
  on movimientos\_inventario for insert
  with check (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','compras','cocina')
  ));

-- ============================================================
-- CLIENTES
-- ============================================================
create table clientes (
  id uuid primary key default gen\_random\_uuid(),
  nombre\_contacto text not null,
  nombre\_negocio text,
  telefono text,
  whatsapp text,
  direccion text,
  latitud numeric,
  longitud numeric,
  requiere\_factura boolean not null default false,
  rfc text,
  razon\_social text,
  activo boolean not null default true,
  created\_at timestamptz not null default now(),
  constraint chk\_datos\_fiscales check (
    requiere\_factura = false or (rfc is not null and razon\_social is not null)
  )
);

alter table clientes enable row level security;

create policy "admin ventas gestionan clientes"
  on clientes for all
  using (exists (
    select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas')
  ));

-- ============================================================
-- RUTAS
-- ============================================================
create table rutas (
  id uuid primary key default gen\_random\_uuid(),
  nombre text not null,
  zona text,
  distribuidor\_id uuid references perfiles(id),
  activo boolean not null default true,
  created\_at timestamptz not null default now()
);

alter table rutas enable row level security;

create policy "admin gestiona rutas"
  on rutas for all
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "distribuidor ve su propia ruta"
  on rutas for select
  using (distribuidor\_id = auth.uid());

create table ruta\_clientes (
  id uuid primary key default gen\_random\_uuid(),
  ruta\_id uuid not null references rutas(id) on delete cascade,
  cliente\_id uuid not null references clientes(id)
);

alter table ruta\_clientes enable row level security;

create policy "admin gestiona ruta\_clientes"
  on ruta\_clientes for all
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "distribuidor ve clientes de su ruta"
  on ruta\_clientes for select
  using (exists (
    select 1 from rutas r where r.id = ruta\_clientes.ruta\_id and r.distribuidor\_id = auth.uid()
  ));

-- ============================================================
-- ENTREGAS (carga de producto a un distribuidor para una ruta)
-- ============================================================
create table entregas (
  id uuid primary key default gen\_random\_uuid(),
  ruta\_id uuid not null references rutas(id),
  distribuidor\_id uuid not null references perfiles(id),
  fecha date not null default current\_date,
  estado text not null default 'en\_curso' check (estado in ('en\_curso','cerrada')),
  created\_at timestamptz not null default now()
);

alter table entregas enable row level security;

create policy "admin gestiona entregas"
  on entregas for all
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "distribuidor gestiona sus propias entregas"
  on entregas for all
  using (distribuidor\_id = auth.uid());

create table entrega\_detalle (
  id uuid primary key default gen\_random\_uuid(),
  entrega\_id uuid not null references entregas(id) on delete cascade,
  producto\_id uuid not null references productos(id),
  cantidad\_entregada numeric not null check (cantidad\_entregada >= 0),
  cantidad\_devuelta numeric not null default 0 check (cantidad\_devuelta >= 0)
);

alter table entrega\_detalle enable row level security;

create policy "admin gestiona entrega\_detalle"
  on entrega\_detalle for all
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "distribuidor gestiona detalle de sus entregas"
  on entrega\_detalle for all
  using (exists (
    select 1 from entregas e where e.id = entrega\_detalle.entrega\_id and e.distribuidor\_id = auth.uid()
  ));

-- ============================================================
-- VENTAS (venta puntual a un cliente dentro de una entrega/ruta)
-- ============================================================
create table ventas (
  id uuid primary key default gen\_random\_uuid(),
  entrega\_id uuid not null references entregas(id),
  cliente\_id uuid not null references clientes(id),
  producto\_id uuid not null references productos(id),
  cantidad numeric not null check (cantidad > 0),
  precio\_unitario numeric not null check (precio\_unitario >= 0),
  forma\_pago text not null default 'efectivo' check (forma\_pago in ('efectivo','tarjeta','deposito')),
  created\_at timestamptz not null default now()
);

alter table ventas enable row level security;

create policy "admin lee todas las ventas"
  on ventas for select
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "distribuidor gestiona ventas de sus entregas"
  on ventas for all
  using (exists (
    select 1 from entregas e where e.id = ventas.entrega\_id and e.distribuidor\_id = auth.uid()
  ));

-- ============================================================
-- CORTES DE RUTA (reconciliación)
-- ============================================================
create table cortes\_ruta (
  id uuid primary key default gen\_random\_uuid(),
  entrega\_id uuid not null references entregas(id) unique,
  total\_esperado numeric not null default 0,
  total\_reportado numeric not null default 0,
  diferencia numeric generated always as (total\_reportado - total\_esperado) stored,
  notas text,
  created\_at timestamptz not null default now()
);

alter table cortes\_ruta enable row level security;

create policy "admin lee todos los cortes"
  on cortes\_ruta for select
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "distribuidor gestiona corte de su entrega"
  on cortes\_ruta for all
  using (exists (
    select 1 from entregas e where e.id = cortes\_ruta.entrega\_id and e.distribuidor\_id = auth.uid()
  ));
```

## 8\. CONTRATOS DE API

Todas bajo prefijo `/api/`.

**Auth**

* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`

**Insumos**

* `GET /api/insumos`
* `POST /api/insumos`
* `PUT /api/insumos/:id`
* `DELETE /api/insumos/:id` (baja lógica)
* `GET /api/insumos/alertas` (insumos bajo stock\_minimo)

**Productos**

* `GET /api/productos`
* `POST /api/productos`
* `PUT /api/productos/:id`
* `DELETE /api/productos/:id`

**Recetas**

* `GET /api/recetas`
* `POST /api/recetas` (con líneas de insumos)
* `PUT /api/recetas/:id`
* `DELETE /api/recetas/:id`

**Producción**

* `POST /api/produccion` (registra producción; descuenta insumos, incrementa producto terminado, escribe movimientos\_inventario)
* `GET /api/produccion`

**Clientes**

* `GET /api/clientes`
* `POST /api/clientes`
* `PUT /api/clientes/:id`
* `DELETE /api/clientes/:id`
* `GET /api/clientes/facturables` (filtro requiere\_factura = true)

**Rutas**

* `GET /api/rutas`
* `POST /api/rutas`
* `PUT /api/rutas/:id`
* `POST /api/rutas/:id/clientes` (asignar cliente a ruta)

**Entregas y ventas**

* `POST /api/entregas` (abrir entrega con detalle de productos)
* `GET /api/entregas/:id`
* `POST /api/entregas/:id/ventas` (registrar venta a un cliente)
* `PUT /api/entregas/:id/detalle/:detalleId` (registrar devolución)
* `POST /api/entregas/:id/cerrar` (dispara cálculo de corte)

**Cortes de ruta**

* `GET /api/cortes/:entregaId`
* `PUT /api/cortes/:entregaId` (capturar total reportado y notas)

**\[OPCIONAL] Geolocalización**

* `POST /api/geo/ubicacion` — el distribuidor reporta su posición actual
* `GET /api/geo/rutas/:id/historial`

**\[OPCIONAL] Mapa de clientes**

* `GET /api/clientes/mapa` (clientes con lat/long para pintar en mapa)

**\[OPCIONAL] WhatsApp masivo**

* `POST /api/whatsapp/campanas` (envía mensaje a un segmento de clientes vía Meta Cloud API)

**\[OPCIONAL] Preventa**

* `POST /api/preventa` (pedido anticipado antes de la ruta)

**\[OPCIONAL] Terminal de pago**

* `POST /api/pagos/tarjeta` (registro de cobro con terminal, se integra a `ventas.forma\_pago`)

**\[OPCIONAL] Contabilidad/CFDI**

* `POST /api/facturacion/generar` (solo para clientes con requiere\_factura = true)

## 9\. REGLAS DE NEGOCIO CRÍTICAS

1. No se puede registrar una producción si los insumos disponibles son insuficientes según la receta (validar `stock\_actual` antes de descontar).
2. Toda producción descuenta automáticamente los insumos de la receta y da de alta la cantidad correspondiente de producto terminado; ambos movimientos quedan en `movimientos\_inventario`.
3. Si `stock\_actual < stock\_minimo` en un insumo o producto, se muestra una alerta en el dashboard (no bloquea operación, solo notifica).
4. Un cliente con `requiere\_factura = true` debe tener `rfc` y `razon\_social` capturados (constraint a nivel BD).
5. Una entrega solo puede cerrarse cuando todas sus líneas de `entrega\_detalle` tienen registrada cantidad devuelta o vendida.
6. Al cerrar una entrega se calcula `total\_esperado` = Σ (cantidad\_entregada − cantidad\_devuelta) × precio\_unitario del producto; la diferencia contra `total\_reportado` por el distribuidor queda visible, nunca oculta.
7. Un distribuidor (rol `distribuidor`) solo puede ver y operar sobre las rutas, entregas y ventas donde él es el `distribuidor\_id` — nunca las de otro distribuidor.
8. El rol `cocina` opera insumos, recetas y producción; el rol `ventas` opera clientes y ventas; el rol `compras` opera insumos; solo `admin` ve y edita todo.
9. Ningún registro se borra físicamente — toda baja es lógica (`activo = false`).
10. `stock\_actual` nunca puede quedar negativo en insumos ni productos (constraint `CHECK >= 0`).
11. Restricciones propias del entorno serverless: cualquier proceso de cálculo pesado (ej. recálculo masivo de inventario histórico) debe completarse dentro del timeout de la función (10s Hobby / 60s Pro); no hay estado en memoria entre requests, todo el estado vive en Supabase.

## 10\. VARIABLES DE ENTORNO

Todas configuradas en el mismo proyecto de Vercel (Settings → Environment Variables).

**Backend**

```
SUPABASE\_URL=
SUPABASE\_SERVICE\_ROLE\_KEY=
JWT\_SECRET=
GMAIL\_USER=
GMAIL\_APP\_PASSWORD=
```

**\[OPCIONAL] WhatsApp**

```
META\_WHATSAPP\_TOKEN=
META\_WHATSAPP\_PHONE\_ID=
```

**\[OPCIONAL] Terminal de pago**

```
PAGOS\_API\_KEY=
```

**Frontend**

```
VITE\_SUPABASE\_URL=
VITE\_SUPABASE\_ANON\_KEY=
VITE\_API\_URL=/api
```

## 11\. FASES DE CONSTRUCCIÓN

|Fase|Módulo|Tipo|Descripción|Dependencias|
|-|-|-|-|-|
|1|Configuración monorepo Vercel|MVP|`api/index.js` + `vercel.json` + Supabase project + Auth básico + tabla `perfiles`|—|
|2|Insumos|MVP|CRUD de insumos + alertas de stock mínimo|Fase 1|
|3|Productos y Marcas|MVP|CRUD de marcas y productos|Fase 1|
|4|Recetas (BOM)|MVP|Definir receta con líneas de insumos por producto|Fases 2, 3|
|5|Producción|MVP|Registrar producción, descuento automático de insumos, alta de producto terminado|Fase 4|
|6|Clientes|MVP|CRUD de clientes con clasificación factura/no factura|Fase 1|
|7|Rutas, Entregas, Ventas y Corte de ruta|MVP|Asignación de rutas, entregas a distribuidores, registro de ventas y cierre con reconciliación|Fases 3, 6|
|8|Geolocalización de distribuidores|OPCIONAL|Reporte de posición en ruta|Fase 7|
|9|Mapa de clientes|OPCIONAL|Visualización geográfica de clientes|Fase 6|
|10|Mensajería masiva WhatsApp|OPCIONAL|Campañas vía Meta Cloud API|Fase 6|
|11|Preventa|OPCIONAL|Pedido anticipado antes de la ruta|Fase 7|
|12|Terminal de pago con tarjeta|OPCIONAL|Cobro con tarjeta integrado a ventas|Fase 7|
|13|Contabilidad / CFDI|OPCIONAL|Facturación para clientes que la requieren|Fase 6|

El MVP queda completamente funcional y desplegado en un solo proyecto Vercel al terminar la Fase 7.

## 12\. GUÍA DE MÓDULOS OPCIONALES

**Geolocalización de distribuidores**

* Qué hace: cada distribuidor reporta su posición mientras hace ruta; admin puede ver historial de recorrido.
* Env vars: ninguna adicional (usa Supabase para guardar coordenadas).
* Instrucción para Antigravity: "Implementa el módulo de geolocalización: tabla `ubicaciones\_distribuidor` (distribuidor\_id, latitud, longitud, created\_at), endpoint POST /api/geo/ubicacion que el frontend llama periódicamente desde el navegador/dispositivo del distribuidor, y GET /api/geo/rutas/:id/historial para admin."
* Dependencia previa: módulo de Rutas y Entregas (Fase 7).
* Advertencia serverless: no uses sockets persistentes para "tiempo real"; usa polling corto desde el frontend o Supabase Realtime sobre la tabla.

**Mapa de clientes**

* Qué hace: pinta los clientes en un mapa usando lat/long ya capturados.
* Env vars: clave del proveedor de mapas (ej. `VITE\_GOOGLE\_MAPS\_KEY`).
* Instrucción para Antigravity: "Agrega una vista de mapa en el frontend que consuma GET /api/clientes/mapa y pinte un marcador por cliente."
* Dependencia previa: módulo de Clientes (Fase 6).

**Mensajería masiva WhatsApp**

* Qué hace: envía un mensaje a un segmento de clientes (ej. todos los de una ruta) anunciando producto nuevo.
* Env vars: `META\_WHATSAPP\_TOKEN`, `META\_WHATSAPP\_PHONE\_ID`.
* Instrucción para Antigravity: "Implementa POST /api/whatsapp/campanas usando la Meta Cloud API, recibiendo un filtro de clientes y un mensaje de plantilla aprobado."
* Dependencia previa: módulo de Clientes.

**Preventa**

* Qué hace: el distribuidor captura un pedido anticipado del cliente antes de surtirlo en la siguiente ruta.
* Env vars: ninguna adicional.
* Instrucción para Antigravity: "Agrega tabla `preventas` (cliente\_id, producto\_id, cantidad, ruta\_id, estado) y endpoints CRUD; al abrir la siguiente entrega de esa ruta, sugerir las cantidades de preventa pendientes."
* Dependencia previa: Rutas y Entregas.

**Terminal de pago con tarjeta**

* Qué hace: registra cobros con tarjeta como forma de pago alternativa al efectivo.
* Env vars: `PAGOS\_API\_KEY` (según proveedor de terminal que se elija).
* Instrucción para Antigravity: "Implementa POST /api/pagos/tarjeta que registre el cobro y actualice `ventas.forma\_pago = 'tarjeta'`; documentar que el proveedor de terminal cobra comisión por transacción."
* Dependencia previa: módulo de Ventas.

**Contabilidad / CFDI**

* Qué hace: genera factura para los clientes marcados con `requiere\_factura = true`.
* Env vars: credenciales del PAC de facturación que se elija (a definir).
* Instrucción para Antigravity: "Implementa POST /api/facturacion/generar que tome una venta a un cliente facturable y genere el CFDI vía el PAC configurado."
* Dependencia previa: módulo de Clientes y Ventas.

\---

# INSTRUCCIONES PARA ANTIGRAVITY

## BLOQUE 0 — Activar Ponytail

```
/ponytail full
```

## BLOQUE 1 — /speckit.constitution

```
/speckit.constitution
Este proyecto es el sistema de inventario, rutas y ventas de Aticama
Preparado para Mariscos (Nayarit). Principios:

1. Backend Express se empaqueta como función serverless en api/index.js
   dentro del mismo proyecto Vercel que el frontend. Nunca generar un
   backend/ como servicio independiente ni instrucciones de despliegue
   separadas.
2. Toda producción descuenta insumos automáticamente según receta (BOM)
   y da de alta producto terminado en la misma transacción.
3. Ningún registro se borra físicamente; toda baja es lógica (activo = false).
4. Los distribuidores solo acceden a sus propias rutas, entregas y ventas
   (RLS por rol y por distribuidor\_id).
5. Un cliente con requiere\_factura = true siempre debe tener RFC y razón
   social.
6. El cierre de una entrega calcula automáticamente la diferencia entre
   lo esperado y lo reportado por el distribuidor, y la muestra sin
   ocultarla.

Ponytail está activo. Antes de escribir cualquier código recorre su
escalera de 7 peldaños. El código debe ser el mínimo necesario, nunca más.
```

## BLOQUE 2 — /speckit.specify

```
/speckit.specify
Construir el MVP de Aticama: gestión de insumos con alertas de stock
mínimo, catálogo de productos por marca, recetas (BOM) que ligan
productos con insumos, registro de producción con descuento automático,
gestión de clientes (con clasificación de facturación), gestión de
rutas y asignación de distribuidores, apertura y cierre de entregas con
registro de ventas por cliente, y corte de ruta con cálculo de diferencia
entre lo esperado y lo reportado.

Fuera de alcance inicial (se documentan pero no se construyen todavía):
geolocalización de distribuidores, mapa de clientes, mensajería masiva
por WhatsApp, preventa/pedido anticipado, terminal de pago con tarjeta,
y módulo de contabilidad/CFDI.
```

## BLOQUE 3 — /speckit.plan

```
/speckit.plan
Stack: React 18 + Vite + TailwindCSS (frontend), Express empaquetado
como función serverless en api/index.js (backend), Supabase (Postgres +
Auth + Storage), Nodemailer + Gmail SMTP para email. Todo en un solo
proyecto Vercel con vercel.json enrutando /api/\* hacia api/index.js.

Estructura de carpetas: monorepo con api/, backend/src/
(routes, controllers, services, middleware, config) y src/ (frontend).

Fases MVP: (1) configuración monorepo + Auth, (2) Insumos, (3) Productos
y Marcas, (4) Recetas, (5) Producción, (6) Clientes, (7) Rutas +
Entregas + Ventas + Corte de ruta.
```

## BLOQUE 4 — /speckit.tasks

```
/speckit.tasks
```

## BLOQUE 5 — /speckit.implement

```
/speckit.implement
Empieza por la Fase 1 (monorepo Vercel + Supabase + Auth + tabla
perfiles). Recuerda: backend Express en api/index.js como función
serverless del mismo proyecto Vercel que el frontend; RLS activo en
todas las tablas desde el inicio; ningún borrado físico, solo baja
lógica; Ponytail activo en cada decisión de código.
```

