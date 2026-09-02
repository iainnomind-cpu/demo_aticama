-- ============================================================
-- SCRIPT PARA RESTAURAR FOREIGN KEY
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Por si faltaba, creamos el constraint de foránea entre productos y marcas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'productos_marca_id_fkey') THEN
        ALTER TABLE public.productos 
        ADD CONSTRAINT productos_marca_id_fkey 
        FOREIGN KEY (marca_id) REFERENCES public.marcas(id) ON DELETE RESTRICT;
    END IF;
END
$$;

-- Refrescamos el caché de Supabase
NOTIFY pgrst, 'reload schema';
