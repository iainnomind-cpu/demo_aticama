# Feature Specification: Aticama MVP

**Feature Branch**: `001-aticama-mvp`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Construir el MVP de Aticama: gestión de insumos con alertas de stock mínimo, catálogo de productos por marca, recetas (BOM) que ligan productos con insumos, registro de producción con descuento automático, gestión de clientes (con clasificación de facturación), gestión de rutas y asignación de distribuidores, apertura y cierre de entregas con registro de ventas por cliente, y corte de ruta con cálculo de diferencia entre lo esperado y lo reportado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión de Inventario Base y Producción (Priority: P1)

Como personal de cocina/compras, quiero registrar insumos, crear productos terminados, definir sus recetas (BOM) y registrar la producción diaria para que los insumos se descuenten automáticamente y el stock de producto terminado se incremente sin errores humanos.

**Why this priority**: Es el corazón del negocio de Aticama. Si no hay control de lo que se produce y lo que cuesta en insumos, el resto de las operaciones no pueden ser precisas.

**Independent Test**: Can be fully tested by creating supplies, a product, linking them via a recipe, and running a production to verify exact deductions and additions to stock.

**Acceptance Scenarios**:
1. **Given** un insumo "Camarón Seco" con stock 10kg y una receta que requiere 1kg por sobre, **When** registro una producción de 2 sobres, **Then** el stock de Camarón Seco baja a 8kg y el stock de sobres sube a 2.
2. **Given** un insumo cuyo stock después de producción baja a menos de su stock mínimo, **When** termina la transacción, **Then** el sistema muestra una alerta de bajo inventario en el panel principal.

---

### User Story 2 - Gestión de Clientes y Facturación (Priority: P2)

Como personal de ventas, quiero registrar a todos los clientes (tienditas) especificando quiénes requieren factura para poder diferenciarlos y validar que no falten datos fiscales si piden factura.

**Why this priority**: Es fundamental para organizar a quién se le vende y tener certeza fiscal para cumplir las reglas del negocio (RFC obligatorio si `requiere_factura=true`).

**Independent Test**: Can be fully tested by trying to create regular clients and clients that require invoices, verifying that missing RFCs are rejected.

**Acceptance Scenarios**:
1. **Given** la creación de un nuevo cliente que requiere factura, **When** omito el RFC, **Then** el sistema rechaza el registro.
2. **Given** un cliente guardado sin factura, **When** lo edito para que requiera factura y proveo RFC/Razón Social, **Then** se actualiza exitosamente.

---

### User Story 3 - Operación de Rutas y Entregas (Priority: P3)

Como administrador, quiero asignar rutas a mis distribuidores y abrirles una "entrega" (carga de producto) para que cada distribuidor vea solo su inventario a vender y registre sus ventas cliente por cliente en la calle.

**Why this priority**: Digitaliza la hoja de Excel y formaliza la venta directa en campo, eliminando dependencias de memoria y propiedad informal de clientes por parte de distribuidores.

**Independent Test**: Can be fully tested by logging in as a distributor, checking that only assigned routes/deliveries are visible, and recording sales against them.

**Acceptance Scenarios**:
1. **Given** el distribuidor Carlos con la Ruta Norte, **When** inicia sesión, **Then** solo ve a los clientes de la Ruta Norte y su entrega actual.
2. **Given** una entrega abierta con 50 sobres, **When** el distribuidor registra la venta de 10 sobres, **Then** le quedan 40 por vender/devolver.

---

### User Story 4 - Reconciliación y Corte de Ruta (Priority: P4)

Como administrador, quiero cerrar la entrega de un distribuidor que regresa de ruta, calcular lo que vendió, lo que devolvió y cruzar el efectivo reportado contra el esperado para ver faltantes o sobrantes.

**Why this priority**: Elimina el riesgo del manejo de efectivo y la desconfianza; proporciona métricas claras y directas de las finanzas del negocio por día/ruta.

**Independent Test**: Can be fully tested by closing a delivery and verifying the math difference between the expected total from sales minus the reported cash.

**Acceptance Scenarios**:
1. **Given** una entrega con ventas por $1,000, **When** se hace el corte y el distribuidor reporta $950, **Then** el sistema muestra una diferencia (faltante) de -$50.

---

### Edge Cases

- ¿Qué pasa si se intenta registrar una producción, pero el inventario actual de los insumos es insuficiente? El sistema debe bloquear la transacción o alertar (según la regla: no permitir inventario negativo).
- ¿Qué pasa si un distribuidor se da de baja? Sus registros de ventas se mantienen, pero su perfil se inactiva (baja lógica).
- ¿Qué pasa con los módulos fuera de alcance (geolocalización, whatsapp, terminal de pago, contabilidad)? Se crearán placeholders o se documentará su futura adición, pero el MVP no dependerá de ellos para funcionar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir crear, leer, actualizar y desactivar (CRUD lógico) Insumos, Productos, Recetas, y Clientes.
- **FR-002**: El sistema DEBE descontar automáticamente de la tabla `insumos` al registrar una entrada en `producciones` basándose en `receta_insumos`.
- **FR-003**: El sistema DEBE impedir la creación de un cliente con `requiere_factura = true` si no se proporcionan el `rfc` y la `razon_social`.
- **FR-004**: El sistema DEBE filtrar la visibilidad de datos para que un usuario con rol `distribuidor` solo pueda ver y modificar registros asociados a su `distribuidor_id`.
- **FR-005**: El sistema DEBE generar un cálculo automático en `cortes_ruta` que muestre `diferencia = total_reportado - total_esperado`.
- **FR-006**: El sistema DEBE registrar todo cambio de inventario (MP y PT) en una bitácora central `movimientos_inventario`.

### Key Entities

- **Insumos**: Materia prima con stock mínimo y costo.
- **Productos**: Producto terminado para venta, asociado a una marca.
- **Recetas**: Lista de materiales (BOM) que liga insumos con productos.
- **Clientes**: Información de contacto y fiscal.
- **Rutas**: Zonas geográficas asignadas a distribuidores.
- **Entregas**: Instancia de carga de producto para una ruta específica en una fecha determinada.
- **Ventas**: Transacciones monetarias asociadas a una entrega y un cliente.
- **Cortes de Ruta**: Registro final de reconciliación monetaria de una entrega.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El personal de cocina puede registrar una producción de 100 sobres y los inventarios se ajustan en menos de 5 segundos.
- **SC-002**: El administrador tiene visibilidad instantánea del inventario teórico vs físico de cada distribuidor en ruta.
- **SC-003**: El corte de ruta se calcula en un solo clic, mostrando la discrepancia exacta al finalizar la entrega diaria, eliminando el cuadre manual en Excel.

## Assumptions

- No se construirán interfaces para los módulos opcionales (Geolocalización, WhatsApp, Preventa, CFDI, Terminal de Pago) hasta que el MVP básico esté operativo y validado.
- Los distribuidores tendrán conexión a internet (3G/4G) durante sus rutas para operar la aplicación.
- El rol "Administrador" (o el dueño) es el único con la facultad de dar de alta o asignar distribuidores y crear perfiles.
