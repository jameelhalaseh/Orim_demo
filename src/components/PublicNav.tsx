import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
]

export default function PublicNav() {
  const { count, openCart } = useCart()

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
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
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
            className="relative ml-1 flex items-center gap-1.5 rounded-full bg-[#C53735] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
          >
            <ShoppingBag size={16} />
            <span>Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-[#C53735] shadow ring-1 ring-[#C53735]/20">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}
