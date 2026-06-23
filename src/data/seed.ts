import type {
  Channel,
  Location,
  MovementReason,
  Order,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  Product,
  StockMovement,
} from '../types'
import { CATALOG } from './products'

// All seed stock lands on a single fixed date (~2 weeks before the demo's
// "today" of 2026-06-23). A fixed timestamp keeps the seed deterministic so
// later date-based reports (e.g. the 7-day revenue chart) are stable.
const SEED_AT = '2026-06-09T08:00:00.000Z'

/** The public catalog with all seed-only fields (initial stock) stripped. */
export function seedProducts(): Product[] {
  return CATALOG.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    cost: p.cost,
    image: p.image,
    images: p.images,
    reorderThreshold: p.reorderThreshold,
    madeToOrder: p.madeToOrder,
    tags: p.tags,
    variants: p.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.label,
      size: v.size,
      color: v.color,
      priceDelta: v.priceDelta,
    })),
  }))
}

/** Initial stock expressed as `restock` ledger movements (warehouse). */
export function seedMovements(): StockMovement[] {
  const movements: StockMovement[] = []
  let n = 0

  for (const p of CATALOG) {
    if (p.variants?.length) {
      for (const v of p.variants) {
        movements.push({
          id: `seed-mv-${++n}`,
          productId: p.id,
          variantId: v.id,
          sku: v.sku,
          reason: 'restock',
          quantity: v.initialStock,
          location: 'warehouse',
          note: 'Initial stock',
          at: SEED_AT,
        })
      }
    } else {
      movements.push({
        id: `seed-mv-${++n}`,
        productId: p.id,
        sku: p.sku,
        reason: 'restock',
        quantity: p.initialStock ?? 0,
        location: 'warehouse',
        note: 'Initial stock',
        at: SEED_AT,
      })
    }
  }

  return movements
}

// ---------------------------------------------------------------------------
// Demo trading history.
//
// Backdated orders across the last 7 days (relative to the demo "today" of
// 2026-06-23), spanning online + bazaar channels with a couple of custom
// orders, so the admin dashboard and sales pages have real data. Each order
// produces sale movements; bazaar sales are backed by warehouse->bazaar
// transfers dated earlier, so no location's stock ever goes negative.
// ---------------------------------------------------------------------------
const TRANSFER_AT = '2026-06-16T09:00:00+03:00'

interface SeedLine {
  p: string // productId
  v?: string // variantId
  q: number
  custom?: boolean
}

interface SeedOrderSpec {
  at: string
  channel: Channel
  payment: PaymentMethod
  status: OrderStatus
  lines: SeedLine[]
}

const SEED_ORDERS: SeedOrderSpec[] = [
  { at: '2026-06-17T10:15:00+03:00', channel: 'online', payment: 'cod', status: 'fulfilled', lines: [{ p: 'book-daily-encouragement', q: 1 }, { p: 'charm-olivewood-cross', q: 2 }] },
  { at: '2026-06-17T16:40:00+03:00', channel: 'bazaar', payment: 'cash', status: 'fulfilled', lines: [{ p: 'home-mug-blessed', q: 3 }] },
  { at: '2026-06-18T11:05:00+03:00', channel: 'online', payment: 'card', status: 'paid', lines: [{ p: 'bottle-bestill-steel', q: 1 }, { p: 'home-tote-olive', q: 1 }] },
  { at: '2026-06-19T13:20:00+03:00', channel: 'online', payment: 'cod', status: 'fulfilled', lines: [{ p: 'tee-faith-classic', v: 'tee-faith-wh-m', q: 2 }] },
  { at: '2026-06-19T18:00:00+03:00', channel: 'bazaar', payment: 'cash', status: 'fulfilled', lines: [{ p: 'charm-olivewood-cross', q: 1 }, { p: 'home-mug-blessed', q: 1 }] },
  { at: '2026-06-20T09:50:00+03:00', channel: 'online', payment: 'cod', status: 'pending', lines: [{ p: 'charm-silver-cross-pendant', q: 1 }] },
  { at: '2026-06-20T20:10:00+03:00', channel: 'online', payment: 'card', status: 'paid', lines: [{ p: 'tee-blank-custom', v: 'tee-blank-bk-l', q: 1, custom: true }] },
  { at: '2026-06-21T12:30:00+03:00', channel: 'bazaar', payment: 'cash', status: 'fulfilled', lines: [{ p: 'home-candle-frankincense', q: 1 }, { p: 'home-tote-olive', q: 2 }] },
  { at: '2026-06-21T15:45:00+03:00', channel: 'online', payment: 'cod', status: 'fulfilled', lines: [{ p: 'book-daily-encouragement', q: 2 }] },
  { at: '2026-06-22T10:00:00+03:00', channel: 'online', payment: 'cod', status: 'pending', lines: [{ p: 'bottle-bestill-steel', q: 1 }, { p: 'charm-olivewood-cross', q: 1 }] },
  { at: '2026-06-22T19:25:00+03:00', channel: 'bazaar', payment: 'cash', status: 'fulfilled', lines: [{ p: 'home-mug-blessed', q: 2 }] },
  { at: '2026-06-23T11:10:00+03:00', channel: 'online', payment: 'card', status: 'paid', lines: [{ p: 'tee-blank-custom', v: 'tee-blank-wh-m', q: 1, custom: true }, { p: 'book-daily-encouragement', q: 1 }] },
  { at: '2026-06-23T14:35:00+03:00', channel: 'online', payment: 'cod', status: 'pending', lines: [{ p: 'tee-faith-classic', v: 'tee-faith-sd-l', q: 1 }] },
]

