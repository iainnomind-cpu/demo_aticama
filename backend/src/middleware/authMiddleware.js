import { createClient } from '@supabase/supabase-js'

/**
 * Verifica el JWT del header Authorization y adjunta el usuario al request.
 * El JWT lo emite Supabase Auth; lo verificamos creando un cliente scoped al token.
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]

  // Cliente scoped al token del usuario (respeta RLS de Supabase)
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

  const { data: { user }, error } = await supabaseUser.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  // Recuperar perfil con rol
  const { data: perfil, error: perfilError } = await supabaseUser
    .from('perfiles')
    .select('id, nombre, rol, activo')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) {
    return res.status(403).json({ error: 'Perfil no encontrado' })
  }

  if (!perfil.activo) {
    return res.status(403).json({ error: 'Usuario inactivo' })
  }

  req.user = { ...user, perfil, supabaseUser }
  next()
}
