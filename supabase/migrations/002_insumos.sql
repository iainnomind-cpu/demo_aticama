-- ============================================================
-- FASE 2: insumos (materia prima)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad_medida text not null,
  stock_actual numeric not null default 0 check (stock_actual >= 0),
  stock_minimo numeric not null default 0 check (stock_minimo >= 0),
  costo_unitario numeric not null default 0 check (costo_unitario >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table insumos enable row level security;

create policy "compras cocina admin gestionan insumos"
  on insumos for all
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol in ('admin','compras','cocina')
    )
  );
