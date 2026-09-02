import { Router } from 'express'
import { getInsumos, createInsumo, updateInsumo, deleteInsumo, getAlertas } from '../controllers/insumos_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

// Todas las rutas requieren autenticación y rol permitido (compras, admin, cocina)
router.use(authMiddleware)
router.use(roleMiddleware('admin', 'compras', 'cocina'))

router.get('/alertas', getAlertas)
router.get('/', getInsumos)
router.post('/', createInsumo)
router.put('/:id', updateInsumo)
router.delete('/:id', deleteInsumo)

export default router
