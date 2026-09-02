// Punto de entrada serverless para Vercel.
// Carga dotenv solo en local (en Vercel las variables se configuran en el dashboard).
import 'dotenv/config'
import app from '../backend/src/app.js'

export default app
