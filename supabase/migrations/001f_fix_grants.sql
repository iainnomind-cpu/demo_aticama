-- ============================================================
-- SCRIPT: Arreglar permisos base de la tabla perfiles
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Por alguna razón la tabla perdió los permisos base de Supabase.
-- Se los devolvemos a los roles estándar:
GRANT ALL PRIVILEGES ON TABLE public.perfiles TO postgres, authenticated, anon, service_role;

-- También debemos asegurarnos de que la función que creamos antes pueda ser ejecutada
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
