import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function EntregasPage() {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'admin' || perfil?.rol === 'ventas'

  const [entregas, setEntregas] = useState([])
  const [rutas, setRutas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [panel, setPanel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ distribuidor_id: '', ruta_id: '' })
  const [detalles, setDetalles] = useState([])
  const [nuevoProd, setNuevoProd] = useState({ producto_id: '', cantidad_asignada: 0 })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const dataEntregas = await api.get('/entregas')
      setEntregas(dataEntregas)
      if (isAdmin) {
        const [r, p] = await Promise.all([api.get('/rutas'), api.get('/productos')])
        setRutas(r); setProductos(p)
        if (r.length > 0) setForm(f => ({ ...f, ruta_id: r[0].id }))
        if (p.length > 0) setNuevoProd(n => ({ ...n, producto_id: p[0].id }))
        setForm(f => ({ ...f, distribuidor_id: perfil.id }))
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function addProd() {
    if (!nuevoProd.producto_id || nuevoProd.cantidad_asignada <= 0) return
    if (detalles.find(d => d.producto_id === nuevoProd.producto_id)) {
      setError('Ese producto ya está en la lista.'); return
    }
    setDetalles([...detalles, { ...nuevoProd }])
    setNuevoProd(n => ({ ...n, cantidad_asignada: 0 }))
  }

  function closePanel() { setPanel(false); setDetalles([]) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (detalles.length === 0) { setError('Agrega al menos un producto.'); return }
    setSaving(true); setError(null)
    try {
      await api.post('/entregas', { ...form, detalles })
      closePanel(); fetchData()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  function getProdName(id) { return productos.find(x => x.id === id)?.nombre || '?' }
  function getProdStock(id) { return productos.find(x => x.id === id)?.stock_actual ?? 0 }

  const enRuta = entregas.filter(e => e.estado === 'EN_RUTA')
  const cerradas = entregas.filter(e => e.estado !== 'EN_RUTA')

  return (
    <div className="flex flex-col h-full bg-[#f7f8fc]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Entregas y Rutas</h1>
          <p className="page-subtitle">{enRuta.length} en ruta · {cerradas.length} cerradas</p>
        </div>
        {isAdmin && (
          <button onClick={() => setPanel(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Abrir nueva entrega
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {loading ? (
            <div className="empty-state"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <>
              {/* En Ruta */}
              {enRuta.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                    <h2 className="font-semibold text-gray-700">En ruta ahora ({enRuta.length})</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enRuta.map(ent => (
                      <EntregaCard key={ent.id} ent={ent} active />
                    ))}
                  </div>
                </div>
              )}

              {/* Historial */}
              <div>
                <h2 className="font-semibold text-gray-700 mb-4">Historial de entregas</h2>
                {cerradas.length === 0 && enRuta.length === 0 ? (
                  <div className="empty-state">
                    <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10"/></svg>
                    <p className="font-medium text-gray-400">No hay entregas aún</p>
                    <p className="text-sm text-gray-300 mt-1">Abre una nueva entrega para comenzar</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="th">Ruta</th>
                          <th className="th">Distribuidor</th>
                          <th className="th">Fecha</th>
                          <th className="th">Estado</th>
                          <th className="th text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {cerradas.map(ent => (
                          <tr key={ent.id} className="tr-hover">
                            <td className="td font-medium text-gray-900">{ent.rutas?.nombre}</td>
                            <td className="td text-gray-500">{ent.perfiles?.nombre}</td>
                            <td className="td text-gray-400 text-xs">
                              {new Date(ent.created_at).toLocaleString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
                            </td>
                            <td className="td">
                              <span className="badge-neutral">{ent.estado}</span>
                            </td>
                            <td className="td text-right">
                              <Link to={`/entregas/${ent.id}`} className="text-teal-600 hover:text-teal-800 text-sm font-medium">
                                Ver corte →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Panel */}
        {panel && isAdmin && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Nueva entrega</p>
                <p className="text-xs text-gray-400">Carga del camión distribudor</p>
              </div>
              <button onClick={closePanel} className="btn-icon">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="label">Ruta asignada *</label>
                {rutas.length === 0
                  ? <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">Primero crea una ruta en el módulo de Rutas.</p>
                  : <select className="input" value={form.ruta_id} onChange={e => setForm({...form, ruta_id: e.target.value})}>
                      {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="label mb-3">Carga de productos ({detalles.length} artículos)</p>
                <div className="flex gap-2 mb-3">
                  <select className="input-sm flex-1" value={nuevoProd.producto_id} onChange={e => setNuevoProd({...nuevoProd, producto_id: e.target.value})}>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual})</option>)}
                  </select>
                  <input className="input-sm w-20" type="number" min="1" placeholder="Cant." value={nuevoProd.cantidad_asignada || ''}
                    onChange={e => setNuevoProd({...nuevoProd, cantidad_asignada: Number(e.target.value)})} />
                  <button type="button" onClick={addProd} className="btn-primary py-2 px-3 text-xs">+</button>
                </div>

                {detalles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                    {detalles.map((d, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{getProdName(d.producto_id)}</p>
                          <p className="text-xs text-gray-400">Stock: {getProdStock(d.producto_id)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">{d.cantidad_asignada} u.</span>
                          <button type="button" onClick={() => setDetalles(detalles.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button type="button" onClick={closePanel} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || rutas.length === 0 || detalles.length === 0} className="btn-primary flex-1">
                {saving ? 'Abriendo...' : 'Abrir entrega'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EntregaCard({ ent, active }) {
  return (
    <div className={`card p-5 flex flex-col ${active ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{ent.rutas?.nombre}</p>
          <p className="text-xs text-gray-400 mt-0.5">{ent.perfiles?.nombre}</p>
        </div>
        {active
          ? <span className="badge-success">🟢 En ruta</span>
          : <span className="badge-neutral">{ent.estado}</span>}
      </div>

      <div className="flex-1 space-y-1 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Carga</p>
        {ent.entrega_detalle?.slice(0, 4).map(d => (
          <div key={d.id} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate">{d.productos?.nombre}</span>
            <span className="font-medium text-gray-800 ml-2 flex-shrink-0">{d.cantidad_asignada} u.</span>
          </div>
        ))}
        {ent.entrega_detalle?.length > 4 && <p className="text-xs text-gray-400">+{ent.entrega_detalle.length - 4} más</p>}
      </div>

      <Link
        to={`/entregas/${ent.id}`}
        className={`block text-center w-full py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
      >
        {active ? 'Gestionar entrega →' : 'Ver corte'}
      </Link>
    </div>
  )
}
