import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'
import CartDrawer from './CartDrawer'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <PublicNav />
      <Outlet />
      <CartDrawer />
    </div>
  )
}
