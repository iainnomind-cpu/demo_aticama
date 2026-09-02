-- ============================================================
-- SCRIPT MAESTRO DE REPARACIÓN DE ESQUEMA Y PERMISOS
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Asegurar que las tablas tienen todos los permisos base de lectura/escritura para usuarios logueados
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- 2. Asegurarnos que la tabla "productos" tenga la columna "precio_venta"
-- (Por si hubo un problema al correr la migración 003)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='productos' AND column_name='precio_venta') THEN
        ALTER TABLE public.productos ADD COLUMN precio_venta numeric not null default 0 check (precio_venta >= 0);
    END IF;
END
$$;

-- 3. Refrescar el caché de relaciones de Supabase (PostgREST)
-- Esto arregla el error: "Could not find a relationship between 'productos' and 'marcas' in the schema cache"
NOTIFY pgrst, 'reload schema';
