import { createClient } from '@supabase/supabase-js'

// Usa la SERVICE_ROLE_KEY para operaciones del servidor (bypasea RLS cuando sea necesario)
// Para operaciones del usuario se usa el JWT del request
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default supabase
