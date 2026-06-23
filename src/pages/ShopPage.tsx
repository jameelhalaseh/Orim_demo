import { useSearchParams } from 'react-router-dom'
import type { Category } from '../types'
import { repository } from '../data'
import { useI18n } from '../lib/i18n'
import ProductCard from '../components/ProductCard'

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const { t } = useI18n()
  const categories = repository.getCategories()

  const requested = params.get('category')
  const active = categories.find((c) => c.id === requested)?.id ?? null
  const products = repository.getProducts(active ? { category: active as Category } : undefined)

  function selectCategory(id: Category | null) {
    if (id) setParams({ category: id })
    else setParams({})
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl">
          {t('shop.title')}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">{t('shop.subtitle')}</p>
      </header>

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip label={t('shop.all')} active={active === null} onClick={() => selectCategory(null)} />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            label={t(`cat.${c.id}`)}
            active={active === c.id}
            onClick={() => selectCategory(c.id)}
          />
        ))}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">{t('shop.empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-[#C53735] text-white'
          : 'border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
      }`}
    >
      {label}
    </button>
  )
}
