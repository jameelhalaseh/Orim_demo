import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import PublicLayout from './components/PublicLayout'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import InventoryPage from './pages/admin/InventoryPage'
import SalesPage from './pages/admin/SalesPage'
import BazaarPage from './pages/admin/BazaarPage'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Hero landing (full-bleed, its own nav) */}
          <Route path="/" element={<HomePage />} />

          {/* Public shop (shared nav + cart drawer) */}
          <Route element={<PublicLayout />}>
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>

          {/* Admin back office */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="bazaar" element={<BazaarPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}
