import { Router } from 'express'
import { getRutas, createRuta, deleteRuta } from '../controllers/rutas_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(authMiddleware)

// Todos los roles de operación pueden ver las rutas (para combos, etc)
router.get('/', getRutas)

// Solo admin y ventas configuran el maestro de rutas
router.post('/', roleMiddleware('admin', 'ventas'), createRuta)
router.delete('/:id', roleMiddleware('admin', 'ventas'), deleteRuta)

export default router
