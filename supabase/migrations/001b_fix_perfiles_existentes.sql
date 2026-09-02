-- ============================================================
-- ARREGLO URGENTE: Insertar perfil admin para usuario existente
-- Corre esto en el SQL Editor de Supabase
-- ============================================================

-- Paso 1: Ver qué usuarios existen en Auth pero NO tienen perfil
select 
  au.id,
  au.email,
  au.created_at,
  p.id as perfil_id
from auth.users au
left join public.perfiles p on p.id = au.id
where p.id is null;

-- Paso 2: Insertar perfil para todos los que no tengan (rol=admin para el primero)
-- ⚠️ Edita 'Tu Nombre Aquí' con tu nombre real antes de correr
insert into public.perfiles (id, nombre, rol)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'nombre', split_part(au.email, '@', 1)),
  'admin' -- cambia a 'ventas', 'cocina', etc. si aplica
from auth.users au
left join public.perfiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;

-- Paso 3: Verificar que se creó
select * from public.perfiles;
