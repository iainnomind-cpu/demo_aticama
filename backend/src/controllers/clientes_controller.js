import supabase from '../config/supabaseClient.js'

export async function getClientes(req, res) {
  const { data, error } = await req.user.supabaseUser
    .from('clientes')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function createCliente(req, res) {
  const { nombre, direccion, telefono, requiere_factura, rfc, razon_social } = req.body
  
  // Limpieza de datos si no requiere factura (para no violar el check en updates)
  const payload = {
    nombre, direccion, telefono, requiere_factura,
    rfc: requiere_factura ? rfc : null,
    razon_social: requiere_factura ? razon_social : null
  }

  const { data, error } = await req.user.supabaseUser
    .from('clientes')
    .insert([payload])
    .select()
    .single()
    
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateCliente(req, res) {
  const { id } = req.params
  const { nombre, direccion, telefono, requiere_factura, rfc, razon_social } = req.body
  
  const payload = {
    nombre, direccion, telefono, requiere_factura,
    rfc: requiere_factura ? rfc : null,
    razon_social: requiere_factura ? razon_social : null
  }

  const { data, error } = await req.user.supabaseUser
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
    
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function deleteCliente(req, res) {
  const { id } = req.params
  const { data, error } = await req.user.supabaseUser
    .from('clientes')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single()
    
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Cliente dado de baja lógica', data })
}
