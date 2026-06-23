import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatJOD } from '../lib/money'

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-20 text-center">
        <ShoppingBag size={36} className="mx-auto text-neutral-300" />
        <h1 className="mt-4 text-2xl font-medium text-neutral-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Find something encouraging to share.</p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-[#C53735] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
        >
          Browse the shop
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <h1 className="mb-8 text-3xl font-medium tracking-tight text-neutral-900">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lines */}
        <ul className="divide-y divide-neutral-100 lg:col-span-2">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5">
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-24 shrink-0 rounded-xl border border-neutral-200 object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium text-neutral-900">{item.name}</h2>
                    {item.variantLabel && (
                      <p className="text-xs text-neutral-500">{item.variantLabel}</p>
                    )}
                    <p className="mt-1 text-sm text-neutral-500">{formatJOD(item.unitPrice)} each</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#C53735]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-neutral-300">
                    <button
                      onClick={() => updateQty(item.key, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="px-2.5 py-1.5 text-neutral-600 hover:text-neutral-900"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-[2.25rem] text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      aria-label="Increase quantity"
                      className="px-2.5 py-1.5 text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
                    >
                      <Plus size={15} />
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

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-sm font-medium text-neutral-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd className="font-medium text-neutral-900">{formatJOD(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery</dt>
              <dd className="font-medium text-emerald-600">Free</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
              <dt className="font-medium text-neutral-900">Total</dt>
              <dd className="font-semibold text-neutral-900">{formatJOD(subtotal)}</dd>
            </div>
          </dl>
          <Link
            to="/checkout"
            className="mt-5 block rounded-full bg-[#C53735] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
          >
            Proceed to checkout
          </Link>
          <Link
            to="/shop"
            className="mt-2 block text-center text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  )
}
