import { Router } from 'express'
import { getMarcas, createMarca, getProductos, createProducto, updateProducto, deleteProducto } from '../controllers/productos_controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(authMiddleware)

// Endpoints de lectura (permitidos para ventas, compras, admin, cocina)
router.get('/marcas', roleMiddleware('admin', 'ventas', 'cocina', 'compras'), getMarcas)
router.get('/', roleMiddleware('admin', 'ventas', 'cocina', 'compras'), getProductos)

// Endpoints de escritura (permitidos solo para admin y cocina)
router.post('/marcas', roleMiddleware('admin', 'cocina'), createMarca)
router.post('/', roleMiddleware('admin', 'cocina'), createProducto)
router.put('/:id', roleMiddleware('admin', 'cocina'), updateProducto)
router.delete('/:id', roleMiddleware('admin', 'cocina'), deleteProducto)

export default router
