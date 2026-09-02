import { Router } from 'express'
import { login, logout, me } from '../controllers/auth_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authMiddleware, me)

export default router
