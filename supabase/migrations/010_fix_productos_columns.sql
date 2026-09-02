-- ============================================================
-- SCRIPT DE REPARACIÓN: Completar tabla productos
-- ============================================================

DO $$
BEGIN
    -- 1. Agregar marca_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='productos' AND column_name='marca_id') THEN
        
        -- Opcional: Insertar una marca genérica si la tabla marcas está vacía para evitar errores
        INSERT INTO public.marcas (nombre) VALUES ('Generica') ON CONFLICT (nombre) DO NOTHING;
        
        ALTER TABLE public.productos ADD COLUMN marca_id uuid;
        
        -- Asignar la primera marca disponible a los productos existentes (si los hay)
        UPDATE public.productos SET marca_id = (SELECT id FROM public.marcas LIMIT 1) WHERE marca_id IS NULL;
        
        -- Ahora sí la hacemos NOT NULL
        ALTER TABLE public.productos ALTER COLUMN marca_id SET NOT NULL;
        
        -- Agregar el constraint
        ALTER TABLE public.productos ADD CONSTRAINT productos_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id) ON DELETE RESTRICT;
    END IF;

    -- 2. Asegurar que codigo_barras exista
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='productos' AND column_name='codigo_barras') THEN
        ALTER TABLE public.productos ADD COLUMN codigo_barras text unique;
    END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
