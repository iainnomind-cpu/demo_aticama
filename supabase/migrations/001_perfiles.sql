-- ============================================================
-- FASE 1: perfiles (tabla de usuarios del sistema)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('admin','compras','ventas','cocina','distribuidor')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table perfiles enable row level security;

-- El usuario ve su propio perfil
create policy "usuario ve su propio perfil"
  on perfiles for select
  using (auth.uid() = id);

-- Admin ve todos los perfiles
create policy "admin ve todos los perfiles"
  on perfiles for select
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- Solo admin puede insertar/actualizar perfiles
create policy "admin gestiona perfiles"
  on perfiles for all
  using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- ============================================================
-- Trigger: crear perfil automáticamente al registrar usuario
-- (Útil para el primer admin; los demás se crean por la app)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Solo inserta si no existe ya (por si el admin lo creó manualmente)
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'rol', 'distribuidor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
