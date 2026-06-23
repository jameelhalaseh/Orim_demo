import type {
  Category,
  CategoryMeta,
  Channel,
  CustomerInfo,
  Location,
  MovementReason,
  Order,
  OrderLine,
  PaymentMethod,
  Product,
  StockMovement,
} from '../types'
import type { Fils } from '../lib/money'
import { CATEGORIES } from './categories'
import { seedActivity, seedMovements, seedProducts } from './seed'

// ---------------------------------------------------------------------------
// In-memory store.
//
// This is the ONLY data store right now — there is no backend and nothing is
// persisted, so state resets on reload (this is explicit and intentional;
// persistence, if/when added, lives behind this same Repository interface).
// A Supabase-backed implementation can later satisfy `Repository` without any
// UI change.
// ---------------------------------------------------------------------------
const products: Product[] = seedProducts()
const seededActivity = seedActivity()
const movements: StockMovement[] = [...seedMovements(), ...seededActivity.movements]
const orders: Order[] = seededActivity.orders

let movementSeq = movements.length
let orderSeq = orders.length
let transferSeq = 0
let productSeq = 0

function nextMovementId(): string {
  return `mv-${++movementSeq}`
}

function orderReference(seq: number): string {
  return `ORD-${String(seq).padStart(4, '0')}`
}

function now(): string {
  return new Date().toISOString()
}

// --- Input / output shapes ---------------------------------------------------
export interface MovementInput {
  productId: string
  variantId?: string
  sku: string
  reason: MovementReason
  quantity: number
  location: Location
  channel?: Channel
  orderId?: string
  transferId?: string
  note?: string
}

export interface MovementFilter {
  sku?: string
  productId?: string
  location?: Location
  reason?: MovementReason
  channel?: Channel
}

export interface TransferInput {
  productId: string
  variantId?: string
  sku: string
  quantity: number
  from?: Location // default 'warehouse'
  to?: Location // default 'bazaar'
  note?: string
}

export interface OrderLineInput {
  productId: string
  variantId?: string
  quantity: number
  isCustom?: boolean
}

export interface CreateOrderInput {
  channel: Channel
  lines: OrderLineInput[]
  paymentMethod: PaymentMethod
  customer?: CustomerInfo
  couponCode?: string
  discount?: Fils
  deliveryFee?: Fils
}

export interface CreateProductInput {
  name: string
  category: Category
  description?: string
  price: Fils
  cost: Fils
  reorderThreshold: number
  initialStock: number
  image?: string
}

export interface ProductStock {
  total: number
  byLocation: Record<Location, number>
  bySku: Record<string, number>
}

export interface Repository {
  getProducts(filter?: { category?: Category }): Product[]
  getProduct(id: string): Product | undefined
  getCategories(): CategoryMeta[]
  createProduct(input: CreateProductInput): Product
  getStock(sku: string, location?: Location): number
  getProductStock(productId: string): ProductStock
  recordStockMovement(input: MovementInput): StockMovement
  listMovements(filter?: MovementFilter): StockMovement[]
  transferStock(input: TransferInput): StockMovement[]
  createOrder(input: CreateOrderInput): Order
  listOrders(filter?: { channel?: Channel }): Order[]
  getOrder(id: string): Order | undefined
}

// --- Helpers -----------------------------------------------------------------
function skusForProduct(product: Product): string[] {
  return product.variants?.length ? product.variants.map((v) => v.sku) : [product.sku]
}

interface ResolvedLine {
  sku: string
  unitPrice: Fils
  unitCost: Fils
  name: string
  variantLabel?: string
}

function resolveLine(productId: string, variantId?: string): ResolvedLine {
  const product = products.find((p) => p.id === productId)
  if (!product) throw new Error(`Unknown product: ${productId}`)

  if (variantId) {
    const variant = product.variants?.find((v) => v.id === variantId)
    if (!variant) throw new Error(`Unknown variant: ${variantId} on ${productId}`)
    return {
      sku: variant.sku,
      unitPrice: product.price + (variant.priceDelta ?? 0),
      unitCost: product.cost,
      name: product.name,
      variantLabel: variant.label,
    }
  }

  return { sku: product.sku, unitPrice: product.price, unitCost: product.cost, name: product.name }
}

