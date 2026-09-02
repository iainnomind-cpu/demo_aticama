import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'

export default function RutasPage() {
  const { perfil } = useAuth()
  const canEdit = perfil?.rol === 'admin' || perfil?.rol === 'ventas'

  const [rutas, setRutas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [panel, setPanel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombreRuta, setNombreRuta] = useState('')
  const [clientesSel, setClientesSel] = useState([])
  const [searchCliente, setSearchCliente] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [r, c] = await Promise.all([api.get('/rutas'), api.get('/clientes')])
      setRutas(r); setClientes(c)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function toggleCliente(id) {
    setClientesSel(s => s.includes(id) ? s.filter(c => c !== id) : [...s, id])
  }

  function closePanel() { setPanel(false); setNombreRuta(''); setClientesSel([]); setSearchCliente('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.post('/rutas', { nombre: nombreRuta, clientes: clientesSel })
      closePanel(); fetchData()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Dar de baja esta ruta?')) return
    try { await api.delete(`/rutas/${id}`); fetchData() }
    catch (e) { setError(e.message) }
  }

  const filteredClientes = clientes.filter(c => c.nombre.toLowerCase().includes(searchCliente.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-[#f7f8fc]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Rutas</h1>
          <p className="page-subtitle">{rutas.length} rutas configuradas</p>
        </div>
        {canEdit && (
          <button onClick={() => setPanel(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nueva ruta
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
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="empty-state"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : rutas.length === 0 ? (
            <div className="empty-state">
              <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
              <p className="font-medium text-gray-400">No hay rutas configuradas</p>
              <p className="text-sm text-gray-300 mt-1">Crea la primera usando el botón de arriba</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rutas.map(ruta => (
                <div key={ruta.id} className="card p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0f1e3d]/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#0f1e3d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{ruta.nombre}</p>
                        <p className="text-xs text-gray-400">{ruta.ruta_clientes?.length || 0} clientes</p>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDelete(ruta.id)} className="btn-icon hover:!text-red-500 hover:!bg-red-50" title="Dar de baja">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Clientes en ruta</p>
                    {ruta.ruta_clientes?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {ruta.ruta_clientes.slice(0, 6).map(rc => (
                          <span key={rc.cliente_id} className="badge-neutral text-xs">{rc.clientes?.nombre}</span>
                        ))}
                        {ruta.ruta_clientes.length > 6 && (
                          <span className="badge-neutral text-xs">+{ruta.ruta_clientes.length - 6} más</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 italic">Sin clientes asignados</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel */}
        {panel && canEdit && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Nueva ruta</p>
                <p className="text-xs text-gray-400">Asigna clientes a esta ruta</p>
              </div>
              <button onClick={closePanel} className="btn-icon">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="label">Nombre de la ruta *</label>
                <input className="input" required value={nombreRuta} placeholder="Ej. Ruta Tepic Centro" onChange={e => setNombreRuta(e.target.value)} />
              </div>

              <div>
                <label className="label">Clientes asignados ({clientesSel.length} seleccionados)</label>
                <div className="search-bar mb-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
                  <input className="bg-transparent outline-none flex-1 text-gray-700 text-sm" placeholder="Filtrar clientes..." value={searchCliente} onChange={e => setSearchCliente(e.target.value)} />
                </div>
                <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {filteredClientes.map(c => (
                    <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${clientesSel.includes(c.id) ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${clientesSel.includes(c.id) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}`}>
                        {clientesSel.includes(c.id) && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7-1-1z"/></svg>}
                      </div>
                      <input type="checkbox" className="sr-only" checked={clientesSel.includes(c.id)} onChange={() => toggleCliente(c.id)} />
                      <span className="text-sm text-gray-800 truncate">{c.nombre}</span>
                    </label>
                  ))}
                  {filteredClientes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button type="button" onClick={closePanel} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || !nombreRuta} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Crear ruta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
