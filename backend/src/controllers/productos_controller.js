import supabase from '../config/supabaseClient.js'

// =======================
// MARCAS
// =======================

export async function getMarcas(req, res) {
  const { data, error } = await req.user.supabaseUser
    .from('marcas')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function createMarca(req, res) {
  const { nombre } = req.body
  const { data, error } = await req.user.supabaseUser
    .from('marcas')
    .insert([{ nombre }])
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

// =======================
// PRODUCTOS
// =======================

export async function getProductos(req, res) {
  // Join con marca para traer el nombre
  const { data, error } = await req.user.supabaseUser
    .from('productos')
    .select('*, marcas (id, nombre)')
    .eq('activo', true)
    .order('nombre')
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function createProducto(req, res) {
  const { marca_id, nombre, codigo_barras, precio_venta, stock_actual, stock_minimo } = req.body
  const { data, error } = await req.user.supabaseUser
    .from('productos')
    .insert([{ marca_id, nombre, codigo_barras, precio_venta, stock_actual, stock_minimo }])
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateProducto(req, res) {
  const { id } = req.params
  const updates = req.body
  const { data, error } = await req.user.supabaseUser
    .from('productos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function deleteProducto(req, res) {
  const { id } = req.params
  const { data, error } = await req.user.supabaseUser
    .from('productos')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Producto dado de baja lógica', data })
}
