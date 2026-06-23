import { useState } from 'react'
import {
  Store,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Undo2,
  ClipboardCheck,
  Check,
} from 'lucide-react'
import { repository } from '../../data'
import { formatJOD } from '../../lib/money'
import type { Fils } from '../../lib/money'

interface Unit {
  key: string // sku
  productId: string
  variantId?: string
  sku: string
  name: string
  variantLabel?: string
  image: string
  price: Fils
  bazaar: number
  warehouse: number
}

function bazaarUnits(): Unit[] {
  const units: Unit[] = []
  for (const p of repository.getProducts()) {
    const skus = p.variants?.length
      ? p.variants.map((v) => ({ sku: v.sku, variantId: v.id, label: v.label, price: p.price + (v.priceDelta ?? 0) }))
      : [{ sku: p.sku, variantId: undefined as string | undefined, label: undefined as string | undefined, price: p.price }]
    for (const s of skus) {
      units.push({
        key: s.sku,
        productId: p.id,
        variantId: s.variantId,
        sku: s.sku,
        name: p.name,
        variantLabel: s.label,
        image: p.image,
        price: s.price,
        bazaar: repository.getStock(s.sku, 'bazaar'),
        warehouse: repository.getStock(s.sku, 'warehouse'),
      })
    }
  }
  return units
}

type Tab = 'pos' | 'stock' | 'reconcile'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pos', label: 'Point of sale' },
  { id: 'stock', label: 'Stock' },
  { id: 'reconcile', label: 'Reconciliation' },
]

export default function BazaarPage() {
  const [tab, setTab] = useState<Tab>('pos')
  const [, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)
  const units = bazaarUnits()

  return (
    <div className="px-6 py-7 sm:px-8">
      <div className="flex items-center gap-3">
        <Store size={22} className="text-[#C53735]" />
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Bazaar</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Offline POS, stock transfers, and end-of-day reconciliation for the market stall.
          </p>
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-full border border-neutral-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-[#C53735] text-white' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'pos' && <Pos units={units} onSold={refresh} />}
        {tab === 'stock' && <StockTab units={units} onChange={refresh} />}
        {tab === 'reconcile' && <Reconcile units={units} onPosted={refresh} />}
      </div>
    </div>
  )
}

// --- Point of sale ----------------------------------------------------------
function Pos({ units, onSold }: { units: Unit[]; onSold: () => void }) {
  const sellable = units.filter((u) => u.bazaar > 0)
  const [ticket, setTicket] = useState<{ key: string; qty: number }[]>([])
  const [lastSale, setLastSale] = useState<{ ref: string; total: Fils } | null>(null)

  const lines = ticket
    .map((t) => {
      const unit = units.find((u) => u.key === t.key)
      return unit ? { unit, qty: t.qty } : null
    })
    .filter((l): l is { unit: Unit; qty: number } => l !== null)

  const total = lines.reduce((s, l) => s + l.unit.price * l.qty, 0)

  function addUnit(u: Unit) {
    setLastSale(null)
    setTicket((prev) => {
      const ex = prev.find((t) => t.key === u.key)
      if (ex) return prev.map((t) => (t.key === u.key ? { ...t, qty: Math.min(t.qty + 1, u.bazaar) } : t))
      return [...prev, { key: u.key, qty: 1 }]
    })
  }

  function setQty(key: string, qty: number, max: number) {
    setTicket((prev) =>
      prev.flatMap((t) => (t.key !== key ? [t] : qty <= 0 ? [] : [{ ...t, qty: Math.min(qty, max) }])),
    )
  }

  function complete() {
    if (lines.length === 0) return
    const order = repository.createOrder({
      channel: 'bazaar',
      paymentMethod: 'cash',
      lines: lines.map((l) => ({
        productId: l.unit.productId,
        variantId: l.unit.variantId,
        quantity: l.qty,
      })),
    })
    setLastSale({ ref: order.reference, total: order.total })
    setTicket([])
    onSold()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Product picker */}
      <div className="lg:col-span-2">
        {sellable.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-12 text-center text-sm text-neutral-500">
            No stock at the bazaar yet. Use the <span className="font-medium">Stock</span> tab to take items to the stall.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sellable.map((u) => (
              <button
                key={u.key}
                onClick={() => addUnit(u)}
                className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-left transition-shadow hover:shadow-md"
              >
                <div className="aspect-square bg-neutral-100">
                  <img src={u.image} alt={u.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-medium text-neutral-900">{u.name}</p>
                  {u.variantLabel && <p className="text-xs text-neutral-500">{u.variantLabel}</p>}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">{formatJOD(u.price)}</span>
                    <span className="text-xs text-neutral-400">{u.bazaar} left</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ticket */}
      <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-medium text-neutral-900">Ticket</h2>

        {lastSale && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check size={16} /> {lastSale.ref} — {formatJOD(lastSale.total)} (cash)
          </div>
        )}

        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">Tap a product to add it to the ticket.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={l.unit.key} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{l.unit.name}</p>
                  {l.unit.variantLabel && <p className="text-xs text-neutral-500">{l.unit.variantLabel}</p>}
                </div>
                <div className="flex items-center rounded-full border border-neutral-300">
                  <button onClick={() => setQty(l.unit.key, l.qty - 1, l.unit.bazaar)} aria-label="Decrease" className="px-2 py-1 text-neutral-600 hover:text-neutral-900">
                    <Minus size={13} />
                  </button>
                  <span className="min-w-[1.75rem] text-center text-sm">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.unit.key, l.qty + 1, l.unit.bazaar)}
                    disabled={l.qty >= l.unit.bazaar}
                    aria-label="Increase"
                    className="px-2 py-1 text-neutral-600 hover:text-neutral-900 disabled:text-neutral-300"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-semibold text-neutral-900">
                  {formatJOD(l.unit.price * l.qty)}
                </span>
                <button onClick={() => setQty(l.unit.key, 0, l.unit.bazaar)} aria-label="Remove" className="text-neutral-400 hover:text-[#C53735]">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="text-sm text-neutral-500">Total</span>
          <span className="text-lg font-semibold text-neutral-900">{formatJOD(total)}</span>
        </div>
        <button
          onClick={complete}
          disabled={lines.length === 0}
          className="mt-4 w-full rounded-full bg-[#C53735] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          Complete cash sale
        </button>
      </aside>
    </div>
  )
}

