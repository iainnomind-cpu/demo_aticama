# Aticama Preparado para Mariscos Constitution

## Core Principles

### I. Arquitectura Serverless Vercel
Backend Express se empaqueta como función serverless en `api/index.js` dentro del mismo proyecto Vercel que el frontend. Nunca generar un `backend/` como servicio independiente ni instrucciones de despliegue separadas. Todo debe ejecutarse desde el mismo entorno.

### II. Gestión Automática de Inventario (BOM)
Toda producción descuenta insumos automáticamente según la receta o lista de materiales (BOM) configurada y da de alta el producto terminado en la misma transacción de la base de datos para mantener integridad.

### III. Bajas Lógicas
Ningún registro se borra físicamente de la base de datos; toda baja es estrictamente lógica estableciendo la bandera `activo = false`. Esto previene la pérdida de historial y mantiene la trazabilidad ante rotación.

### IV. Privacidad y Seguridad por RLS
Los distribuidores solo acceden a sus propias rutas, entregas y ventas. Esto se garantiza implementando Row Level Security (RLS) en Supabase por rol y por `distribuidor_id`.

### V. Restricciones de Facturación
Un cliente con el indicador `requiere_factura = true` siempre debe tener RFC y razón social debidamente registrados en el sistema.

### VI. Transparencia en Cierres de Ruta
El cierre de una entrega calcula automáticamente la diferencia entre lo esperado (ventas - devoluciones) y lo reportado en efectivo por el distribuidor. Esta diferencia se muestra explícitamente sin ocultarla para propósitos de reconciliación.

## Governance

Ponytail está activo. Antes de escribir cualquier código se debe recorrer su escalera de 7 peldaños. El código generado debe ser el mínimo necesario y nunca más de lo estrictamente requerido para cumplir la especificación.

**Version**: 1.0.0 | **Ratified**: 2026-08-22
