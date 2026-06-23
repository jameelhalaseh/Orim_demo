// Async data-layer contract.
//
// The app currently consumes the SYNCHRONOUS `repository` (in-memory). A real
// backend (Supabase) is inherently asynchronous, so adopting it means moving
// the UI onto this Promise-returning `AsyncRepository` shape. This file is the
// seam: it defines that contract, an async wrapper around the in-memory store
// (so nothing breaks today), and a `createRepository()` factory that returns
// the Supabase adapter when configured and the in-memory one otherwise.
//
// NOTE: nothing in the UI imports this yet, so it (and @supabase/supabase-js)
// is tree-shaken out of the production bundle. See src/data/supabase/README.md
// for the adoption steps.

import type {
  Category,
  CategoryMeta,
  Channel,
  Order,
  Product,
  StockMovement,
} from '../types'
import type {
  CreateOrderInput,
  CreateProductInput,
  MovementFilter,
  MovementInput,
  ProductStock,
  TransferInput,
} from './repository'
import { repository } from './repository'
import { isSupabaseConfigured } from './supabase/client'
import { supabaseRepository } from './supabase/supabaseRepository'

export interface AsyncRepository {
  getProducts(filter?: { category?: Category }): Promise<Product[]>
  getProduct(id: string): Promise<Product | undefined>
  getCategories(): Promise<CategoryMeta[]>
  createProduct(input: CreateProductInput): Promise<Product>
  getStock(sku: string, location?: 'warehouse' | 'bazaar'): Promise<number>
  getProductStock(productId: string): Promise<ProductStock>
  recordStockMovement(input: MovementInput): Promise<StockMovement>
  listMovements(filter?: MovementFilter): Promise<StockMovement[]>
  transferStock(input: TransferInput): Promise<StockMovement[]>
  createOrder(input: CreateOrderInput): Promise<Order>
  listOrders(filter?: { channel?: Channel }): Promise<Order[]>
  getOrder(id: string): Promise<Order | undefined>
}

/** Wraps the synchronous in-memory repository in Promises (default / fallback). */
export const inMemoryAsyncRepository: AsyncRepository = {
  getProducts: async (filter) => repository.getProducts(filter),
  getProduct: async (id) => repository.getProduct(id),
  getCategories: async () => repository.getCategories(),
  createProduct: async (input) => repository.createProduct(input),
  getStock: async (sku, location) => repository.getStock(sku, location),
  getProductStock: async (productId) => repository.getProductStock(productId),
  recordStockMovement: async (input) => repository.recordStockMovement(input),
  listMovements: async (filter) => repository.listMovements(filter),
  transferStock: async (input) => repository.transferStock(input),
  createOrder: async (input) => repository.createOrder(input),
  listOrders: async (filter) => repository.listOrders(filter),
  getOrder: async (id) => repository.getOrder(id),
}

/**
 * Returns the active data layer: Supabase when `VITE_SUPABASE_URL` and
 * `VITE_SUPABASE_ANON_KEY` are set, otherwise the in-memory demo store.
 */
export function createRepository(): AsyncRepository {
  return isSupabaseConfigured() ? supabaseRepository : inMemoryAsyncRepository
}
