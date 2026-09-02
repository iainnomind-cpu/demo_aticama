import 'dotenv/config'
import app from './src/app.js'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Backend local corriendo en http://localhost:${PORT}`)
})
