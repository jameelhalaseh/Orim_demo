import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react'
import { repository } from '../data'
import { formatJOD } from '../lib/money'
import { useCart } from '../context/CartContext'
import StockBadge from '../components/StockBadge'

function unique<T>(values: (T | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== undefined))]
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const product = id ? repository.getProduct(id) : undefined
  const { addItem } = useCart()

  const variants = product?.variants ?? []
  const colors = unique(variants.map((v) => v.color))
  const sizes = unique(variants.map((v) => v.size))

  const [color, setColor] = useState<string | undefined>(colors[0])
  const [size, setSize] = useState<string | undefined>(sizes[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-2xl font-medium text-neutral-900">Product not found</h1>
        <Link to="/shop" className="mt-4 inline-block text-sm font-medium text-[#C53735] hover:underline">
          Back to shop
        </Link>
      </main>
    )
  }

  const hasVariants = variants.length > 0
  const selectedVariant = hasVariants
    ? variants.find((v) => v.color === color && v.size === size)
    : undefined
  const sku = selectedVariant?.sku ?? product.sku
  const available = repository.getStock(sku)
  const totalStock = repository.getProductStock(product.id).total
  const unitPrice = product.price + (selectedVariant?.priceDelta ?? 0)
  const needsSelection = hasVariants && !selectedVariant
  const canAdd = available > 0 && !needsSelection

  function stockForSize(s: string | undefined): number {
    const v = variants.find((vv) => vv.color === color && vv.size === s)
    return v ? repository.getStock(v.sku) : 0
  }

  function handleAdd() {
    if (!canAdd) return
    addItem({ productId: product!.id, variantId: selectedVariant?.id, quantity: qty })
    setAdded(true)
    setQty(1)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <Link
        to="/shop"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft size={16} />
        Back to shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
        </div>

        {/* Details */}
        <div>
          <StockBadge total={totalStock} threshold={product.reorderThreshold} />
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{formatJOD(unitPrice)}</p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.description}</p>

          {/* Colour selector */}
          {colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Colour: <span className="text-neutral-900">{color}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      color === c
                        ? 'border-[#C53735] bg-[#C53735]/5 text-[#C53735]'
                        : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Size: <span className="text-neutral-900">{size}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const soldOut = stockForSize(s) <= 0
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      disabled={soldOut}
                      className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm transition-colors ${
                        size === s
                          ? 'border-[#C53735] bg-[#C53735]/5 text-[#C53735]'
                          : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
                      } disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300 disabled:line-through`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity + availability */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-neutral-300">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="px-3 py-2 text-neutral-600 hover:text-neutral-900"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-medium">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(Math.max(available, 1), q + 1))}
                disabled={qty >= available}
                aria-label="Increase quantity"
                className="px-3 py-2 text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-neutral-500">
              {available > 0 ? `${available} available` : 'Currently unavailable'}
            </span>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C53735] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D] disabled:cursor-not-allowed disabled:bg-neutral-300 sm:w-auto sm:px-10"
          >
            {added ? (
              <>
                <Check size={18} /> Added to cart
              </>
            ) : needsSelection ? (
              'Select options'
            ) : available <= 0 ? (
              'Sold out'
            ) : (
              'Add to cart'
            )}
          </button>

          {product.madeToOrder && (
            <Link
              to="/custom"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C53735] px-5 py-2.5 text-sm font-medium text-[#C53735] transition-colors hover:bg-[#C53735]/5"
            >
              Design your own →
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
