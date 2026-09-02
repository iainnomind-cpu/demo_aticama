-- ============================================================
-- FASE 7: Rutas, Entregas, Ventas y Cortes
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. RUTAS (Agrupaciones lógicas de zonas)
create table if not exists rutas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table rutas enable row level security;
create policy "acceso general rutas" on rutas for select using (true);
create policy "admin ventas gestionan rutas" on rutas for all using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
);

-- 2. CLIENTES POR RUTA
create table if not exists ruta_clientes (
  ruta_id uuid not null references rutas(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  orden integer not null default 0,
  primary key (ruta_id, cliente_id)
);

alter table ruta_clientes enable row level security;
create policy "acceso general ruta_clientes" on ruta_clientes for select using (true);
create policy "admin ventas gestionan ruta_clientes" on ruta_clientes for all using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
);

-- 3. ENTREGAS (Carga de producto a un distribuidor para salir a vender)
create table if not exists entregas (
  id uuid primary key default gen_random_uuid(),
  distribuidor_id uuid not null references perfiles(id),
  ruta_id uuid not null references rutas(id),
  estado text not null check (estado in ('EN_RUTA', 'CERRADA')),
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz,
  abierta_por uuid not null references perfiles(id), -- Admin/Ventas que le dio el producto
  cerrada_por uuid references perfiles(id),
  created_at timestamptz not null default now()
);

alter table entregas enable row level security;
-- Distribuidor solo ve sus propias entregas; Admin/Ventas ven todas.
create policy "distribuidor ve sus entregas y admin todas" on entregas for select using (
  distribuidor_id = auth.uid() or 
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
);
create policy "admin ventas insertan entregas" on entregas for all using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
);

-- 4. DETALLE DE ENTREGA (Cuánto producto se le cargó)
create table if not exists entrega_detalle (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references entregas(id) on delete cascade,
  producto_id uuid not null references productos(id),
  cantidad_asignada numeric not null check (cantidad_asignada > 0),
  cantidad_devuelta numeric not null default 0 check (cantidad_devuelta >= 0),
  cantidad_vendida numeric not null default 0 check (cantidad_vendida >= 0),
  created_at timestamptz not null default now()
);

alter table entrega_detalle enable row level security;
create policy "lectura detalle entrega" on entrega_detalle for select using (
  exists (
    select 1 from entregas e 
    where e.id = entrega_detalle.entrega_id and (
      e.distribuidor_id = auth.uid() or 
      exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
    )
  )
);

-- 5. VENTAS (Ticket de venta a un cliente de la ruta)
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references entregas(id),
  cliente_id uuid not null references clientes(id),
  producto_id uuid not null references productos(id),
  cantidad numeric not null check (cantidad > 0),
  precio_unitario numeric not null,
  total numeric not null,
  notas text,
  created_at timestamptz not null default now()
);

alter table ventas enable row level security;
create policy "distribuidor ve y crea sus ventas, admin ve todas" on ventas for select using (
  exists (
    select 1 from entregas e 
    where e.id = ventas.entrega_id and (
      e.distribuidor_id = auth.uid() or 
      exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
    )
  )
);
create policy "distribuidor crea ventas" on ventas for insert with check (
  exists (
    select 1 from entregas e 
    where e.id = ventas.entrega_id and e.distribuidor_id = auth.uid() and e.estado = 'EN_RUTA'
  )
);

-- 6. CORTES DE RUTA (Liquidación de la entrega)
create table if not exists cortes_ruta (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null unique references entregas(id),
  total_ventas_esperado numeric not null default 0,
  efectivo_entregado numeric not null default 0,
  diferencia numeric not null default 0, -- negativo es faltante, positivo es sobrante
  notas_cierre text,
  created_at timestamptz not null default now()
);

alter table cortes_ruta enable row level security;
create policy "distribuidor ve su corte, admin todos" on cortes_ruta for select using (
  exists (
    select 1 from entregas e 
    where e.id = cortes_ruta.entrega_id and (
      e.distribuidor_id = auth.uid() or 
      exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
    )
  )
);
create policy "admin ventas crean cortes" on cortes_ruta for all using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin','ventas'))
);
