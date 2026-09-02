-- ============================================================
-- SCRIPT: Arreglar recursión infinita en políticas de perfiles
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Eliminar las políticas defectuosas
drop policy if exists "admin ve todos los perfiles" on perfiles;
drop policy if exists "admin gestiona perfiles" on perfiles;

-- Crear una función para obtener el rol saltándose el RLS
create or replace function public.get_user_role()
returns text
language sql
security definer
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

-- 1. Admin ve todos los perfiles
create policy "admin ve todos los perfiles"
  on perfiles for select
  using (
    public.get_user_role() = 'admin'
  );

-- 2. Admin gestiona perfiles
create policy "admin gestiona perfiles"
  on perfiles for all
  using (
    public.get_user_role() = 'admin'
  );
