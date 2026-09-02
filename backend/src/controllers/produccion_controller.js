import supabase from '../config/supabaseClient.js'

export async function getProducciones(req, res) {
  const { data, error } = await req.user.supabaseUser
    .from('producciones')
    .select(`
      *,
      recetas (nombre),
      productos (nombre),
      perfiles (nombre)
    `)
    .order('created_at', { ascending: false })
    .limit(50)
    
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function registrarProduccion(req, res) {
  const { receta_id, multiplicador, notas } = req.body
  const usuario_id = req.user.id

  if (!receta_id || !multiplicador || multiplicador <= 0) {
    return res.status(400).json({ error: 'Faltan datos o multiplicador inválido' })
  }

  // 1. Obtener datos completos de la receta (con admin privileges por seguridad en la consistencia)
  const { data: receta, error: recetaError } = await supabase
    .from('recetas')
    .select(`
      id, producto_id, rendimiento,
      receta_insumos (insumo_id, cantidad_requerida, insumos (stock_actual, costo_unitario))
    `)
    .eq('id', receta_id)
    .single()

  if (recetaError || !receta) return res.status(400).json({ error: 'Receta no encontrada' })

  // 2. Validar que hay stock suficiente para todos los insumos y calcular costo total
  const insumosRequeridos = receta.receta_insumos
  let costoTotal = 0

  for (let ri of insumosRequeridos) {
    const cantidadNecesaria = ri.cantidad_requerida * multiplicador
    if (ri.insumos.stock_actual < cantidadNecesaria) {
      return res.status(400).json({ 
        error: `Stock insuficiente de insumo. Se necesitan ${cantidadNecesaria}, hay ${ri.insumos.stock_actual}`
      })
    }
    costoTotal += (ri.insumos.costo_unitario * cantidadNecesaria)
  }

  // 3. Iniciar "Transacción" (Supabase JS rest API no tiene transacciones completas, usaremos múltiples peticiones admin. En un caso real mas estricto sería una función RPC en PostgreSQL)
  
  const cantidadProducida = receta.rendimiento * multiplicador

  // A. Registrar Producción
  const { data: produccion, error: prodError } = await req.user.supabaseUser
    .from('producciones')
    .insert([{
      receta_id: receta.id,
      producto_id: receta.producto_id,
      usuario_id,
      cantidad_producida,
      costo_total: costoTotal,
      notas
    }])
    .select()
    .single()

  if (prodError) return res.status(400).json({ error: prodError.message })

  // B. Descontar Insumos y registrar movimientos
  for (let ri of insumosRequeridos) {
    const cantidadNecesaria = ri.cantidad_requerida * multiplicador
    
    // Descuento
    await supabase.rpc('decrementar_stock_insumo', { 
      row_id: ri.insumo_id, 
      cantidad_desc: cantidadNecesaria 
    }) // Nota: Si no creamos RPC, hacemos UPDATE manual
    
    // Fallback manual al UPDATE si no hay RPC (Ponytail: mantengamoslo simple sin crear RPC extra por ahora, usando concurrencia simple)
    const nuevoStockInsumo = ri.insumos.stock_actual - cantidadNecesaria
    await supabase.from('insumos').update({ stock_actual: nuevoStockInsumo }).eq('id', ri.insumo_id)

    // Movimiento
    await supabase.from('movimientos_inventario').insert([{
      tipo_movimiento: 'PRODUCCION',
      entidad_tipo: 'INSUMO',
      entidad_id: ri.insumo_id,
      cantidad: -cantidadNecesaria,
      referencia_id: produccion.id,
      usuario_id
    }])
  }

  // C. Aumentar Producto Terminado y registrar movimiento
  const { data: productoDB } = await supabase.from('productos').select('stock_actual').eq('id', receta.producto_id).single()
  const nuevoStockProd = productoDB.stock_actual + cantidadProducida
  
  await supabase.from('productos').update({ stock_actual: nuevoStockProd }).eq('id', receta.producto_id)
  
  await supabase.from('movimientos_inventario').insert([{
    tipo_movimiento: 'PRODUCCION',
    entidad_tipo: 'PRODUCTO',
    entidad_id: receta.producto_id,
    cantidad: cantidadProducida,
    referencia_id: produccion.id,
    usuario_id
  }])

  res.status(201).json(produccion)
}
