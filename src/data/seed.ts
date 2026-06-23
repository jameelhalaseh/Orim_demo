import type { Product, StockMovement } from '../types'
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
