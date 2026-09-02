/**
 * Cliente HTTP central del frontend.
 * Lee el token de sesión directamente desde el cliente de Supabase.
 */
import supabase from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  // Obtener el token directamente del cliente Supabase (forma correcta)
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? null

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  
  let data;
  try {
    data = await res.json()
  } catch (err) {
    // Si falla el parseo, probablemente el backend no está corriendo (Vite devuelve HTML/vacío)
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend (npm run dev:api)?')
  }

  if (!res.ok) throw new Error(data?.error || 'Error desconocido del servidor')
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
