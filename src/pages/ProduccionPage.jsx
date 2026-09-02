import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'

export default function ProduccionPage() {
  const [recetas, setRecetas] = useState([])
  const [producciones, setProducciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [panel, setPanel] = useState(false)
  const [form, setForm] = useState({ receta_id: '', multiplicador: 1, notas: '' })

  const recetaSeleccionada = recetas.find(r => r.id === form.receta_id)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [r, p] = await Promise.all([api.get('/recetas'), api.get('/produccion')])
      setRecetas(r); setProducciones(p)
      if (r.length > 0) setForm(f => ({ ...f, receta_id: f.receta_id || r[0].id }))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true); setError(null); setSuccess(null)
    try {
      await api.post('/produccion', form)
      setForm(f => ({ ...f, multiplicador: 1, notas: '' }))
      setSuccess(`✓ Producción registrada: ${recetaSeleccionada?.rendimiento * form.multiplicador} unidades de ${recetaSeleccionada?.productos?.nombre}`)
      setPanel(false)
      fetchData()
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f8fc]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Producción</h1>
          <p className="page-subtitle">{producciones.length} lotes registrados</p>
        </div>
        <button onClick={() => setPanel(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Registrar producción
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400">✕</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg mx-8 mt-4">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="card overflow-hidden">
            {loading ? (
              <div className="empty-state"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="th">Fecha</th>
                    <th className="th">Receta ejecutada</th>
                    <th className="th">Producción</th>
                    <th className="th">Costo total</th>
                    <th className="th">Registrado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {producciones.map(prod => (
                    <tr key={prod.id} className="tr-hover">
                      <td className="td text-gray-400 text-xs">
                        {new Date(prod.created_at).toLocaleString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="td font-medium text-gray-900">{prod.recetas?.nombre}</td>
                      <td className="td">
                        <span className="text-emerald-600 font-semibold">+{prod.cantidad_producida}</span>
                        <span className="text-gray-400 text-xs ml-1">{prod.productos?.nombre}</span>
                      </td>
                      <td className="td font-semibold text-gray-900">${Number(prod.costo_total||0).toFixed(2)}</td>
                      <td className="td text-gray-400">{prod.perfiles?.nombre}</td>
                    </tr>
                  ))}
                  {producciones.length === 0 && (
                    <tr><td colSpan={5} className="py-16 text-center text-gray-400 text-sm">No hay producciones registradas aún.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel */}
        {panel && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Nueva producción</p>
                <p className="text-xs text-gray-400">Los insumos se descontarán automáticamente</p>
              </div>
              <button onClick={() => setPanel(false)} className="btn-icon">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="label">Receta a ejecutar *</label>
                {recetas.length === 0
                  ? <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">Primero crea una receta en el módulo de Recetas.</p>
                  : <select className="input" value={form.receta_id} onChange={e => setForm({...form, receta_id: e.target.value})}>
                      {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre} → {r.productos?.nombre}</option>)}
                    </select>}
              </div>

              <div>
                <label className="label">Multiplicador de lotes *</label>
                <input className="input" type="number" step="any" min="0.1" required value={form.multiplicador}
                  onChange={e => setForm({...form, multiplicador: parseFloat(e.target.value)||1})} />
                <p className="text-xs text-gray-400 mt-1">Cuántas veces se ejecuta la receta completa.</p>
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea className="input" rows={2} value={form.notas} placeholder="Observaciones opcionales..." onChange={e => setForm({...form, notas: e.target.value})} />
              </div>

              {/* Preview */}
              {recetaSeleccionada && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Proyección de este lote</p>
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Se producirán</p>
                      <p className="font-bold text-emerald-600">{recetaSeleccionada.rendimiento * form.multiplicador} {recetaSeleccionada.productos?.nombre}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Insumos a descontar</p>
                  <div className="space-y-2">
                    {recetaSeleccionada.receta_insumos?.map(ri => {
                      const requerido = ri.cantidad_requerida * form.multiplicador
                      const stock = ri.insumos?.stock_actual ?? 0
                      const insuf = stock < requerido
                      return (
                        <div key={ri.id} className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg border ${insuf ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                          <span className={insuf ? 'text-red-700' : 'text-gray-700'}>{ri.insumos?.nombre}</span>
                          <div className="text-right">
                            <p className={`font-semibold ${insuf ? 'text-red-600' : 'text-gray-800'}`}>−{requerido} {ri.insumos?.unidad_medida}</p>
                            <p className="text-xs text-gray-400">Stock: {stock}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button type="button" onClick={() => setPanel(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={submitting || recetas.length === 0} className="btn-primary flex-1">
                {submitting ? 'Procesando...' : 'Ejecutar producción'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
