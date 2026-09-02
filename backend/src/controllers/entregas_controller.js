import supabase from '../config/supabaseClient.js'

export async function getEntregas(req, res) {
  // El RLS ya filtra para que el distribuidor solo vea las suyas, y admin todas
  const { data, error } = await req.user.supabaseUser
    .from('entregas')
    .select(`
      *,
      rutas (nombre),
      perfiles!distribuidor_id (nombre),
      entrega_detalle (id, cantidad_asignada, cantidad_vendida, cantidad_devuelta, productos(id, nombre, precio_venta))
    `)
    .order('created_at', { ascending: false })
    
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function getEntregaById(req, res) {
  const { id } = req.params
  const { data, error } = await req.user.supabaseUser
    .from('entregas')
    .select(`
      *,
      rutas (nombre, ruta_clientes(clientes(id, nombre, direccion))),
      perfiles!distribuidor_id (nombre),
      entrega_detalle (id, cantidad_asignada, cantidad_vendida, cantidad_devuelta, productos(id, nombre, precio_venta)),
      ventas (id, cantidad, total, clientes(nombre), productos(nombre)),
      cortes_ruta (*)
    `)
    .eq('id', id)
    .single()
    
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

// Abrir una entrega a un distribuidor (solo Admin/Ventas)
export async function createEntrega(req, res) {
  const { distribuidor_id, ruta_id, detalles } = req.body // detalles: [{producto_id, cantidad_asignada}]
  const admin_id = req.user.id

  if (!detalles || detalles.length === 0) return res.status(400).json({ error: 'Faltan productos para asignar' })

  // 1. Validar que hay stock disponible
  for (let d of detalles) {
    const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', d.producto_id).single()
    if (prod.stock_actual < d.cantidad_asignada) {
      return res.status(400).json({ error: 'Stock insuficiente de producto para asignar a la ruta.' })
    }
  }

  // 2. Crear Entrega
  const { data: entrega, error: errEntrega } = await req.user.supabaseUser
    .from('entregas')
    .insert([{ distribuidor_id, ruta_id, abierta_por: admin_id, estado: 'EN_RUTA' }])
    .select()
    .single()
    
  if (errEntrega) return res.status(400).json({ error: errEntrega.message })

  // 3. Crear detalle y descontar inventario principal
  for (let d of detalles) {
    await supabase.from('entrega_detalle').insert([{
      entrega_id: entrega.id,
      producto_id: d.producto_id,
      cantidad_asignada: d.cantidad_asignada
    }])

    const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', d.producto_id).single()
    await supabase.from('productos').update({ stock_actual: prod.stock_actual - d.cantidad_asignada }).eq('id', d.producto_id)
    
    await supabase.from('movimientos_inventario').insert([{
      tipo_movimiento: 'SALIDA',
      entidad_tipo: 'PRODUCTO',
      entidad_id: d.producto_id,
      cantidad: -d.cantidad_asignada,
      referencia_id: entrega.id,
      usuario_id: admin_id,
      notas: 'Asignación a ruta'
    }])
  }

  res.status(201).json(entrega)
}

// Registrar una venta en la ruta (solo el Distribuidor de esa entrega)
export async function registrarVenta(req, res) {
  const { id: entrega_id } = req.params
  const { cliente_id, producto_id, cantidad, precio_unitario, notas } = req.body
  const distribuidor_id = req.user.id

  if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' })

  // 1. Validar si la entrega sigue abierta
  const { data: entrega } = await req.user.supabaseUser.from('entregas').select('estado').eq('id', entrega_id).single()
  if (!entrega || entrega.estado !== 'EN_RUTA') {
    return res.status(400).json({ error: 'La entrega no está activa.' })
  }

  // 2. Descontar del detalle de la entrega (Stock móvil del camión)
  const { data: detalle } = await req.user.supabaseUser
    .from('entrega_detalle')
    .select('id, cantidad_asignada, cantidad_vendida, cantidad_devuelta')
    .eq('entrega_id', entrega_id)
    .eq('producto_id', producto_id)
    .single()

  if (!detalle) return res.status(400).json({ error: 'El producto no fue asignado a esta entrega.' })
  
  const inventarioCamion = detalle.cantidad_asignada - (detalle.cantidad_vendida + detalle.cantidad_devuelta)
  if (inventarioCamion < cantidad) {
    return res.status(400).json({ error: `Solo tienes ${inventarioCamion} unidades en la camioneta.` })
  }

  await req.user.supabaseUser.from('entrega_detalle')
    .update({ cantidad_vendida: detalle.cantidad_vendida + cantidad })
    .eq('id', detalle.id)

  // 3. Registrar venta
  const total = cantidad * precio_unitario
  const { data: venta, error: ventaErr } = await req.user.supabaseUser
    .from('ventas')
    .insert([{ entrega_id, cliente_id, producto_id, cantidad, precio_unitario, total, notas }])
    .select()
    .single()
    
  if (ventaErr) return res.status(400).json({ error: ventaErr.message })

  res.status(201).json(venta)
}

// Cerrar entrega y liquidar diferencias (Admin/Ventas)
export async function cerrarEntrega(req, res) {
  const { id: entrega_id } = req.params
  const { devoluciones, efectivo_entregado, notas_cierre } = req.body 
  // devoluciones: [{ producto_id, cantidad_devuelta }]
  const admin_id = req.user.id

  // 1. Validar estado
  const { data: entrega } = await req.user.supabaseUser.from('entregas').select('estado').eq('id', entrega_id).single()
  if (entrega.estado === 'CERRADA') return res.status(400).json({ error: 'Ya está cerrada.' })

  // 2. Procesar Devoluciones (reingreso a inventario principal y marcar en detalle de entrega)
  if (devoluciones) {
    for (let dev of devoluciones) {
      if (dev.cantidad_devuelta > 0) {
        // A. Marcar en detalle
        const { data: detalle } = await supabase.from('entrega_detalle')
          .select('id, cantidad_devuelta')
          .eq('entrega_id', entrega_id).eq('producto_id', dev.producto_id).single()
          
        await supabase.from('entrega_detalle')
          .update({ cantidad_devuelta: detalle.cantidad_devuelta + dev.cantidad_devuelta })
          .eq('id', detalle.id)

        // B. Reintegrar a BD maestra
        const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', dev.producto_id).single()
        await supabase.from('productos').update({ stock_actual: prod.stock_actual + dev.cantidad_devuelta }).eq('id', dev.producto_id)
        
        // C. Movimiento
        await supabase.from('movimientos_inventario').insert([{
          tipo_movimiento: 'ENTRADA',
          entidad_tipo: 'PRODUCTO',
          entidad_id: dev.producto_id,
          cantidad: dev.cantidad_devuelta,
          referencia_id: entrega_id,
          usuario_id: admin_id,
          notas: 'Devolución de ruta'
        }])
      }
    }
  }

  // 3. Calcular suma de ventas
  const { data: ventas } = await req.user.supabaseUser.from('ventas').select('total').eq('entrega_id', entrega_id)
  const total_ventas_esperado = ventas.reduce((acc, curr) => acc + Number(curr.total), 0)
  
  const diferencia = Number(efectivo_entregado) - total_ventas_esperado

  // 4. Crear corte de ruta
  const { data: corte, error: corteErr } = await req.user.supabaseUser
    .from('cortes_ruta')
    .insert([{
      entrega_id, total_ventas_esperado, efectivo_entregado, diferencia, notas_cierre
    }])
    .select()
    .single()
    
  if (corteErr) return res.status(400).json({ error: corteErr.message })

  // 5. Cerrar entrega
  await req.user.supabaseUser.from('entregas').update({
    estado: 'CERRADA',
    cerrada_en: new Date().toISOString(),
    cerrada_por: admin_id
  }).eq('id', entrega_id)

  res.json({ message: 'Ruta cerrada con éxito', corte })
}
