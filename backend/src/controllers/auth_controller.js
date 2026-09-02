import supabase from '../config/supabaseClient.js'

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: error.message })

  // Recuperar perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo')
    .eq('id', data.user.id)
    .single()

  res.json({
    access_token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email, perfil },
  })
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  await supabase.auth.signOut()
  res.json({ message: 'Sesión cerrada' })
}

/**
 * GET /api/auth/me
 * Requiere authMiddleware
 */
export function me(req, res) {
  res.json({ user: req.user.perfil })
}
