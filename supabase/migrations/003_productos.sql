-- ============================================================
-- FASE 3: marcas y productos (producto terminado)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table marcas enable row level security;

create policy "usuarios autenticados leen marcas"
  on marcas for select
  using (auth.role() = 'authenticated');
  
create policy "admin cocina escriben marcas"
  on marcas for all
  using (
    exists (
      select 1 from perfiles p 
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );

-- ============================================================

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references marcas(id),
  nombre text not null,
  codigo_barras text unique,
  precio_venta numeric not null default 0 check (precio_venta >= 0),
  stock_actual numeric not null default 0 check (stock_actual >= 0),
  stock_minimo numeric not null default 0 check (stock_minimo >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table productos enable row level security;

create policy "admin ventas cocina compras leen productos"
  on productos for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','ventas','cocina','compras')
    )
  );

create policy "admin cocina gestionan productos"
  on productos for all
  using (
    exists (
      select 1 from perfiles p 
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );
