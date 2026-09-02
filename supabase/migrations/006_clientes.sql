-- ============================================================
-- FASE 6: Clientes y facturación
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  telefono text,
  requiere_factura boolean not null default false,
  rfc text,
  razon_social text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  
  -- Constraint Ponytail: Si requiere factura, RFC y Razón Social son obligatorios
  constraint check_datos_facturacion check (
    (requiere_factura = false) or 
    (requiere_factura = true and rfc is not null and razon_social is not null)
  )
);

alter table clientes enable row level security;

create policy "admin y ventas gestionan clientes"
  on clientes for all
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','ventas')
    )
  );

-- Los distribuidores solo verían los clientes de su ruta, pero eso se amarra
-- en la fase 7 (rutas). Por ahora, el distribuidor también necesita leerlos.
create policy "distribuidores leen clientes"
  on clientes for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol = 'distribuidor'
    )
  );
