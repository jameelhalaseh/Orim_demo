import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { Product } from '../types'
import { formatJOD } from '../lib/money'
import { repository } from '../data'
import { useCart } from '../context/CartContext'
import StockBadge from './StockBadge'

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const hasVariants = !!product.variants?.length
  const total = repository.getProductStock(product.id).total
  const outOfStock = total <= 0
  const categoryLabel =
    repository.getCategories().find((c) => c.id === product.category)?.label ?? product.category

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md motion-reduce:transition-none">
      <Link to={`/product/${product.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C53735]">
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
          <div className="absolute left-3 top-3">
            <StockBadge total={total} threshold={product.reorderThreshold} />
          </div>
        </div>
        <div className="px-4 pt-3.5">
          <p className="text-xs uppercase tracking-wide text-neutral-400">{categoryLabel}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-neutral-900">{product.name}</h3>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-2 px-4 pb-4 pt-3">
        <span className="text-sm font-semibold text-neutral-900">{formatJOD(product.price)}</span>
        {hasVariants ? (
          <Link
            to={`/product/${product.id}`}
            className="rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            Choose options
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => addItem({ productId: product.id })}
            disabled={outOfStock}
            className="inline-flex items-center gap-1 rounded-full bg-[#C53735] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#AE2F2D] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            <Plus size={14} />
            {outOfStock ? 'Sold out' : 'Add'}
          </button>
        )}
      </div>
    </div>
  )
}
