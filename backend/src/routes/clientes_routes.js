import { Router } from 'express'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientes_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(authMiddleware)

// Lectura para distribuidores también
router.get('/', roleMiddleware('admin', 'ventas', 'distribuidor'), getClientes)

// Escritura solo para admin y ventas
router.post('/', roleMiddleware('admin', 'ventas'), createCliente)
router.put('/:id', roleMiddleware('admin', 'ventas'), updateCliente)
router.delete('/:id', roleMiddleware('admin', 'ventas'), deleteCliente)

export default router
