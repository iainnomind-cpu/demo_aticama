import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Mapa de módulos por rol
const NAV_ROL = {
  admin:       ['insumos', 'productos', 'recetas', 'produccion', 'clientes', 'rutas', 'entregas'],
  compras:     ['insumos'],
  cocina:      ['insumos', 'recetas', 'produccion'],
  ventas:      ['clientes', 'rutas', 'entregas'],
  distribuidor:['entregas'],
}

const NAV_CONFIG = {
  insumos:    { label: 'Insumos',    icon: <IconInsumos />,    path: '/insumos' },
  productos:  { label: 'Productos',  icon: <IconProductos />,  path: '/productos' },
  recetas:    { label: 'Recetas',    icon: <IconRecetas />,    path: '/recetas' },
  produccion: { label: 'Producción', icon: <IconProduccion />, path: '/produccion' },
  clientes:   { label: 'Clientes',   icon: <IconClientes />,   path: '/clientes' },
  rutas:      { label: 'Rutas',      icon: <IconRutas />,      path: '/rutas' },
  entregas:   { label: 'Entregas',   icon: <IconEntregas />,   path: '/entregas' },
}

const ROL_BADGE = {
  admin:       { label: 'Administrador', color: 'bg-violet-500' },
  compras:     { label: 'Compras',       color: 'bg-amber-500' },
  cocina:      { label: 'Cocina',        color: 'bg-orange-500' },
  ventas:      { label: 'Ventas',        color: 'bg-blue-500' },
  distribuidor:{ label: 'Distribuidor',  color: 'bg-teal-500' },
}

export default function AppLayout({ children }) {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()

  const modulos = (NAV_ROL[perfil?.rol] ?? []).map(k => NAV_CONFIG[k])
  const badge = ROL_BADGE[perfil?.rol] ?? { label: perfil?.rol, color: 'bg-gray-500' }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f4f6f9] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-60 flex-shrink-0 bg-[#0f1e3d] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#0f1e3d]" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">Aticama</p>
              <p className="text-white/40 text-[10px] mt-0.5">Mariscos Nayarit</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Dashboard link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <IconDashboard />
            Dashboard
          </NavLink>

          {modulos.length > 0 && (
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Módulos</p>
            </div>
          )}

          {modulos.map(mod => (
            <NavLink
              key={mod.path}
              to={mod.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {mod.icon}
              {mod.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-400/20 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-400 font-bold text-sm">
                {perfil?.nombre?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{perfil?.nombre ?? '—'}</p>
              <span className={`inline-block text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-white/40 hover:text-red-400 text-xs transition-colors py-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

// ── ICON COMPONENTS ──
function IconDashboard() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function IconInsumos() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
    </svg>
  )
}
function IconProductos() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
    </svg>
  )
}
function IconRecetas() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>
  )
}
function IconProduccion() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
    </svg>
  )
}
function IconClientes() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  )
}
function IconRutas() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
    </svg>
  )
}
function IconEntregas() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
    </svg>
  )
}
