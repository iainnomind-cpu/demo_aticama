-- ============================================================
-- FASE 5: Producción y Movimientos de Inventario
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists producciones (
  id uuid primary key default gen_random_uuid(),
  receta_id uuid not null references recetas(id),
  producto_id uuid not null references productos(id),
  usuario_id uuid not null references perfiles(id),
  cantidad_producida numeric not null check (cantidad_producida > 0),
  costo_total numeric not null default 0,
  notas text,
  created_at timestamptz not null default now()
);

alter table producciones enable row level security;

create policy "lectura de producciones"
  on producciones for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );

create policy "insercion de producciones"
  on producciones for insert
  with check (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );

-- ============================================================

create table if not exists movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  tipo_movimiento text not null check (tipo_movimiento in ('ENTRADA', 'SALIDA', 'AJUSTE', 'PRODUCCION')),
  entidad_tipo text not null check (entidad_tipo in ('INSUMO', 'PRODUCTO')),
  entidad_id uuid not null, -- ID del insumo o producto
  cantidad numeric not null,
  referencia_id uuid, -- ID de la producción, venta, compra, etc.
  usuario_id uuid not null references perfiles(id),
  notas text,
  created_at timestamptz not null default now()
);

alter table movimientos_inventario enable row level security;

create policy "lectura de movimientos"
  on movimientos_inventario for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','compras','cocina','ventas')
    )
  );
  
create policy "insercion de movimientos"
  on movimientos_inventario for insert
  with check (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','compras','cocina','ventas')
    )
  );
