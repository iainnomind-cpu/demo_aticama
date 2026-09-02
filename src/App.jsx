import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InsumosPage from './pages/InsumosPage'
import ProductosPage from './pages/ProductosPage'
import RecetasPage from './pages/RecetasPage'
import ProduccionPage from './pages/ProduccionPage'
import ClientesPage from './pages/ClientesPage'
import RutasPage from './pages/RutasPage'
import EntregasPage from './pages/EntregasPage'
import EntregaDetallePage from './pages/EntregaDetallePage'

// HOC: Protege la ruta Y la envuelve en AppLayout
function PrivatePage({ element }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {element}
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/"           element={<PrivatePage element={<DashboardPage />} />} />
          <Route path="/insumos"    element={<PrivatePage element={<InsumosPage />} />} />
          <Route path="/productos"  element={<PrivatePage element={<ProductosPage />} />} />
          <Route path="/recetas"    element={<PrivatePage element={<RecetasPage />} />} />
          <Route path="/produccion" element={<PrivatePage element={<ProduccionPage />} />} />
          <Route path="/clientes"   element={<PrivatePage element={<ClientesPage />} />} />
          <Route path="/rutas"      element={<PrivatePage element={<RutasPage />} />} />
          <Route path="/entregas"   element={<PrivatePage element={<EntregasPage />} />} />
          <Route path="/entregas/:id" element={<PrivatePage element={<EntregaDetallePage />} />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
