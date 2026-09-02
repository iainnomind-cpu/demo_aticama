# Task Breakdown: Aticama MVP

## Context

- **Feature Branch**: `001-aticama-mvp`
- **Spec Reference**: `specs/001-aticama-mvp/spec.md`
- **Plan Reference**: `specs/001-aticama-mvp/plan.md`

## Phase 1: Configuración monorepo + Auth

- [ ] **Task 1.1**: Inicializar la aplicación React con Vite y configurar TailwindCSS. (`package.json`, `tailwind.config.js`)
- [ ] **Task 1.2**: Crear la estructura básica del backend Express en `backend/src/app.js` y el handler serverless en `api/index.js`.
- [ ] **Task 1.3**: Crear `vercel.json` configurando los rewrites para que `/api/*` apunte a `api/index.js`.
- [ ] **Task 1.4**: Configurar el cliente de Supabase (frontend y backend) e inicializar la tabla `perfiles` con su esquema RLS en Supabase.
- [ ] **Task 1.5**: Implementar auth middleware en Express (`backend/src/middleware/authMiddleware.js`) para validar JWT de Supabase.

*Checkpoint Phase 1*: La app levanta localmente. Peticiones al frontend responden React. Peticiones a `/api/` responden JSON desde Express.

## Phase 2: Insumos

- [ ] **Task 2.1**: Crear tabla `insumos` en Supabase con sus políticas RLS (lectura/escritura para compras, admin, cocina).
- [ ] **Task 2.2**: Implementar backend CRUD para insumos (`backend/src/routes/insumos_routes.js`, `insumos_controller.js`).
- [ ] **Task 2.3**: Implementar vista frontend `InsumosPage.jsx` para el catálogo.
- [ ] **Task 2.4**: Agregar la lógica de alerta visual en frontend si el `stock_actual` de un insumo está debajo del `stock_minimo`.

*Checkpoint Phase 2*: Se pueden listar, crear, editar y "dar de baja" insumos. Las alertas de stock mínimo funcionan.

## Phase 3: Productos y Marcas

- [ ] **Task 3.1**: Crear tablas `marcas` y `productos` en Supabase con RLS.
- [ ] **Task 3.2**: Implementar backend CRUD para marcas y productos.
- [ ] **Task 3.3**: Implementar vistas frontend `ProductosPage.jsx` (y un pequeño selector/administrador de marcas).

*Checkpoint Phase 3*: Se pueden listar y crear productos asociados a sus marcas.

## Phase 4: Recetas (BOM)

- [ ] **Task 4.1**: Crear tablas `recetas` y `receta_insumos` en Supabase con RLS.
- [ ] **Task 4.2**: Implementar backend endpoints para crear recetas, incluyendo validación transaccional (insertar líneas de ingredientes).
- [ ] **Task 4.3**: Implementar `RecetasPage.jsx` en frontend para asociar un producto con varios insumos y sus cantidades.

*Checkpoint Phase 4*: Es posible configurar una lista de materiales (receta) para cada producto terminado.

## Phase 5: Producción

- [ ] **Task 5.1**: Crear tablas `producciones` y `movimientos_inventario` en Supabase con RLS.
- [ ] **Task 5.2**: Implementar controlador de producción (`produccion_controller.js`). Al recibir una cantidad producida, el sistema debe descontar insumos, aumentar el stock del producto, y escribir los movimientos de inventario en una transacción/proceso atómico.
- [ ] **Task 5.3**: Implementar frontend `ProduccionPage.jsx` para capturar cantidad producida y validar (en UI y BD) si no hay insumos suficientes.

*Checkpoint Phase 5*: Realizar una producción descuenta los insumos correctamente, incrementa el producto final, y previene saldos negativos.

## Phase 6: Clientes

- [ ] **Task 6.1**: Crear tabla `clientes` en Supabase, incluyendo el constraint `CHECK` para requerir RFC/Razón social si `requiere_factura` es true, más el RLS.
- [ ] **Task 6.2**: Implementar backend CRUD para clientes (`clientes_controller.js`).
- [ ] **Task 6.3**: Implementar frontend `ClientesPage.jsx` con formulario dinámico (los campos RFC aparecen y son obligatorios solo si la casilla factura está marcada).

*Checkpoint Phase 6*: Se pueden crear y listar clientes validando sus reglas fiscales.

## Phase 7: Rutas, Entregas, Ventas y Corte

- [ ] **Task 7.1**: Crear tablas `rutas`, `ruta_clientes`, `entregas`, `entrega_detalle`, `ventas` y `cortes_ruta` con RLS restrictivo por `distribuidor_id`.
- [ ] **Task 7.2**: Implementar endpoints de administración de rutas y asignación de clientes a rutas (`rutas_controller.js`).
- [ ] **Task 7.3**: Implementar apertura de `entrega` (carga de producto al distribuidor).
- [ ] **Task 7.4**: Implementar frontend para el distribuidor, donde solo vea sus entregas actuales y los clientes de su ruta.
- [ ] **Task 7.5**: Implementar endpoint `POST /api/entregas/:id/ventas` para registrar ventas y `PUT` para devoluciones.
- [ ] **Task 7.6**: Implementar el proceso de `Corte de Ruta` (`POST /api/entregas/:id/cerrar`), que genera el resumen esperado vs. reportado en `cortes_ruta`.
- [ ] **Task 7.7**: Implementar vista `CorteRutaPage.jsx` para que el administrador revise la discrepancia monetaria.

*Checkpoint Phase 7*: Un distribuidor puede salir a ruta digitalmente, vender a un cliente, reportar su dinero al volver y el administrador cuadrar la diferencia sin problemas. MVP Terminado.
