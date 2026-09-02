import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/apiClient'
import { Link } from 'react-router-dom'

function KpiCard({ label, value, sub, colorBg, colorIcon, icon }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorBg}`}>
        <div className={colorIcon}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const ACCESOS = {
  admin:       [
    { label: 'Registrar Insumo',   path: '/insumos',    color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
    { label: 'Ver Productos',      path: '/productos',  color: 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100' },
    { label: 'Nueva Producción',   path: '/produccion', color: 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100' },
    { label: 'Gestionar Clientes', path: '/clientes',   color: 'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100' },
    { label: 'Abrir Ruta',         path: '/entregas',   color: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' },
    { label: 'Configurar Rutas',   path: '/rutas',      color: 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100' },
  ],
  compras: [
    { label: 'Ver Insumos', path: '/insumos', color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
  ],
  cocina: [
    { label: 'Ver Insumos',      path: '/insumos',    color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
    { label: 'Ver Recetas',      path: '/recetas',    color: 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100' },
    { label: 'Nueva Producción', path: '/produccion', color: 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100' },
  ],
  ventas: [
    { label: 'Ver Clientes', path: '/clientes', color: 'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100' },
    { label: 'Abrir Ruta',   path: '/entregas', color: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' },
    { label: 'Rutas',        path: '/rutas',    color: 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100' },
  ],
  distribuidor: [
    { label: 'Mi Entrega Activa', path: '/entregas', color: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' },
  ],
}

export default function DashboardPage() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState({ insumos: null, productos: null, clientes: null, entregas: null })
  const [alertas, setAlertas] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [perfilMissing, setPerfilMissing] = useState(false)

  const rol = perfil?.rol
  const accesos = ACCESOS[rol] ?? []

  // Detectar si el perfil no está configurado tras 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!perfil) setPerfilMissing(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [perfil])

  useEffect(() => {
    // Intentar cargar siempre — el backend/RLS devuelve lo permitido
    async function load() {
      setLoadingStats(true)
      try {
        const results = await Promise.allSettled([
          api.get('/insumos'),
          api.get('/productos'),
          api.get('/clientes'),
          api.get('/entregas'),
        ])

        const [ins, prod, cli, ent] = results.map(r => r.status === 'fulfilled' ? r.value : null)

        const bajos = ins ? ins.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo)) : []

        setStats({
          insumos:  ins  ? ins.length  : null,
          productos: prod ? prod.length : null,
          clientes:  cli  ? cli.length  : null,
          entregas:  ent  ? ent.filter(e => e.estado === 'EN_RUTA').length : null,
        })
        setAlertas(bajos)
      } catch (_) {}
      finally { setLoadingStats(false) }
    }

    // Esperar a que perfil esté disponible O que hayan pasado 2s (intento igual)
    const delay = perfil ? 0 : 2000
    const timer = setTimeout(load, delay)
    return () => clearTimeout(timer)
  }, [perfil])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = perfil?.nombre?.split(' ')[0]

  const fmt = (v) => v === null ? '—' : loadingStats ? '…' : v

  return (
    <div className="p-7 max-w-6xl">
      {/* Banner de alerta si falta perfil */}
      {perfilMissing && !perfil && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Perfil de usuario no configurado</p>
            <p className="text-xs text-amber-600 mt-1">
              Tu usuario no tiene un perfil en la tabla <code className="bg-amber-100 px-1 rounded">perfiles</code>.
              Corre el script <strong>001b_fix_perfiles_existentes.sql</strong> en el SQL Editor de Supabase y recarga la página.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {saludo}{nombre ? `, ${nombre}` : ''} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Insumos registrados" value={fmt(stats.insumos)} sub="materias primas activas"
          colorBg="bg-blue-50" colorIcon="text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>}
        />
        <KpiCard
          label="Productos terminados" value={fmt(stats.productos)} sub="en catálogo activo"
          colorBg="bg-violet-50" colorIcon="text-violet-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg>}
        />
        <KpiCard
          label="Clientes activos" value={fmt(stats.clientes)} sub="en el directorio"
          colorBg="bg-teal-50" colorIcon="text-teal-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <KpiCard
          label="Rutas en camino" value={fmt(stats.entregas)} sub="entregas abiertas hoy"
          colorBg="bg-green-50" colorIcon="text-green-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos Rápidos */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acceso rápido</h2>
          {accesos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              {!rol
                ? 'Los accesos rápidos aparecerán una vez que tu perfil esté configurado.'
                : 'No hay accesos configurados para tu rol.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {accesos.map(a => (
                <Link
                  key={a.label}
                  to={a.path}
                  className={`flex items-center justify-between p-4 rounded-xl border font-medium text-sm transition ${a.color}`}
                >
                  {a.label}
                  <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de Stock */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Alertas de stock</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingStats ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <div className="animate-pulse flex justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <p className="mt-2 text-xs">Consultando inventario…</p>
              </div>
            ) : alertas.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">¡Todo en orden!</p>
                <p className="text-xs text-gray-400 mt-1">Stock suficiente en todos los insumos</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-xs font-semibold text-red-600">{alertas.length} insumo{alertas.length !== 1 ? 's' : ''} con stock bajo</p>
                </div>
                <ul className="divide-y divide-gray-50">
                  {alertas.slice(0, 6).map(i => (
                    <li key={i.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{i.nombre}</p>
                        <p className="text-xs text-gray-400">{i.unidad_medida}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-red-500">{i.stock_actual}</span>
                        <p className="text-[10px] text-gray-400">mín. {i.stock_minimo}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
                  <Link to="/insumos" className="text-xs text-blue-600 hover:underline font-medium">Ver todos los insumos →</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
