import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'

// ── Componentes UI reutilizables ──────────────────────────────────
function PageHeader({ title, desc, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {desc && <p className="text-sm text-gray-400 mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

function Badge({ label, color }) {
  const colors = {
    red:    'bg-red-50 text-red-700 border border-red-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    green:  'bg-green-50 text-green-700 border border-green-200',
  }
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${colors[color]}`}>{label}</span>
}

function EmptyState({ msg }) {
  return (
    <div className="py-16 text-center text-gray-400 text-sm">
      <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
      </svg>
      {msg}
    </div>
  )
}

// ── Formulario lateral ────────────────────────────────────────────
function InsumoForm({ initial, onSave, onCancel, loading }) {
  const empty = { nombre: '', unidad_medida: 'kg', stock_actual: 0, stock_minimo: 0, costo_unitario: 0 }
  const [form, setForm] = useState(initial || empty)

  useEffect(() => { setForm(initial || empty) }, [initial])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4 h-full">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
        <input required className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Camarón fresco" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Unidad de medida</label>
        <select className="input" value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)}>
          {['kg','g','l','ml','pieza','caja','bolsa','paquete'].map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Stock actual</label>
          <input type="number" step="any" min="0" required className="input" value={form.stock_actual} onChange={e => set('stock_actual', parseFloat(e.target.value))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Stock mínimo</label>
          <input type="number" step="any" min="0" required className="input" value={form.stock_minimo} onChange={e => set('stock_minimo', parseFloat(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Costo unitario (MXN)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input type="number" step="any" min="0" required className="input pl-6" value={form.costo_unitario} onChange={e => set('costo_unitario', parseFloat(e.target.value))} />
        </div>
      </div>
      <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 text-sm font-semibold bg-[#0f1e3d] text-white rounded-lg hover:bg-[#1a2f5a] disabled:opacity-50 transition">
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ── Page principal ────────────────────────────────────────────────
export default function InsumosPage() {
  const { perfil } = useAuth()
  const canEdit = ['admin', 'compras'].includes(perfil?.rol)

  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  const [panel, setPanel] = useState(null) // null | 'new' | insumo{}
  const isEditing = panel && panel !== 'new'

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      setInsumos(await api.get('/insumos'))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      if (isEditing) await api.put(`/insumos/${panel.id}`, form)
      else            await api.post('/insumos', form)
      setPanel(null)
      fetchData()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Dar de baja este insumo?')) return
    try {
      await api.delete(`/insumos/${id}`)
      fetchData()
    } catch (e) { setError(e.message) }
  }

  const filtered = insumos.filter(i => i.nombre.toLowerCase().includes(query.toLowerCase()))

  function stockBadge(i) {
    if (i.stock_actual <= 0)            return <Badge label="Sin stock" color="red" />
    if (i.stock_actual <= i.stock_minimo) return <Badge label="Stock bajo" color="yellow" />
    return <Badge label="OK" color="green" />
  }

  return (
    <div className="flex h-full">
      {/* Contenido principal */}
      <div className="flex-1 p-7 overflow-y-auto min-w-0">
        <PageHeader
          title="Insumos"
          desc="Materias primas y control de inventario"
          action={canEdit && (
            <button
              onClick={() => setPanel('new')}
              className="flex items-center gap-2 bg-[#0f1e3d] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1a2f5a] transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo insumo
            </button>
          )}
        />

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Buscar insumo…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Nombre</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Unidad</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Stock actual</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Mínimo</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Costo</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Estado</th>
                {canEdit && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="7" className="py-16 text-center text-gray-400 text-sm">Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7"><EmptyState msg="No hay insumos registrados" /></td></tr>
              ) : (
                filtered.map(insumo => (
                  <tr key={insumo.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{insumo.nombre}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{insumo.unidad_medida}</td>
                    <td className={`px-5 py-3.5 text-sm font-semibold text-right ${insumo.stock_actual <= insumo.stock_minimo ? 'text-red-600' : 'text-gray-900'}`}>
                      {insumo.stock_actual}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 text-right">{insumo.stock_minimo}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 text-right">${Number(insumo.costo_unitario).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-center">{stockBadge(insumo)}</td>
                    {canEdit && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => setPanel(insumo)} className="text-xs text-blue-600 hover:underline">Editar</button>
                          <button onClick={() => handleDelete(insumo.id)} className="text-xs text-red-500 hover:underline">Baja</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-2.5 border-t border-gray-50 bg-gray-50/50">
              <p className="text-xs text-gray-400">{filtered.length} insumo{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral de formulario */}
      {panel && (
        <div className="w-80 flex-shrink-0 border-l border-gray-100 bg-white p-6 overflow-y-auto shadow-[-4px_0_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">{isEditing ? 'Editar insumo' : 'Nuevo insumo'}</h2>
            <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <InsumoForm
            initial={isEditing ? panel : null}
            onSave={handleSave}
            onCancel={() => setPanel(null)}
            loading={saving}
          />
        </div>
      )}
    </div>
  )
}