// --- Stock transfers --------------------------------------------------------
function StockTab({ units, onChange }: { units: Unit[]; onChange: () => void }) {
  const toBazaar = units.filter((u) => u.warehouse > 0)
  const fromBazaar = units.filter((u) => u.bazaar > 0)

  const [takeKey, setTakeKey] = useState('')
  const [takeQty, setTakeQty] = useState('1')
  const [returnKey, setReturnKey] = useState('')
  const [returnQty, setReturnQty] = useState('1')

  function take(e: React.FormEvent) {
    e.preventDefault()
    const u = units.find((x) => x.key === takeKey)
    const qty = Math.min(Math.abs(Number(takeQty)), u?.warehouse ?? 0)
    if (!u || !qty) return
    repository.transferStock({ productId: u.productId, variantId: u.variantId, sku: u.sku, quantity: qty, from: 'warehouse', to: 'bazaar' })
    setTakeKey('')
    setTakeQty('1')
    onChange()
  }

  function ret(e: React.FormEvent) {
    e.preventDefault()
    const u = units.find((x) => x.key === returnKey)
    const qty = Math.min(Math.abs(Number(returnQty)), u?.bazaar ?? 0)
    if (!u || !qty) return
    repository.transferStock({ productId: u.productId, variantId: u.variantId, sku: u.sku, quantity: qty, from: 'bazaar', to: 'warehouse' })
    setReturnKey('')
    setReturnQty('1')
    onChange()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={take} className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <ArrowRight size={16} className="text-[#C53735]" /> Take stock to bazaar
        </h2>
        <p className="mt-1 text-xs text-neutral-500">Moves stock warehouse → bazaar.</p>
        <div className="mt-4 space-y-3">
          <select
            value={takeKey}
            onChange={(e) => setTakeKey(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
          >
            <option value="">Select an item…</option>
            {toBazaar.map((u) => (
              <option key={u.key} value={u.key}>
                {u.name}{u.variantLabel ? ` · ${u.variantLabel}` : ''} (wh: {u.warehouse})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={takeQty}
              onChange={(e) => setTakeQty(e.target.value)}
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
            <button type="submit" disabled={!takeKey} className="flex-1 rounded-full bg-[#C53735] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#AE2F2D] disabled:bg-neutral-300">
              Send to bazaar
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={ret} className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <Undo2 size={16} className="text-[#C53735]" /> Return unsold stock
        </h2>
        <p className="mt-1 text-xs text-neutral-500">Moves stock bazaar → warehouse.</p>
        <div className="mt-4 space-y-3">
          <select
            value={returnKey}
            onChange={(e) => setReturnKey(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
          >
            <option value="">Select an item…</option>
            {fromBazaar.map((u) => (
              <option key={u.key} value={u.key}>
                {u.name}{u.variantLabel ? ` · ${u.variantLabel}` : ''} (bazaar: {u.bazaar})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={returnQty}
              onChange={(e) => setReturnQty(e.target.value)}
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
            />
            <button type="submit" disabled={!returnKey} className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:border-neutral-900 disabled:opacity-50">
              Return to warehouse
            </button>
          </div>
        </div>
      </form>

      {/* Current bazaar stock */}
      <div className="rounded-2xl border border-neutral-200 bg-white lg:col-span-2">
        <h2 className="border-b border-neutral-200 px-5 py-4 text-sm font-medium text-neutral-900">
          At the bazaar now
        </h2>
        {fromBazaar.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">Nothing at the bazaar.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 text-right font-medium">Warehouse</th>
                <th className="px-5 py-3 text-right font-medium">Bazaar</th>
              </tr>
            </thead>
            <tbody>
              {fromBazaar.map((u) => (
                <tr key={u.key} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-3 text-neutral-900">
                    {u.name}
                    {u.variantLabel ? <span className="text-neutral-400"> · {u.variantLabel}</span> : ''}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{u.sku}</td>
                  <td className="px-5 py-3 text-right text-neutral-500">{u.warehouse}</td>
                  <td className="px-5 py-3 text-right font-medium text-neutral-900">{u.bazaar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// --- Reconciliation ---------------------------------------------------------
function Reconcile({ units, onPosted }: { units: Unit[]; onPosted: () => void }) {
  const rows = units.filter((u) => u.bazaar > 0)
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState('')

  function post() {
    let posted = 0
    for (const u of rows) {
      const raw = counts[u.key]
      if (raw === undefined || raw === '') continue
      const counted = Number(raw)
      if (Number.isNaN(counted)) continue
      const delta = counted - u.bazaar
      if (delta !== 0) {
        repository.recordStockMovement({
          productId: u.productId,
          variantId: u.variantId,
          sku: u.sku,
          reason: 'adjustment',
          quantity: delta,
          location: 'bazaar',
          note: 'Bazaar reconciliation',
        })
        posted++
      }
    }
    setCounts({})
    setSummary(posted === 0 ? 'No differences — everything reconciled.' : `${posted} adjustment${posted === 1 ? '' : 's'} posted to the ledger.`)
    onPosted()
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-12 text-center text-sm text-neutral-500">
        Nothing at the bazaar to reconcile.
      </p>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <ClipboardCheck size={16} className="text-[#C53735]" /> End-of-bazaar count
        </h2>
        <button onClick={post} className="rounded-full bg-[#C53735] px-4 py-2 text-sm font-medium text-white hover:bg-[#AE2F2D]">
          Post adjustments
        </button>
      </div>

      {summary && <p className="px-5 pt-3 text-sm text-emerald-600">{summary}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
            <th className="px-5 py-3 font-medium">Item</th>
            <th className="px-5 py-3 text-right font-medium">Expected</th>
            <th className="px-5 py-3 text-right font-medium">Counted</th>
            <th className="px-5 py-3 text-right font-medium">Variance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const raw = counts[u.key]
            const counted = raw === undefined || raw === '' ? null : Number(raw)
            const variance = counted === null || Number.isNaN(counted) ? null : counted - u.bazaar
            return (
              <tr key={u.key} className="border-b border-neutral-50 last:border-0">
                <td className="px-5 py-3 text-neutral-900">
                  {u.name}
                  {u.variantLabel ? <span className="text-neutral-400"> · {u.variantLabel}</span> : ''}
                </td>
                <td className="px-5 py-3 text-right font-medium text-neutral-900">{u.bazaar}</td>
                <td className="px-5 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    value={raw ?? ''}
                    onChange={(e) => setCounts((c) => ({ ...c, [u.key]: e.target.value }))}
                    placeholder="—"
                    className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-right text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  {variance === null ? (
                    <span className="text-neutral-300">—</span>
                  ) : variance === 0 ? (
                    <span className="font-medium text-emerald-600">0</span>
                  ) : (
                    <span className={`font-medium ${variance < 0 ? 'text-[#C53735]' : 'text-amber-600'}`}>
                      {variance > 0 ? `+${variance}` : variance}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="px-5 py-3 text-xs text-neutral-400">
        Posting writes an <span className="font-medium">adjustment</span> movement per difference, so the ledger matches the physical count.
      </p>
    </div>
  )
}