// Stock physically taken to the bazaar stall this morning and not yet sold —
// gives the POS live inventory out of the box. Transfers preserve product
// totals, so no warehouse/total figure on the admin pages changes.
const STOCK_AT = '2026-06-23T08:00:00+03:00'

const BAZAAR_STOCKING: SeedLine[] = [
  { p: 'charm-olivewood-cross', q: 8 },
  { p: 'home-mug-blessed', q: 6 },
  { p: 'book-daily-encouragement', q: 5 },
  { p: 'bottle-bestill-steel', q: 4 },
  { p: 'tee-faith-classic', v: 'tee-faith-wh-l', q: 5 },
  { p: 'home-tote-olive', q: 6 },
]

function findCatalog(id: string) {
  const product = CATALOG.find((c) => c.id === id)
  if (!product) throw new Error(`seed: unknown product ${id}`)
  return product
}

export function seedActivity(): { orders: Order[]; movements: StockMovement[] } {
  const orders: Order[] = []
  const saleMovements: StockMovement[] = []
  const bazaarNeed = new Map<string, { productId: string; variantId?: string; sku: string; qty: number }>()
  let mvN = 0
  const nextId = () => `seed-act-${++mvN}`

  SEED_ORDERS.forEach((spec, idx) => {
    const seq = idx + 1
    const id = `ord-${seq}`
    const reference = `ORD-${String(seq).padStart(4, '0')}`
    const location: Location = spec.channel === 'bazaar' ? 'bazaar' : 'warehouse'
    const reason: MovementReason = spec.channel === 'bazaar' ? 'sale_bazaar' : 'sale_online'

    const lines: OrderLine[] = spec.lines.map((l) => {
      const product = findCatalog(l.p)
      let sku = product.sku
      let variantLabel: string | undefined
      let unitPrice = product.price
      if (l.v) {
        const variant = product.variants?.find((v) => v.id === l.v)
        if (!variant) throw new Error(`seed: unknown variant ${l.v}`)
        sku = variant.sku
        variantLabel = variant.label
        unitPrice = product.price + (variant.priceDelta ?? 0)
      }
      return {
        productId: product.id,
        variantId: l.v,
        sku,
        name: product.name,
        variantLabel,
        unitPrice,
        unitCost: product.cost,
        quantity: l.q,
        lineTotal: unitPrice * l.q,
        isCustom: l.custom,
      }
    })

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    orders.push({
      id,
      reference,
      channel: spec.channel,
      location,
      lines,
      subtotal,
      discount: 0,
      deliveryFee: 0,
      total: subtotal,
      paymentMethod: spec.payment,
      status: spec.status,
      createdAt: spec.at,
    })

    for (const l of lines) {
      saleMovements.push({
        id: nextId(),
        productId: l.productId,
        variantId: l.variantId,
        sku: l.sku,
        reason,
        quantity: -l.quantity,
        location,
        channel: spec.channel,
        orderId: id,
        note: reference,
        at: spec.at,
      })
      if (spec.channel === 'bazaar') {
        const cur = bazaarNeed.get(l.sku)
        if (cur) cur.qty += l.quantity
        else bazaarNeed.set(l.sku, { productId: l.productId, variantId: l.variantId, sku: l.sku, qty: l.quantity })
      }
    }
  })

  // Transfers to bazaar (dated before any sale) so bazaar stock never goes negative.
  const transferMovements: StockMovement[] = []
  let trN = 0
  bazaarNeed.forEach((need) => {
    const transferId = `seed-transfer-${++trN}`
    transferMovements.push({
      id: nextId(),
      productId: need.productId,
      variantId: need.variantId,
      sku: need.sku,
      reason: 'transfer',
      quantity: -need.qty,
      location: 'warehouse',
      transferId,
      note: 'Stock to bazaar',
      at: TRANSFER_AT,
    })
    transferMovements.push({
      id: nextId(),
      productId: need.productId,
      variantId: need.variantId,
      sku: need.sku,
      reason: 'transfer',
      quantity: need.qty,
      location: 'bazaar',
      transferId,
      note: 'Stock to bazaar',
      at: TRANSFER_AT,
    })
  })

  // Today's bazaar stocking (kept separate so it isn't drawn down by past sales).
  const stockingMovements: StockMovement[] = []
  let stN = 0
  for (const s of BAZAAR_STOCKING) {
    const product = findCatalog(s.p)
    let sku = product.sku
    if (s.v) {
      const variant = product.variants?.find((v) => v.id === s.v)
      if (!variant) throw new Error(`seed: unknown variant ${s.v}`)
      sku = variant.sku
    }
    const transferId = `seed-stock-${++stN}`
    stockingMovements.push({
      id: nextId(),
      productId: product.id,
      variantId: s.v,
      sku,
      reason: 'transfer',
      quantity: -s.q,
      location: 'warehouse',
      transferId,
      note: 'Bazaar stock for today',
      at: STOCK_AT,
    })
    stockingMovements.push({
      id: nextId(),
      productId: product.id,
      variantId: s.v,
      sku,
      reason: 'transfer',
      quantity: s.q,
      location: 'bazaar',
      transferId,
      note: 'Bazaar stock for today',
      at: STOCK_AT,
    })
  }

  return { orders, movements: [...transferMovements, ...stockingMovements, ...saleMovements] }
}
