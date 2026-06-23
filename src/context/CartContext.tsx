import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Fils } from '../lib/money'
import { repository } from '../data'

// The cart lives entirely in React state — it is NOT persisted (no
// localStorage), so it resets on reload. This is intentional and consistent
// with the in-memory repository; persistence, if added later, would live
// behind the repository, not here.

export interface CartItem {
  key: string // unique per product+variant line
  productId: string
  variantId?: string
  name: string
  variantLabel?: string
  image: string
  unitPrice: Fils // snapshot for display; the order is priced authoritatively by the repository
  quantity: number
  isCustom?: boolean
  maxStock: number // available stock when added (caps the quantity stepper)
}

export interface AddItemInput {
  productId: string
  variantId?: string
  quantity?: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: Fils
  isOpen: boolean
  addItem(input: AddItemInput): void
  updateQty(key: string, quantity: number): void
  removeItem(key: string): void
  clear(): void
  openCart(): void
  closeCart(): void
}

const CartContext = createContext<CartContextValue | null>(null)

function lineKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  function addItem({ productId, variantId, quantity = 1 }: AddItemInput) {
    const product = repository.getProduct(productId)
    if (!product) return

    let unitPrice = product.price
    let sku = product.sku
    let variantLabel: string | undefined
    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId)
      if (!variant) return
      unitPrice = product.price + (variant.priceDelta ?? 0)
      sku = variant.sku
      variantLabel = variant.label
    }

    const maxStock = repository.getStock(sku)
    const cap = maxStock > 0 ? maxStock : Number.MAX_SAFE_INTEGER
    const key = lineKey(productId, variantId)

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, cap)
        return prev.map((i) => (i.key === key ? { ...i, quantity: nextQty } : i))
      }
      return [
        ...prev,
        {
          key,
          productId,
          variantId,
          name: product.name,
          variantLabel,
          image: product.image,
          unitPrice,
          quantity: Math.min(quantity, cap),
          isCustom: product.madeToOrder,
          maxStock,
        },
      ]
    })
    setIsOpen(true)
  }

  function updateQty(key: string, quantity: number) {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.key !== key) return [i]
        const cap = i.maxStock > 0 ? i.maxStock : quantity
        const q = Math.max(0, Math.min(quantity, cap))
        return q <= 0 ? [] : [{ ...i, quantity: q }]
      }),
    )
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    isOpen,
    addItem,
    updateQty,
    removeItem,
    clear: () => setItems([]),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
