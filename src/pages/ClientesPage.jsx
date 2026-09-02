import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'

const EMPTY = { nombre: '', direccion: '', telefono: '', requiere_factura: false, rfc: '', razon_social: '' }

export default function ClientesPage() {
  const { perfil } = useAuth()
  const canEdit = perfil?.rol === 'admin' || perfil?.rol === 'ventas'

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try { setClientes(await api.get('/clientes')) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function openNew() { setForm(EMPTY); setEditingId(null); setPanel(true) }
  function openEdit(c) {
    setForm({ nombre: c.nombre, direccion: c.direccion||'', telefono: c.telefono||'',
              requiere_factura: c.requiere_factura, rfc: c.rfc||'', razon_social: c.razon_social||'' })
    setEditingId(c.id); setPanel(true)
  }
  function closePanel() { setPanel(false); setEditingId(null); setForm(EMPTY) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.requiere_factura && (!form.rfc || !form.razon_social)) {
      return setError('Si requiere factura, RFC y Razón Social son obligatorios.')
    }
    setSaving(true); setError(null)
    try {
      editingId ? await api.put(`/clientes/${editingId}`, form) : await api.post('/clientes', form)
      closePanel(); fetchData()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Dar de baja este cliente?')) return
    try { await api.delete(`/clientes/${id}`); fetchData() }
    catch (e) { setError(e.message) }
  }

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search)
  )

  return (
    <div className="flex flex-col h-full bg-[#f7f8fc]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes registrados</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo cliente
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table area */}
        <div className="flex-1 overflow-auto p-8">
          {/* Search */}
          <div className="search-bar mb-4 max-w-xs">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input
              className="bg-transparent outline-none flex-1 text-gray-700 text-sm"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="empty-state"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="th">Cliente</th>
                    <th className="th">Contacto</th>
                    <th className="th">Dirección</th>
                    <th className="th">Facturación</th>
                    {canEdit && <th className="th text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="tr-hover">
                      <td className="td font-semibold text-gray-900">{c.nombre}</td>
                      <td className="td text-gray-500">{c.telefono || <span className="text-gray-300 italic">Sin teléfono</span>}</td>
                      <td className="td text-gray-500 max-w-xs truncate">{c.direccion || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="td">
                        {c.requiere_factura
                          ? <span className="badge-blue">🧾 {c.rfc}</span>
                          : <span className="badge-neutral">Sin factura</span>}
                      </td>
                      {canEdit && (
                        <td className="td text-right space-x-1">
                          <button onClick={() => openEdit(c)} className="btn-icon" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="btn-icon hover:!text-red-500 hover:!bg-red-50" title="Dar de baja">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={canEdit ? 5 : 4} className="py-16 text-center text-gray-400 text-sm">
                      {search ? 'Sin resultados para tu búsqueda.' : 'No hay clientes registrados aún.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Slide-in panel */}
        {panel && canEdit && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">{editingId ? 'Editar cliente' : 'Nuevo cliente'}</p>
                <p className="text-xs text-gray-400">{editingId ? 'Modifica los datos del registro' : 'Completa los datos del nuevo cliente'}</p>
              </div>
              <button onClick={closePanel} className="btn-icon">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="label">Nombre comercial *</label>
                <input className="input" required value={form.nombre} placeholder="Ej. Marisquería El Mar" onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={form.telefono} placeholder="311 123 4567" onChange={e => setForm({...form, telefono: e.target.value})} />
              </div>
              <div>
                <label className="label">Dirección</label>
                <input className="input" value={form.direccion} placeholder="Calle, número, colonia" onChange={e => setForm({...form, direccion: e.target.value})} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div className={`w-9 h-5 rounded-full transition-colors ${form.requiere_factura ? 'bg-teal-500' : 'bg-gray-200'} relative`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.requiere_factura ? 'translate-x-4' : ''}`}/>
                    <input type="checkbox" className="sr-only" checked={form.requiere_factura} onChange={e => setForm({...form, requiere_factura: e.target.checked})} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Requiere factura</span>
                </label>
              </div>

              {form.requiere_factura && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="label">RFC *</label>
                    <input className="input" required={form.requiere_factura} value={form.rfc} placeholder="XAXX010101000" onChange={e => setForm({...form, rfc: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="label">Razón Social *</label>
                    <input className="input" required={form.requiere_factura} value={form.razon_social} placeholder="Empresa S.A. de C.V." onChange={e => setForm({...form, razon_social: e.target.value})} />
                  </div>
                </div>
              )}
            </form>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button type="button" onClick={closePanel} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar cliente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
