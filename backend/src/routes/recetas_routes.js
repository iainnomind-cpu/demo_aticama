import { Router } from 'express'
import { getRecetas, createReceta, deleteReceta } from '../controllers/recetas_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.use(roleMiddleware('admin', 'cocina'))

router.get('/', getRecetas)
router.post('/', createReceta)
router.delete('/:id', deleteReceta)

export default router
