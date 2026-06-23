import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatJOD } from '../lib/money'

export default function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, count, updateQty, removeItem } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCart()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  function goTo(path: string) {
    closeCart()
    navigate(path)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity motion-reduce:transition-none ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#C53735]" />
            <h2 className="text-sm font-medium">Your cart{count > 0 ? ` (${count})` : ''}</h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X size={18} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag size={32} className="text-neutral-300" />
            <p className="text-sm text-neutral-500">Your cart is empty.</p>
            <button
              onClick={() => goTo('/shop')}
              className="rounded-full bg-[#C53735] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-lg border border-neutral-200 object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-neutral-500">{item.variantLabel}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#C53735]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-neutral-300">
                        <button
                          onClick={() => updateQty(item.key, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="px-2 py-1 text-neutral-600 hover:text-neutral-900"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                          className="px-2 py-1 text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatJOD(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-neutral-200 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatJOD(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">Free delivery in Amman &amp; Beirut.</p>
              <button
                onClick={() => goTo('/checkout')}
                className="mt-3 w-full rounded-full bg-[#C53735] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
              >
                Checkout
              </button>
              <button
                onClick={() => goTo('/cart')}
                className="mt-2 w-full rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                View cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
