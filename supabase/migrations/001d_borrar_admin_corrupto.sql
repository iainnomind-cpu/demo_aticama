-- ============================================================
-- SCRIPT DE LIMPIEZA: Eliminar usuario corrupto
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Borrar identidades (por si acaso el cascade fallara)
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@aticama.com'
);

-- Borrar de perfiles
DELETE FROM public.perfiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@aticama.com'
);

-- Borrar el usuario corrupto directamente desde la tabla
DELETE FROM auth.users 
WHERE email = 'admin@aticama.com';
