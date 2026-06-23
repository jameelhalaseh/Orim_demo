import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Boxes, Receipt, Store, ArrowLeft } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Sales', to: '/admin/sales', icon: Receipt },
  { label: 'Bazaar', to: '/admin/bazaar', icon: Store },
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src="/orim-logo.png" alt="Orim logo" className="h-8 w-8 rounded-full" />
          <div className="leading-tight">
            <div className="text-sm font-medium">Orim</div>
            <div className="text-xs text-neutral-400">Back office</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#C53735] text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-neutral-200 px-3 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            Back to store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
