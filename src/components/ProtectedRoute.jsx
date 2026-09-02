import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Protege rutas privadas.
 * Si no hay sesión activa, redirige al login.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
