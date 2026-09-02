import supabase from '../config/supabaseClient.js'

export async function getRecetas(req, res) {
  const { data, error } = await req.user.supabaseUser
    .from('recetas')
    .select(`
      *,
      productos (id, nombre, marcas (nombre)),
      receta_insumos (id, cantidad_requerida, insumos (id, nombre, unidad_medida))
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false })
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function createReceta(req, res) {
  const { producto_id, nombre, descripcion, rendimiento, insumos_detalle } = req.body
  
  if (!insumos_detalle || insumos_detalle.length === 0) {
    return res.status(400).json({ error: 'La receta debe incluir al menos un insumo' })
  }

  // 1. Insertar la receta principal
  const { data: receta, error: recetaError } = await req.user.supabaseUser
    .from('recetas')
    .insert([{ producto_id, nombre, descripcion, rendimiento }])
    .select()
    .single()
    
  if (recetaError) return res.status(400).json({ error: recetaError.message })

  // 2. Formatear y preparar los insumos asociados
  const insumosInsert = insumos_detalle.map(i => ({
    receta_id: receta.id,
    insumo_id: i.insumo_id,
    cantidad_requerida: i.cantidad_requerida
  }))

  // 3. Insertar dependencias
  const { error: detalleError } = await req.user.supabaseUser
    .from('receta_insumos')
    .insert(insumosInsert)

  if (detalleError) {
    // Si falla el detalle, damos de baja la receta principal para no dejar huerfanos lógicos
    await req.user.supabaseUser.from('recetas').update({ activo: false }).eq('id', receta.id)
    return res.status(400).json({ error: detalleError.message })
  }

  res.status(201).json(receta)
}

export async function deleteReceta(req, res) {
  const { id } = req.params
  const { data, error } = await req.user.supabaseUser
    .from('recetas')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Receta dada de baja lógica', data })
}
