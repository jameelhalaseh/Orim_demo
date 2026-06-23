// Supabase implementation of AsyncRepository.
//
// SCAFFOLD: this compiles against the @supabase/supabase-js types and follows
// the schema in ./schema.sql, but it has NOT been run against a live database
// yet. Stock is still derived from the immutable stock_movements ledger (summed
// here); variants and order lines are stored as JSONB to mirror the domain
// types 1:1. See ./README.md for setup and the remaining work.

import type {
  Category,
  Channel,
  Location,
  MovementReason,
  Order,
  OrderLine,
  Product,
  StockMovement,
  Variant,
} from '../../types'
import type { AsyncRepository } from '../asyncRepository'
import { CATEGORIES } from '../categories'
import { getSupabaseClient } from './client'

// --- Row shapes (snake_case, as stored) -------------------------------------
interface ProductRow {
  id: string
  sku: string
  name: string
  category: string
  description: string
  price: number
  cost: number
  image: string
  images: string[] | null
  reorder_threshold: number
  variants: Variant[] | null
  made_to_order: boolean | null
  tags: string[] | null
}

interface MovementRow {
  id: string
  product_id: string
  variant_id: string | null
  sku: string
  reason: string
  quantity: number
  location: string
  channel: string | null
  order_id: string | null
  transfer_id: string | null
  note: string | null
  at: string
}

interface OrderRow {
  id: string
  reference: string
  channel: string
  location: string
  lines: OrderLine[]
  subtotal: number
  discount: number
  delivery_fee: number
  total: number
  coupon_code: string | null
  payment_method: string
  status: string
  customer: Order['customer'] | null
  created_at: string
}

// --- Mappers ----------------------------------------------------------------
function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category as Category,
    description: r.description,
    price: r.price,
    cost: r.cost,
    image: r.image,
    images: r.images ?? undefined,
    reorderThreshold: r.reorder_threshold,
    variants: r.variants ?? undefined,
    madeToOrder: r.made_to_order ?? undefined,
    tags: r.tags ?? undefined,
  }
}

function mapMovement(r: MovementRow): StockMovement {
  return {
    id: r.id,
    productId: r.product_id,
    variantId: r.variant_id ?? undefined,
    sku: r.sku,
    reason: r.reason as MovementReason,
    quantity: r.quantity,
    location: r.location as Location,
    channel: (r.channel ?? undefined) as Channel | undefined,
    orderId: r.order_id ?? undefined,
    transferId: r.transfer_id ?? undefined,
    note: r.note ?? undefined,
    at: r.at,
  }
}

function mapOrder(r: OrderRow): Order {
  return {
    id: r.id,
    reference: r.reference,
    channel: r.channel as Channel,
    location: r.location as Location,
    lines: r.lines,
    subtotal: r.subtotal,
    discount: r.discount,
    deliveryFee: r.delivery_fee,
    total: r.total,
    couponCode: r.coupon_code ?? undefined,
    paymentMethod: r.payment_method as Order['paymentMethod'],
    status: r.status as Order['status'],
    customer: r.customer ?? undefined,
    createdAt: r.created_at,
  }
}

function fail(message: string | undefined): never {
  throw new Error(`Supabase: ${message ?? 'unknown error'}`)
}

function nowIso(): string {
  return new Date().toISOString()
}

function skusForProduct(product: Product): string[] {
  return product.variants?.length ? product.variants.map((v) => v.sku) : [product.sku]
}

