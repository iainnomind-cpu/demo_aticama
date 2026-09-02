import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'

const EMPTY = { marca_id: '', nombre: '', codigo_barras: '', precio_venta: 0, stock_actual: 0, stock_minimo: 0 }

export default function ProductosPage() {
  const { perfil } = useAuth()
  const canEdit = perfil?.rol === 'admin' || perfil?.rol === 'cocina'

  const [productos, setProductos] = useState([])
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [nuevaMarca, setNuevaMarca] = useState('')
  const [showMarcaInput, setShowMarcaInput] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [p, m] = await Promise.all([api.get('/productos'), api.get('/productos/marcas')])
      setProductos(p); setMarcas(m)
      if (m.length > 0) setForm(f => ({ ...f, marca_id: f.marca_id || m[0].id }))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleAddMarca(e) {
    e.preventDefault()
    if (!nuevaMarca.trim()) return
    try {
      await api.post('/productos/marcas', { nombre: nuevaMarca.trim() })
      setNuevaMarca(''); setShowMarcaInput(false); fetchData()
    } catch (e) { setError(e.message) }
  }

  function openNew() {
    setForm({ ...EMPTY, marca_id: marcas[0]?.id || '' })
    setEditingId(null); setPanel(true)
  }
  function openEdit(p) {
    setForm({ marca_id: p.marca_id, nombre: p.nombre, codigo_barras: p.codigo_barras || '',
              precio_venta: p.precio_venta, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo })
    setEditingId(p.id); setPanel(true)
  }
  function closePanel() { setPanel(false); setEditingId(null); setForm(EMPTY) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      editingId ? await api.put(`/productos/${editingId}`, form) : await api.post('/productos', form)
      closePanel(); fetchData()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Dar de baja este producto?')) return
    try { await api.delete(`/productos/${id}`); fetchData() }
    catch (e) { setError(e.message) }
  }

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.marcas?.nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-[#f7f8fc]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos Terminados</h1>
          <p className="page-subtitle">{productos.length} productos en catálogo</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMarcaInput(!showMarcaInput)} className="btn-secondary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z"/></svg>
              Marcas
            </button>
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Nuevo producto
            </button>
          </div>
        )}
      </div>

      {/* Mini Marcas Panel */}
      {showMarcaInput && canEdit && (
        <div className="bg-white border-b border-gray-100 px-8 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Marcas registradas</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {marcas.map(m => (
              <span key={m.id} className="badge-neutral text-xs px-3 py-1">{m.nombre}</span>
            ))}
            {marcas.length === 0 && <span className="text-gray-400 text-sm">Sin marcas registradas</span>}
          </div>
          <form onSubmit={handleAddMarca} className="flex items-center gap-2 max-w-xs">
            <input className="input-sm flex-1" placeholder="Nueva marca..." value={nuevaMarca}
              onChange={e => setNuevaMarca(e.target.value)} />
            <button type="submit" className="btn-primary py-2 text-xs whitespace-nowrap">+ Añadir</button>
          </form>
        </div>
      )}

      {error && (
        <div className="alert-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="search-bar mb-4 max-w-xs">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input className="bg-transparent outline-none flex-1 text-gray-700 text-sm" placeholder="Buscar producto o marca..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="empty-state"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="th">Marca</th>
                    <th className="th">Producto</th>
                    <th className="th">Precio venta</th>
                    <th className="th">Stock</th>
                    <th className="th">Estado</th>
                    {canEdit && <th className="th text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const lowStock = p.stock_actual < p.stock_minimo
                    return (
                      <tr key={p.id} className="tr-hover">
                        <td className="td">
                          <span className="badge-neutral">{p.marcas?.nombre}</span>
                        </td>
                        <td className="td">
                          <p className="font-semibold text-gray-900">{p.nombre}</p>
                          {p.codigo_barras && <p className="text-xs text-gray-400 font-mono mt-0.5">{p.codigo_barras}</p>}
                        </td>
                        <td className="td font-semibold text-gray-900">${Number(p.precio_venta).toFixed(2)}</td>
                        <td className="td">
                          <span className={`font-semibold ${lowStock ? 'text-red-600' : 'text-gray-900'}`}>{p.stock_actual}</span>
                          <span className="text-gray-400 text-xs ml-1">/ mín {p.stock_minimo}</span>
                        </td>
                        <td className="td">
                          {lowStock
                            ? <span className="badge-danger">⚠ Stock bajo</span>
                            : <span className="badge-success">✓ OK</span>}
                        </td>
                        {canEdit && (
                          <td className="td text-right space-x-1">
                            <button onClick={() => openEdit(p)} className="btn-icon" title="Editar">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="btn-icon hover:!text-red-500 hover:!bg-red-50" title="Dar de baja">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={canEdit ? 6 : 5} className="py-16 text-center text-gray-400 text-sm">
                      {search ? 'Sin resultados.' : 'No hay productos registrados aún.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel */}
        {panel && canEdit && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">{editingId ? 'Editar producto' : 'Nuevo producto'}</p>
                <p className="text-xs text-gray-400">{editingId ? 'Modifica el registro' : 'Completa los datos del producto'}</p>
              </div>
              <button onClick={closePanel} className="btn-icon">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="label">Marca *</label>
                {marcas.length === 0
                  ? <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">Primero añade una marca usando el botón "Marcas" en la barra superior.</p>
                  : <select className="input" required value={form.marca_id} onChange={e => setForm({...form, marca_id: e.target.value})}>
                      {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>}
              </div>
              <div>
                <label className="label">Nombre del producto *</label>
                <input className="input" required value={form.nombre} placeholder="Ej. Caldo de camarón 1L" onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div>
                <label className="label">Código de barras</label>
                <input className="input" value={form.codigo_barras} placeholder="Opcional" onChange={e => setForm({...form, codigo_barras: e.target.value})} />
              </div>
              <div>
                <label className="label">Precio de venta *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input className="input pl-7" type="number" step="0.01" min="0" required value={form.precio_venta}
                    onChange={e => setForm({...form, precio_venta: parseFloat(e.target.value)||0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Stock actual</label>
                  <input className="input" type="number" step="any" min="0" value={form.stock_actual}
                    onChange={e => setForm({...form, stock_actual: parseFloat(e.target.value)||0})} />
                </div>
                <div>
                  <label className="label">Stock mínimo</label>
                  <input className="input" type="number" step="any" min="0" value={form.stock_minimo}
                    onChange={e => setForm({...form, stock_minimo: parseFloat(e.target.value)||0})} />
                </div>
              </div>
            </form>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button type="button" onClick={closePanel} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving || marcas.length === 0} className="btn-primary flex-1">
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
