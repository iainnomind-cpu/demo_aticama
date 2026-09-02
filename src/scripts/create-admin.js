// SCRIPT: create-admin.js
// Ejecuta esto con: node src/scripts/create-admin.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function run() {
  console.log('Creando usuario admin@aticama.com...')
  
  // 1. Crear el usuario mediante la API (Supabase maneja las tablas internas correctamente)
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@gmail.com',
    password: 'admin123',
    options: {
      data: {
        nombre: 'Admin Aticama',
        rol: 'admin' // Nuestro trigger lo leerá y asignará este rol
      }
    }
  })

  if (error) {
    console.error('Error creando usuario:', error.message)
    return
  }

  console.log('✅ Usuario creado exitosamente!')
  console.log('ID:', data.user.id)
}

run()
