-- ============================================================
-- FASE 4: recetas y receta_insumos (BOM)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists recetas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id),
  nombre text not null,
  descripcion text,
  rendimiento numeric not null default 1 check (rendimiento > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table recetas enable row level security;

create policy "lectura de recetas"
  on recetas for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );

create policy "escritura de recetas"
  on recetas for all
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );

-- ============================================================

create table if not exists receta_insumos (
  id uuid primary key default gen_random_uuid(),
  receta_id uuid not null references recetas(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  cantidad_requerida numeric not null check (cantidad_requerida > 0),
  created_at timestamptz not null default now()
);

alter table receta_insumos enable row level security;

create policy "lectura de receta_insumos"
  on receta_insumos for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );

create policy "escritura de receta_insumos"
  on receta_insumos for all
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','cocina')
    )
  );
