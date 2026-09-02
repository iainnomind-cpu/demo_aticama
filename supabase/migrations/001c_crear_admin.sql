-- ============================================================
-- SCRIPT: Crear usuario admin predeterminado
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Verificar si el usuario ya existe para no duplicarlo
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@aticama.com') THEN
    RAISE NOTICE 'El usuario admin@aticama.com ya existe.';
  ELSE
    -- 2. Insertar en auth.users (la tabla de autenticación interna de Supabase)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@aticama.com',
      crypt('admin123', gen_salt('bf')), -- Contraseña encriptada por Postgres
      now(),
      '{"nombre": "Admin Aticama"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );

    -- 3. Insertar en auth.identities (obligatorio en Supabase para poder hacer login con email)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@aticama.com')::jsonb,
      'email',
      new_user_id::text, -- provider_id es requerido en versiones recientes
      now(),
      now(),
      now()
    );

    -- 4. Forzar la creación de su perfil de administrador (por si el trigger fallara)
    INSERT INTO public.perfiles (id, nombre, rol, activo)
    VALUES (new_user_id, 'Admin Aticama', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET rol = 'admin';
    
    RAISE NOTICE 'Usuario admin@aticama.com creado exitosamente.';
  END IF;
END $$;
