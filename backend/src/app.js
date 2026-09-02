import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth_routes.js'
import insumosRoutes from './routes/insumos_routes.js'
import productosRoutes from './routes/productos_routes.js'
import recetasRoutes from './routes/recetas_routes.js'
import produccionRoutes from './routes/produccion_routes.js'
import clientesRoutes from './routes/clientes_routes.js'
import rutasRoutes from './routes/rutas_routes.js'
import entregasRoutes from './routes/entregas_routes.js'

const app = express()

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Rutas de dominio
app.use('/api/auth', authRoutes)
app.use('/api/insumos', insumosRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/recetas', recetasRoutes)
app.use('/api/produccion', produccionRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/rutas', rutasRoutes)
app.use('/api/entregas', entregasRoutes)

// Manejador de errores global
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

export default app
