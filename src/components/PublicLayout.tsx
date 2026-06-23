import { Outlet } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import PublicNav from './PublicNav'
import CartDrawer from './CartDrawer'

export default function PublicLayout() {
  const { dir } = useI18n()
  return (
    <div dir={dir} className="min-h-screen bg-white text-neutral-900">
      <PublicNav />
      <Outlet />
      <CartDrawer />
    </div>
  )
}
