import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
]

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2.5 font-medium text-neutral-900">
          <img src="/orim-logo.png" alt="Orim logo" className="h-8 w-8 rounded-full" />
          <span>Orim</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/cart"
            aria-label="Cart"
            className="ml-1 flex items-center gap-1.5 rounded-full bg-[#C53735] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
          >
            <ShoppingBag size={16} />
            <span>Cart</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
