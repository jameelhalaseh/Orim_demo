import { useState } from 'react'
import { Plus, History, SlidersHorizontal } from 'lucide-react'
import type { Category, Location, MovementReason, Product } from '../../types'
import { repository } from '../../data'
import { formatJOD, jod } from '../../lib/money'
import { formatAmmanDateTime } from '../../lib/datetime'
import StockBadge from '../../components/StockBadge'
import Modal from '../../components/admin/Modal'

type ModalState =
  | { type: 'add' }
  | { type: 'adjust'; product: Product }
  | { type: 'history'; product: Product }
  | null

export default function InventoryPage() {
  const [, setVersion] = useState(0)
  const [modal, setModal] = useState<ModalState>(null)
  const done = () => {
    setVersion((v) => v + 1)
    setModal(null)
  }

  const categories = repository.getCategories()

  return (
    <div className="px-6 py-7 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Inventory</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Stock is derived from the movement ledger — adjustments append a movement, never overwrite.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 rounded-full bg-[#C53735] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      {categories.map((cat) => {
        const products = repository.getProducts({ category: cat.id })
        if (products.length === 0) return null
        return (
          <section key={cat.id} className="mt-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {cat.label}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Reorder</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const stock = repository.getProductStock(p.id)
                    return (
                      <tr key={p.id} className="border-b border-neutral-50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 shrink-0 rounded-lg border border-neutral-200 object-cover"
                            />
                            <div>
                              <p className="font-medium text-neutral-900">{p.name}</p>
                              <p className="text-xs text-neutral-400">
                                {p.sku}
                                {p.variants?.length ? ` · ${p.variants.length} variants` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900">{stock.total}</span>
                            <StockBadge total={stock.total} threshold={p.reorderThreshold} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-500">{p.reorderThreshold}</td>
                        <td className="px-4 py-3 text-neutral-500">{formatJOD(p.cost)}</td>
                        <td className="px-4 py-3 text-neutral-900">{formatJOD(p.price)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ type: 'adjust', product: p })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-900"
                            >
                              <SlidersHorizontal size={13} /> Adjust
                            </button>
                            <button
                              onClick={() => setModal({ type: 'history', product: p })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-900"
                            >
                              <History size={13} /> History
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      {modal?.type === 'add' && <AddForm onDone={done} />}
      {modal?.type === 'adjust' && <AdjustForm product={modal.product} onDone={done} />}
      {modal?.type === 'history' && <HistoryView product={modal.product} onClose={() => setModal(null)} />}
    </div>
  )
}

// --- Adjust stock -----------------------------------------------------------
const REASONS: { value: MovementReason; label: string }[] = [
  { value: 'restock', label: 'Restock' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Customer return' },
]

function AdjustForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const hasVariants = !!product.variants?.length
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id ?? '')
  const [reason, setReason] = useState<MovementReason>('restock')
  const [direction, setDirection] = useState<'add' | 'remove'>('add')
  const [quantity, setQuantity] = useState('1')
  const [location, setLocation] = useState<Location>('warehouse')
  const [note, setNote] = useState('')

  const variant = product.variants?.find((v) => v.id === variantId)
  const sku = variant?.sku ?? product.sku
  const current = repository.getStock(sku, location)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const qty = Math.abs(Number(quantity))
    if (!qty) return
    repository.recordStockMovement({
      productId: product.id,
      variantId: variant?.id,
      sku,
      reason,
      quantity: direction === 'remove' ? -qty : qty,
      location,
      note: note || undefined,
    })
    onDone()
  }

  return (
    <Modal title={`Adjust stock — ${product.name}`} onClose={onDone}>
      <form onSubmit={submit} className="space-y-4">
        {hasVariants && (
          <Labeled label="Variant">
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            >
              {product.variants!.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.sku})
                </option>
              ))}
            </select>
          </Labeled>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Reason">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as MovementReason)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Direction">
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'add' | 'remove')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            >
              <option value="add">Add stock (+)</option>
              <option value="remove">Remove stock (−)</option>
            </select>
          </Labeled>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Quantity">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
          </Labeled>
          <Labeled label="Location">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as Location)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            >
              <option value="warehouse">Warehouse</option>
              <option value="bazaar">Bazaar</option>
            </select>
          </Labeled>
        </div>

        <Labeled label="Note (optional)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
          />
        </Labeled>

        <p className="text-xs text-neutral-400">
          Current {location} stock for {sku}: <span className="font-medium text-neutral-600">{current}</span>
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onDone} className="rounded-full px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-900">
            Cancel
          </button>
          <button type="submit" className="rounded-full bg-[#C53735] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#AE2F2D]">
            Record movement
          </button>
        </div>
      </form>
    </Modal>
  )
}

// --- Add product ------------------------------------------------------------
function AddForm({ onDone }: { onDone: () => void }) {
  const categories = repository.getCategories()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>(categories[0].id)
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [stock, setStock] = useState('0')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    repository.createProduct({
      name: name.trim(),
      category,
      price: jod(Number(price) || 0),
      cost: jod(Number(cost) || 0),
      reorderThreshold: Number(threshold) || 0,
      initialStock: Number(stock) || 0,
    })
    onDone()
  }

  return (
    <Modal title="Add product" onClose={onDone}>
      <form onSubmit={submit} className="space-y-4">
        <Labeled label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
          />
        </Labeled>
        <Labeled label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Labeled>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Price (JOD)">
            <input
              type="number"
              step="0.001"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
          </Labeled>
          <Labeled label="Cost (JOD)">
            <input
              type="number"
              step="0.001"
              min={0}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
          </Labeled>
          <Labeled label="Reorder threshold">
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
          </Labeled>
          <Labeled label="Initial stock">
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
          </Labeled>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onDone} className="rounded-full px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-900">
            Cancel
          </button>
          <button type="submit" className="rounded-full bg-[#C53735] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#AE2F2D]">
            Create product
          </button>
        </div>
      </form>
    </Modal>
  )
}

// --- Movement history -------------------------------------------------------
function HistoryView({ product, onClose }: { product: Product; onClose: () => void }) {
  const movements = repository.listMovements({ productId: product.id })
  return (
    <Modal title={`Movement history — ${product.name}`} onClose={onClose}>
      {movements.length === 0 ? (
        <p className="text-sm text-neutral-500">No movements yet.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Reason</th>
                <th className="py-2 pr-3 font-medium">SKU</th>
                <th className="py-2 pr-3 font-medium">Loc.</th>
                <th className="py-2 pl-3 text-right font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-neutral-50 last:border-0">
                  <td className="py-2 pr-3 text-neutral-500">{formatAmmanDateTime(m.at)}</td>
                  <td className="py-2 pr-3 capitalize text-neutral-700">{m.reason.replace('_', ' ')}</td>
                  <td className="py-2 pr-3 text-neutral-500">{m.sku}</td>
                  <td className="py-2 pr-3 capitalize text-neutral-500">{m.location}</td>
                  <td
                    className={`py-2 pl-3 text-right font-medium ${
                      m.quantity >= 0 ? 'text-emerald-600' : 'text-[#C53735]'
                    }`}
                  >
                    {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

// --- Small labelled field ---------------------------------------------------
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  )
}