// --- Adapter ----------------------------------------------------------------
export const supabaseRepository: AsyncRepository = {
  async getProducts(filter) {
    const sb = getSupabaseClient()
    let query = sb.from('products').select('*')
    if (filter?.category) query = query.eq('category', filter.category)
    const { data, error } = await query
    if (error) fail(error.message)
    return (data as ProductRow[]).map(mapProduct)
  },

  async getProduct(id) {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('products').select('*').eq('id', id).maybeSingle()
    if (error) fail(error.message)
    return data ? mapProduct(data as ProductRow) : undefined
  },

  async getCategories() {
    // Categories are static brand metadata, not a table.
    return [...CATEGORIES]
  },

  async createProduct(input) {
    const sb = getSupabaseClient()
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const id = `custom-${slug}-${crypto.randomUUID().slice(0, 8)}`
    const sku = `CUST-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const row = {
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
      reorder_threshold: input.reorderThreshold,
    }
    const { data, error } = await sb.from('products').insert(row).select().single()
    if (error) fail(error.message)
    const product = mapProduct(data as ProductRow)

    if (input.initialStock > 0) {
      await this.recordStockMovement({
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

  async getStock(sku, location) {
    const sb = getSupabaseClient()
    let query = sb.from('stock_movements').select('quantity').eq('sku', sku)
    if (location) query = query.eq('location', location)
    const { data, error } = await query
    if (error) fail(error.message)
    return (data as { quantity: number }[]).reduce((sum, r) => sum + r.quantity, 0)
  },

  async getProductStock(productId) {
    const byLocation: Record<Location, number> = { warehouse: 0, bazaar: 0 }
    const bySku: Record<string, number> = {}
    let total = 0

    const product = await this.getProduct(productId)
    if (!product) return { total, byLocation, bySku }

    const skus = skusForProduct(product)
    for (const sku of skus) bySku[sku] = 0

    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('stock_movements')
      .select('sku,quantity,location')
      .in('sku', skus)
    if (error) fail(error.message)

    for (const r of data as { sku: string; quantity: number; location: Location }[]) {
      total += r.quantity
      byLocation[r.location] += r.quantity
      bySku[r.sku] = (bySku[r.sku] ?? 0) + r.quantity
    }
    return { total, byLocation, bySku }
  },

  async recordStockMovement(input) {
    const sb = getSupabaseClient()
    const row = {
      product_id: input.productId,
      variant_id: input.variantId ?? null,
      sku: input.sku,
      reason: input.reason,
      quantity: input.quantity,
      location: input.location,
      channel: input.channel ?? null,
      order_id: input.orderId ?? null,
      transfer_id: input.transferId ?? null,
      note: input.note ?? null,
      at: nowIso(),
    }
    const { data, error } = await sb.from('stock_movements').insert(row).select().single()
    if (error) fail(error.message)
    return mapMovement(data as MovementRow)
  },

  async listMovements(filter) {
    const sb = getSupabaseClient()
    let query = sb.from('stock_movements').select('*')
    if (filter?.sku) query = query.eq('sku', filter.sku)
    if (filter?.productId) query = query.eq('product_id', filter.productId)
    if (filter?.location) query = query.eq('location', filter.location)
    if (filter?.reason) query = query.eq('reason', filter.reason)
    if (filter?.channel) query = query.eq('channel', filter.channel)
    const { data, error } = await query.order('at', { ascending: false })
    if (error) fail(error.message)
    return (data as MovementRow[]).map(mapMovement)
  },

  async transferStock(input) {
    const from: Location = input.from ?? 'warehouse'
    const to: Location = input.to ?? 'bazaar'
    const qty = Math.abs(input.quantity)
    const transferId = crypto.randomUUID()
    const out = await this.recordStockMovement({
      productId: input.productId,
      variantId: input.variantId,
      sku: input.sku,
      reason: 'transfer',
      quantity: -qty,
      location: from,
      transferId,
      note: input.note,
    })
    const into = await this.recordStockMovement({
      productId: input.productId,
      variantId: input.variantId,
      sku: input.sku,
      reason: 'transfer',
      quantity: qty,
      location: to,
      transferId,
      note: input.note,
    })
    return [out, into]
  },

  async createOrder(input) {
    const sb = getSupabaseClient()
    const location: Location = input.channel === 'bazaar' ? 'bazaar' : 'warehouse'
    const reason: MovementReason = input.channel === 'bazaar' ? 'sale_bazaar' : 'sale_online'

    // Resolve line pricing from the products table (authoritative).
    const ids = [...new Set(input.lines.map((l) => l.productId))]
    const { data: prodRows, error: prodErr } = await sb.from('products').select('*').in('id', ids)
    if (prodErr) fail(prodErr.message)
    const products = new Map((prodRows as ProductRow[]).map((r) => [r.id, mapProduct(r)]))

    const lines: OrderLine[] = input.lines.map((l) => {
      const product = products.get(l.productId)
      if (!product) fail(`unknown product ${l.productId}`)
      const variant = l.variantId ? product.variants?.find((v) => v.id === l.variantId) : undefined
      const unitPrice = product.price + (variant?.priceDelta ?? 0)
      return {
        productId: l.productId,
        variantId: l.variantId,
        sku: variant?.sku ?? product.sku,
        name: product.name,
        variantLabel: variant?.label,
        unitPrice,
        unitCost: product.cost,
        quantity: l.quantity,
        lineTotal: unitPrice * l.quantity,
        isCustom: l.isCustom,
      }
    })

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    const discount = input.discount ?? 0
    const deliveryFee = input.deliveryFee ?? 0
    const total = Math.max(0, subtotal - discount) + deliveryFee

    // Human-friendly reference. A DB sequence/trigger is the production answer.
    const { count } = await sb.from('orders').select('*', { count: 'exact', head: true })
    const reference = `ORD-${String((count ?? 0) + 1).padStart(4, '0')}`

    const orderRow = {
      reference,
      channel: input.channel,
      location,
      lines,
      subtotal,
      discount,
      delivery_fee: deliveryFee,
      total,
      coupon_code: input.couponCode ?? null,
      payment_method: input.paymentMethod,
      status: input.paymentMethod === 'card' ? 'paid' : 'pending',
      customer: input.customer ?? null,
      created_at: nowIso(),
    }
    const { data, error } = await sb.from('orders').insert(orderRow).select().single()
    if (error) fail(error.message)
    const order = mapOrder(data as OrderRow)

    // Append one stock-out movement per line.
    for (const l of lines) {
      await this.recordStockMovement({
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

  async listOrders(filter) {
    const sb = getSupabaseClient()
    let query = sb.from('orders').select('*')
    if (filter?.channel) query = query.eq('channel', filter.channel)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) fail(error.message)
    return (data as OrderRow[]).map(mapOrder)
  },

  async getOrder(id) {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('orders').select('*').eq('id', id).maybeSingle()
    if (error) fail(error.message)
    return data ? mapOrder(data as OrderRow) : undefined
  },
}
