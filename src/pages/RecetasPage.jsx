import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'

const EMPTY_FORM = { producto_id: '', nombre: '', descripcion: '', rendimiento: 1 }
const EMPTY_ING = { insumo_id: '', cantidad_requerida: 0 }

export default function RecetasPage() {
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [panel, setPanel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [ingredientes, setIngredientes] = useState([])
  const [nuevoIng, setNuevoIng] = useState(EMPTY_ING)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [r, p, i] = await Promise.all([api.get('/recetas'), api.get('/productos'), api.get('/insumos')])
      setRecetas(r); setProductos(p); setInsumos(i)
      if (p.length > 0) setForm(f => ({ ...f, producto_id: f.producto_id || p[0].id }))
      if (i.length > 0) setNuevoIng(n => ({ ...n, insumo_id: n.insumo_id || i[0].id }))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function openPanel() {
    setForm({ ...EMPTY_FORM, producto_id: productos[0]?.id || '' })
    setIngredientes([])
    setPanel(true)
  }
  function closePanel() { setPanel(false); setIngredientes([]); setForm(EMPTY_FORM) }

  function addIngrediente() {
    if (!nuevoIng.insumo_id || nuevoIng.cantidad_requerida <= 0) return
    if (ingredientes.find(i => i.insumo_id === nuevoIng.insumo_id)) {
      setError('Este insumo ya está en la receta.')
      return
    }
    setIngredientes([...ingredientes, { ...nuevoIng }])
    setNuevoIng({ insumo_id: insumos[0]?.id || '', cantidad_requerida: 0 })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (ingredientes.length === 0) { setError('Agrega al menos un insumo a la receta.'); return }
    setSaving(true); setError(null)
    try {
      await api.post('/recetas', { ...form, insumos_detalle: ingredientes })
      closePanel(); fetchData()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Dar de baja esta receta?')) return
    try { await api.delete(`/recetas/${id}`); fetchData() }
    catch (e) { setError(e.message) }
  }

  function getInsumoName(id) {
    const i = insumos.find(i => i.id === id)
    return i ? i.nombre : 'Desconocido'
  }
  function getInsumoUnidad(id) {
    const i = insumos.find(i => i.id === id)
    return i?.unidad_medida || ''
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f8fc]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recetas (BOM)</h1>
          <p className="page-subtitle">Listas de materiales para producción</p>
        </div>
        <button onClick={openPanel} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Nueva receta
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="empty-state"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : recetas.length === 0 ? (
            <div className="empty-state">
              <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <p className="font-medium text-gray-400">No hay recetas configuradas</p>
              <p className="text-sm text-gray-300 mt-1">Crea la primera usando el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recetas.map(receta => (
                <div key={receta.id} className="card overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === receta.id ? null : receta.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{receta.nombre}</p>
                        <p className="text-sm text-gray-400">
                          Produce <span className="text-teal-600 font-medium">{receta.rendimiento} × {receta.productos?.nombre}</span>
                          {' · '}{receta.receta_insumos?.length || 0} insumos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(receta.id) }}
                        className="btn-icon hover:!text-red-500 hover:!bg-red-50" title="Dar de baja"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === receta.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>

                  {expandedId === receta.id && (
                    <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-4">
                      {receta.descripcion && <p className="text-sm text-gray-500 mb-3 italic">{receta.descripcion}</p>}
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Insumos requeridos por lote</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {receta.receta_insumos?.map(ri => (
                          <div key={ri.id} className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                            <p className="text-xs text-gray-400">{ri.insumos?.nombre}</p>
                            <p className="font-semibold text-sm text-gray-800 mt-0.5">{ri.cantidad_requerida} <span className="font-normal text-gray-400">{ri.insumos?.unidad_medida}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slide-in Panel */}
        {panel && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Nueva receta</p>
                <p className="text-xs text-gray-400">Define los materiales necesarios</p>
              </div>
              <button onClick={closePanel} className="btn-icon">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Datos principales */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto a fabricar</p>
                <div>
                  <label className="label">Producto terminado *</label>
                  <select className="input" required value={form.producto_id} onChange={e => setForm({...form, producto_id: e.target.value})}>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nombre de la receta *</label>
                  <input className="input" required value={form.nombre} placeholder="Ej. Salsa Roja 1KG" onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
                <div>
                  <label className="label">Rendimiento (unidades) *</label>
                  <input className="input" type="number" step="any" min="0.1" required value={form.rendimiento}
                    onChange={e => setForm({...form, rendimiento: parseFloat(e.target.value)||1})} />
                  <p className="text-xs text-gray-400 mt-1">Cuántas unidades de producto genera un lote de esta receta.</p>
                </div>
                <div>
                  <label className="label">Descripción</label>
                  <textarea className="input" rows={2} value={form.descripcion} placeholder="Opcional..." onChange={e => setForm({...form, descripcion: e.target.value})} />
                </div>
              </div>

              {/* Ingredientes */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lista de materiales (insumos)</p>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="label">Insumo</label>
                    <select className="input-sm" value={nuevoIng.insumo_id} onChange={e => setNuevoIng({...nuevoIng, insumo_id: e.target.value})}>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="label">Cant.</label>
                    <input className="input-sm" type="number" step="any" min="0.01" value={nuevoIng.cantidad_requerida || ''}
                      onChange={e => setNuevoIng({...nuevoIng, cantidad_requerida: parseFloat(e.target.value)||0})} />
                  </div>
                  <button type="button" onClick={addIngrediente} className="btn-primary py-2 px-3 text-xs mb-0.5">+</button>
                </div>

                {ingredientes.length > 0 && (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    {ingredientes.map(ing => (
                      <div key={ing.insumo_id} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{getInsumoName(ing.insumo_id)}</p>
                          <p className="text-xs text-gray-400">{getInsumoUnidad(ing.insumo_id)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm text-gray-800">{ing.cantidad_requerida}</span>
                          <button type="button" onClick={() => setIngredientes(ingredientes.filter(i => i.insumo_id !== ing.insumo_id))}
                            className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {ingredientes.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg">Sin insumos añadidos aún</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button type="button" onClick={closePanel} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || ingredientes.length === 0} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Crear receta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
