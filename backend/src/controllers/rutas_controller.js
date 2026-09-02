import supabase from '../config/supabaseClient.js'

// --- Rutas CRUD ---

export async function getRutas(req, res) {
  const { data, error } = await req.user.supabaseUser
    .from('rutas')
    .select('*, ruta_clientes (cliente_id, clientes(nombre, direccion))')
    .eq('activo', true)
    .order('nombre')
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function createRuta(req, res) {
  const { nombre, clientes } = req.body // clientes es array de IDs
  
  const { data: ruta, error: rutaErr } = await req.user.supabaseUser
    .from('rutas')
    .insert([{ nombre }])
    .select()
    .single()
    
  if (rutaErr) return res.status(400).json({ error: rutaErr.message })

  if (clientes && clientes.length > 0) {
    const rc = clientes.map((cid, i) => ({ ruta_id: ruta.id, cliente_id: cid, orden: i }))
    await req.user.supabaseUser.from('ruta_clientes').insert(rc)
  }

  res.status(201).json(ruta)
}

export async function deleteRuta(req, res) {
  const { id } = req.params
  const { data, error } = await req.user.supabaseUser
    .from('rutas')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single()
    
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}