// --- Repository implementation ----------------------------------------------
export const repository: Repository = {
  getProducts(filter) {
    const list = filter?.category ? products.filter((p) => p.category === filter.category) : products
    return [...list]
  },

  getProduct(id) {
    return products.find((p) => p.id === id)
  },

  getCategories() {
    return [...CATEGORIES]
  },

  createProduct(input) {
    const seq = ++productSeq
    const id = `custom-${seq}`
    const sku = `CUST-${String(seq).padStart(3, '0')}`
    const product: Product = {
      id,
      sku,
      name: input.name,
      category: input.category,
      description: input.description ?? '',
      price: input.price,
      cost: input.cost,
      image:
        input.image ||
        `https://placehold.co/800x800/f5f5f4/c53735?text=${encodeURIComponent(input.name)}&font=montserrat`,
      reorderThreshold: input.reorderThreshold,
    }
    products.push(product)

    if (input.initialStock > 0) {
      this.recordStockMovement({
        productId: id,
        sku,
        reason: 'restock',
        quantity: input.initialStock,
        location: 'warehouse',
        note: 'Initial stock',
      })
    }

    return product
  },

  getStock(sku, location) {
    return movements
      .filter((m) => m.sku === sku && (location ? m.location === location : true))
      .reduce((sum, m) => sum + m.quantity, 0)
  },

  getProductStock(productId) {
    const byLocation: Record<Location, number> = { warehouse: 0, bazaar: 0 }
    const bySku: Record<string, number> = {}
    let total = 0

    const product = products.find((p) => p.id === productId)
    if (!product) return { total, byLocation, bySku }

    const skus = skusForProduct(product)
    for (const sku of skus) bySku[sku] = 0

    for (const m of movements) {
      if (!skus.includes(m.sku)) continue
      total += m.quantity
      byLocation[m.location] += m.quantity
      bySku[m.sku] += m.quantity
    }

    return { total, byLocation, bySku }
  },

  recordStockMovement(input) {
    const movement: StockMovement = { id: nextMovementId(), at: now(), ...input }
    movements.push(movement)
    return movement
  },

  listMovements(filter) {
    let list = [...movements]
    if (filter?.sku) list = list.filter((m) => m.sku === filter.sku)
    if (filter?.productId) list = list.filter((m) => m.productId === filter.productId)
    if (filter?.location) list = list.filter((m) => m.location === filter.location)
    if (filter?.reason) list = list.filter((m) => m.reason === filter.reason)
    if (filter?.channel) list = list.filter((m) => m.channel === filter.channel)
    // newest first
    return list.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  },

  transferStock(input) {
    const from = input.from ?? 'warehouse'
    const to = input.to ?? 'bazaar'
    const qty = Math.abs(input.quantity)
    const transferId = `transfer-${++transferSeq}`
    const base = { productId: input.productId, variantId: input.variantId, sku: input.sku }

    const out = this.recordStockMovement({
      ...base,
      reason: 'transfer',
      quantity: -qty,
      location: from,
      transferId,
      note: input.note,
    })
    const into = this.recordStockMovement({
      ...base,
      reason: 'transfer',
      quantity: qty,
      location: to,
      transferId,
      note: input.note,
    })
    return [out, into]
  },

  createOrder(input) {
    const location: Location = input.channel === 'bazaar' ? 'bazaar' : 'warehouse'
    const reason: MovementReason = input.channel === 'bazaar' ? 'sale_bazaar' : 'sale_online'

    const lines: OrderLine[] = input.lines.map((l) => {
      const r = resolveLine(l.productId, l.variantId)
      return {
        productId: l.productId,
        variantId: l.variantId,
        sku: r.sku,
        name: r.name,
        variantLabel: r.variantLabel,
        unitPrice: r.unitPrice,
        unitCost: r.unitCost,
        quantity: l.quantity,
        lineTotal: r.unitPrice * l.quantity,
        isCustom: l.isCustom,
      }
    })

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    const discount = input.discount ?? 0
    const deliveryFee = input.deliveryFee ?? 0
    const total = Math.max(0, subtotal - discount) + deliveryFee

    const seq = ++orderSeq
    const order: Order = {
      id: `ord-${seq}`,
      reference: orderReference(seq),
      channel: input.channel,
      location,
      lines,
      subtotal,
      discount,
      deliveryFee,
      total,
      couponCode: input.couponCode,
      paymentMethod: input.paymentMethod,
      status: input.paymentMethod === 'card' ? 'paid' : 'pending',
      customer: input.customer,
      createdAt: now(),
    }
    orders.push(order)

    // Append one stock-out movement per line — the ledger is the source of truth.
    for (const l of lines) {
      this.recordStockMovement({
        productId: l.productId,
        variantId: l.variantId,
        sku: l.sku,
        reason,
        quantity: -l.quantity,
        location,
        channel: input.channel,
        orderId: order.id,
        note: order.reference,
      })
    }

    return order
  },

  listOrders(filter) {
    const list = filter?.channel ? orders.filter((o) => o.channel === filter.channel) : orders
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  },

  getOrder(id) {
    return orders.find((o) => o.id === id)
  },
}
