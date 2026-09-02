import supabase from '../config/supabaseClient.js'

export async function getInsumos(req, res) {
  const { data, error } = await req.user.supabaseUser
    .from('insumos')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function createInsumo(req, res) {
  const { nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario } = req.body
  const { data, error } = await req.user.supabaseUser
    .from('insumos')
    .insert([{ nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario }])
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateInsumo(req, res) {
  const { id } = req.params
  const updates = req.body
  const { data, error } = await req.user.supabaseUser
    .from('insumos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function deleteInsumo(req, res) {
  const { id } = req.params
  const { data, error } = await req.user.supabaseUser
    .from('insumos')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Insumo dado de baja lógica', data })
}

export async function getAlertas(req, res) {
  // En supabase, podemos comparar dos columnas usando una expresión raw o postgrest syntax
  // Sin embargo, para evitar RPC o vistas, podemos traerlos y filtrar en backend o usar un query.
  // Usaremos supabase raw si fuera posible, pero la forma mas segura y estandar en SB client:
  const { data, error } = await req.user.supabaseUser
    .from('insumos')
    .select('*')
    .eq('activo', true)
  
  if (error) return res.status(400).json({ error: error.message })
  
  const alertas = data.filter(i => i.stock_actual < i.stock_minimo)
  res.json(alertas)
}
