import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/apiClient'
import { useAuth } from '../contexts/AuthContext'

export default function EntregaDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const isDistribuidor = perfil?.rol === 'distribuidor' || perfil?.rol === 'admin'
  const isAdmin = perfil?.rol === 'admin' || perfil?.rol === 'ventas'

  const [entrega, setEntrega] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Venta Form (Para distribuidor)
  const [formVenta, setFormVenta] = useState({ cliente_id: '', producto_id: '', cantidad: 1 })
  
  // Cierre Form (Para admin)
  const [devoluciones, setDevoluciones] = useState({}) // { [producto_id]: cantidad_devuelta }
  const [efectivoEntregado, setEfectivoEntregado] = useState(0)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const data = await api.get(`/entregas/${id}`)
      setEntrega(data)
      if (data.ruta_clientes?.length > 0) setFormVenta(f => ({ ...f, cliente_id: data.ruta_clientes[0].clientes.id }))
      if (data.entrega_detalle?.length > 0) {
        setFormVenta(f => ({ ...f, producto_id: data.entrega_detalle[0].productos.id }))
        // Inicializar devoluciones en 0
        const devs = {}
        data.entrega_detalle.forEach(d => { devs[d.productos.id] = 0 })
        setDevoluciones(devs)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVender(e) {
    e.preventDefault()
    
    // Obtener precio para la vista local (el backend lo valida pero aquí lo enviamos por simplicidad)
    const detalle = entrega.entrega_detalle.find(d => d.productos.id === formVenta.producto_id)
    if (!detalle) return
    const precio = detalle.productos.precio_venta

    try {
      await api.post(`/entregas/${id}/ventas`, {
        cliente_id: formVenta.cliente_id,
        producto_id: formVenta.producto_id,
        cantidad: formVenta.cantidad,
        precio_unitario: precio
      })
      setFormVenta(f => ({ ...f, cantidad: 1 }))
      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleCerrarRuta() {
    if (!confirm('¿Cerrar ruta definitivamente?')) return
    
    const devsArray = Object.keys(devoluciones).map(prodId => ({
      producto_id: prodId,
      cantidad_devuelta: devoluciones[prodId]
    }))

    try {
      await api.post(`/entregas/${id}/cerrar`, {
        devoluciones: devsArray,
        efectivo_entregado: parseFloat(efectivoEntregado) || 0,
        notas_cierre: ''
      })
      alert('Ruta cerrada con éxito.')
      navigate('/entregas')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>
  if (error || !entrega) return <div className="p-6 text-red-500">{error || 'No encontrada'}</div>

  const isActiva = entrega.estado === 'EN_RUTA'
  const totalVentas = entrega.ventas?.reduce((acc, v) => acc + Number(v.total), 0) || 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Entrega: {entrega.rutas?.nombre}</h1>
          <p className="text-gray-500">Repartidor: {entrega.perfiles?.nombre} | Estado: {entrega.estado}</p>
        </div>
        <button onClick={() => navigate('/entregas')} className="text-blue-600 hover:underline">Volver</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: Inventario del Camión */}
        <div className="bg-white p-5 shadow rounded-lg col-span-1">
          <h2 className="font-semibold mb-3 border-b pb-2">Inventario a bordo</h2>
          <ul className="space-y-3">
            {entrega.entrega_detalle?.map(d => {
              const disponible = d.cantidad_asignada - d.cantidad_vendida - d.cantidad_devuelta
              return (
                <li key={d.id} className="text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{d.productos?.nombre}</span>
                    <span className={disponible > 0 ? 'text-green-600' : 'text-red-500'}>{disponible} u. disponibles</span>
                  </div>
                  <div className="text-xs text-gray-400 flex justify-between mt-1">
                    <span>Cargado: {d.cantidad_asignada}</span>
                    <span>Vendido: {d.cantidad_vendida}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* COLUMNA 2: Registrar Venta (Solo si activa y es distribuidor) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {isActiva && isDistribuidor && (
            <div className="bg-white p-5 shadow rounded-lg border-t-4 border-blue-500">
              <h2 className="font-semibold mb-4">Registrar Venta a Tienda</h2>
              <form onSubmit={handleVender} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Cliente</label>
                  <select className="w-full border rounded p-2 text-sm" value={formVenta.cliente_id} onChange={e => setFormVenta({...formVenta, cliente_id: e.target.value})}>
                    {entrega.rutas?.ruta_clientes?.map(rc => (
                      <option key={rc.clientes.id} value={rc.clientes.id}>{rc.clientes.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <label className="block text-xs font-medium mb-1">Producto</label>
                    <select className="w-full border rounded p-2 text-sm" value={formVenta.producto_id} onChange={e => setFormVenta({...formVenta, producto_id: e.target.value})}>
                      {entrega.entrega_detalle?.map(d => (
                        <option key={d.productos.id} value={d.productos.id}>{d.productos.nombre} (${d.productos.precio_venta})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium mb-1">Cant.</label>
                    <input type="number" min="1" required className="w-full border rounded p-2 text-sm" value={formVenta.cantidad} onChange={e => setFormVenta({...formVenta, cantidad: Number(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" className="bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700">Vender</button>
              </form>
            </div>
          )}

          {/* Cierre de Ruta (Admin) */}
          {isActiva && isAdmin && (
            <div className="bg-red-50 p-5 shadow rounded-lg border-t-4 border-red-500">
              <h2 className="font-semibold text-red-800 mb-2">Corte de Ruta (Cierre)</h2>
              <p className="text-xs text-red-600 mb-4">Atención: Esta acción es irreversible. Se calcularán diferencias.</p>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">1. Registro de Devoluciones (Sobró en camión)</h3>
                {entrega.entrega_detalle?.map(d => (
                  <div key={d.id} className="flex justify-between items-center text-sm mb-2">
                    <span>{d.productos?.nombre} (Disp: {d.cantidad_asignada - d.cantidad_vendida})</span>
                    <input 
                      type="number" min="0" max={d.cantidad_asignada - d.cantidad_vendida}
                      className="border rounded p-1 w-20 text-right"
                      value={devoluciones[d.productos.id] ?? 0}
                      onChange={e => setDevoluciones({...devoluciones, [d.productos.id]: Number(e.target.value)})}
                    />
                  </div>
                ))}
              </div>

              <div className="mb-4 border-t border-red-200 pt-4">
                <h3 className="text-sm font-medium mb-2">2. Liquidación Efectivo</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Total Ventas Registradas (Esperado):</span>
                  <span className="font-bold text-lg">${totalVentas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Efectivo Físico Entregado:</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-gray-500">$</span>
                    <input 
                      type="number" step="any" min="0"
                      className="border rounded p-1 w-32 pl-6 text-right font-bold"
                      value={efectivoEntregado}
                      onChange={e => setEfectivoEntregado(e.target.value)}
                    />
                  </div>
                </div>
                
                {efectivoEntregado > 0 && (
                  <div className={`text-right mt-2 text-sm font-bold ${efectivoEntregado - totalVentas < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Diferencia: ${(efectivoEntregado - totalVentas).toFixed(2)}
                  </div>
                )}
              </div>

              <button onClick={handleCerrarRuta} className="w-full bg-red-600 text-white rounded py-2 text-sm font-bold hover:bg-red-700">
                Cerrar Ruta y Confirmar Corte
              </button>
            </div>
          )}

          {/* Resumen del Corte si ya está cerrada */}
          {!isActiva && entrega.cortes_ruta?.length > 0 && (
            <div className="bg-gray-800 text-white p-6 shadow rounded-lg text-center">
              <h2 className="text-lg font-bold text-gray-300 mb-4">Corte de Caja Oficial</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Esperado</p>
                  <p className="text-xl font-mono">${entrega.cortes_ruta[0].total_ventas_esperado}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Entregado</p>
                  <p className="text-xl font-mono">${entrega.cortes_ruta[0].efectivo_entregado}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Diferencia</p>
                  <p className={`text-xl font-mono ${entrega.cortes_ruta[0].diferencia < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ${entrega.cortes_ruta[0].diferencia}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Cerrado el: {new Date(entrega.cerrada_en).toLocaleString()}</p>
            </div>
          )}

          {/* Historial de tickets */}
          <div className="bg-white p-5 shadow rounded-lg">
            <h2 className="font-semibold mb-3 border-b pb-2">Tickets de Venta</h2>
            {entrega.ventas?.length === 0 ? <p className="text-sm text-gray-500">Sin ventas aún.</p> : (
              <ul className="space-y-2">
                {entrega.ventas?.map(v => (
                  <li key={v.id} className="text-sm border-b pb-2">
                    <div className="flex justify-between font-medium">
                      <span>{v.clientes?.nombre}</span>
                      <span className="text-green-600">${v.total}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {v.cantidad}x {v.productos?.nombre}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
