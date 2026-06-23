# Supabase data layer (scaffold)

This folder swaps Orim's in-memory demo store for a real Postgres backend on
Supabase, **without changing the domain types**. It is wired but not yet
adopted by the UI — the app still runs entirely in-memory until you complete
the steps below.

## What's here

- `client.ts` — creates the Supabase client from env vars; `isSupabaseConfigured()`.
- `supabaseRepository.ts` — implements `AsyncRepository` (`../asyncRepository.ts`)
  against the schema below. Stock is still derived from the `stock_movements`
  ledger; variants and order lines are stored as JSONB to match the types 1:1.
- `schema.sql` — tables (`products`, `stock_movements`, `orders`), indexes, a
  `current_stock` view, and starter RLS policies.

## Setup

1. Create a Supabase project; run `schema.sql` in the SQL editor.
2. Seed `products` (and initial `restock` rows in `stock_movements`). You can
   port `src/data/products.ts` / `src/data/seed.ts` into SQL inserts.
3. Add env vars locally (`.env`, gitignored) and in Vercel:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
   The anon key is a public client key — **RLS policies**, not secrecy, protect
   your data.

## Adopting it in the UI (the remaining work)

The current `Repository` is **synchronous**; Supabase is **async**. The seam is
already defined:

```ts
import { createRepository } from './data/asyncRepository'
const repo = createRepository() // Supabase if configured, else in-memory
const products = await repo.getProducts()
```

To finish the migration:

1. Replace direct `repository.*` calls in the pages with the async `repo`,
   moving reads into `useEffect`/state (or add TanStack Query) with loading and
   error states. Mutations (`createOrder`, `recordStockMovement`, `transferStock`,
   `createProduct`) become `await`ed and trigger a refetch.
2. Provide `repo` via a small React context so components don't each call
   `createRepository()`.
3. Once green, the in-memory store remains the automatic offline/demo fallback
   (no env vars → no backend needed).

## Notes / not-yet-done

- `supabaseRepository.ts` compiles against `@supabase/supabase-js` types but has
  **not** been run against a live database — verify end-to-end after seeding.
- Order `reference` is generated with a `count(*)`; use a Postgres sequence or
  a `before insert` trigger for concurrency safety in production.
- Tighten RLS for writes/order-reads to match your admin auth before launch.
