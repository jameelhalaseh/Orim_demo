// Single source of truth for Orim's domain types.
// Money is always `Fils` (integer minor units — see src/lib/money.ts).

import type { Fils } from './lib/money'

/** Catalog categories. */
export type Category = 'books' | 'charms' | 'bottles' | 'tshirts' | 'home-gifts'

export interface CategoryMeta {
  id: Category
  label: string
  description?: string
}

/** Sales channel a movement / order belongs to. */
export type Channel = 'online' | 'bazaar'

/** Physical stock location. Stock is tracked per location. */
export type Location = 'warehouse' | 'bazaar'

/**
 * Every stock change is one of these. Stock is NEVER stored as a mutable
 * integer — current stock is always the sum of the movement ledger.
 */
export type MovementReason =
  | 'restock'
  | 'sale_online'
  | 'sale_bazaar'
  | 'transfer'
  | 'return'
  | 'adjustment'

/** A purchasable variation of a product (e.g. a t-shirt size + colour). */
export interface Variant {
  id: string
  sku: string
  label: string // e.g. "Sand / M"
  size?: string
  color?: string
  priceDelta?: Fils // added to the product base price; usually 0
}

export interface Product {
  id: string
  sku: string // base / stock SKU for simple (variant-less) products
  name: string
  category: Category
  description: string
  price: Fils // base price
  cost: Fils // unit cost — used for margin / reconciliation reporting
  image: string
  images?: string[]
  reorderThreshold: number // low-stock flag fires at or below this
  variants?: Variant[]
  madeToOrder?: boolean // blank base consumed by the custom-tee designer
  tags?: string[]
}

/**
 * An immutable ledger entry. `quantity` is a signed delta:
 * positive = stock in (restock, transfer-in, return), negative = stock out
 * (sale, transfer-out). Current stock for a SKU = sum of its movements.
 */
export interface StockMovement {
  id: string
  productId: string
  variantId?: string
  sku: string
  reason: MovementReason
  quantity: number
  location: Location
  channel?: Channel
  orderId?: string // links sale movements to their order
  transferId?: string // links the two legs of a transfer
  note?: string
  at: string // ISO timestamp
}

export interface OrderLine {
  productId: string
  variantId?: string
  sku: string
  name: string // snapshot of the product name at order time
  variantLabel?: string
  unitPrice: Fils // snapshot
  unitCost: Fils // snapshot, for margin reporting
  quantity: number
  lineTotal: Fils
  isCustom?: boolean // made-to-order custom tee
}

export type PaymentMethod = 'cod' | 'card' | 'cash'
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled'

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
}

export interface Order {
  id: string
  reference: string // human-friendly, e.g. "ORD-0001"
  channel: Channel
  location: Location // where stock is drawn from
  lines: OrderLine[]
  subtotal: Fils
  discount: Fils
  deliveryFee: Fils
  total: Fils
  couponCode?: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  customer?: CustomerInfo
  createdAt: string // ISO timestamp
}
