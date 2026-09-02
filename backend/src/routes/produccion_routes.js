import { Router } from 'express'
import { getProducciones, registrarProduccion } from '../controllers/produccion_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.use(roleMiddleware('admin', 'cocina'))

router.get('/', getProducciones)
router.post('/', registrarProduccion)

export default router
