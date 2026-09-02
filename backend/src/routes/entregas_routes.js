import { Router } from 'express'
import { getEntregas, getEntregaById, createEntrega, registrarVenta, cerrarEntrega } from '../controllers/entregas_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(authMiddleware)

// Distribuidores pueden ver sus entregas, Admin/Ventas ven todas (RLS)
router.get('/', getEntregas)
router.get('/:id', getEntregaById)

// Distribuidor registra venta
router.post('/:id/ventas', roleMiddleware('distribuidor', 'admin'), registrarVenta)

// Admin/Ventas abren y cierran rutas (cargan el camión y cobran el dinero)
router.post('/', roleMiddleware('admin', 'ventas'), createEntrega)
router.post('/:id/cerrar', roleMiddleware('admin', 'ventas'), cerrarEntrega)

export default router
