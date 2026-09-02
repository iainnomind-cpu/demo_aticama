/**
 * Middleware de control de roles.
 * Uso: roleMiddleware('admin', 'cocina')
 */
export function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    const rol = req.user?.perfil?.rol
    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: 'Acceso denegado para este rol' })
    }
    next()
  }
}
