-- Orim — Supabase schema
-- Run in the Supabase SQL editor. Money is stored in fils (integer minor
-- units, 1 JOD = 1000 fils). Stock is NEVER stored as a column — it is derived
-- from the immutable stock_movements ledger.

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                text primary key,
  sku               text not null unique,
  name              text not null,
  category          text not null check (category in ('books','charms','bottles','tshirts','home-gifts')),
  description       text not null default '',
  price             integer not null,      -- fils
  cost              integer not null,      -- fils
  image             text not null,
  images            text[],
  reorder_threshold integer not null default 0,
  variants          jsonb,                 -- Variant[]: {id, sku, label, size?, color?, priceDelta?}
  made_to_order     boolean default false,
  tags              text[]
);

-- ---------------------------------------------------------------------------
-- stock_movements  (the source of truth for stock)
-- ---------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id          text primary key default gen_random_uuid()::text,
  product_id  text not null references public.products(id),
  variant_id  text,
  sku         text not null,
  reason      text not null check (reason in ('restock','sale_online','sale_bazaar','transfer','return','adjustment')),
  quantity    integer not null,            -- signed: +in / -out
  location    text not null check (location in ('warehouse','bazaar')),
  channel     text check (channel in ('online','bazaar')),
  order_id    text,
  transfer_id text,
  note        text,
  at          timestamptz not null default now()
);
create index if not exists stock_movements_sku_idx on public.stock_movements (sku);
create index if not exists stock_movements_product_idx on public.stock_movements (product_id);
create index if not exists stock_movements_at_idx on public.stock_movements (at desc);

-- ---------------------------------------------------------------------------
-- orders  (lines stored as JSONB to mirror the OrderLine[] domain type)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id             text primary key default gen_random_uuid()::text,
  reference      text not null unique,
  channel        text not null check (channel in ('online','bazaar')),
  location       text not null check (location in ('warehouse','bazaar')),
  lines          jsonb not null,
  subtotal       integer not null,         -- fils
  discount       integer not null default 0,
  delivery_fee   integer not null default 0,
  total          integer not null,
  coupon_code    text,
  payment_method text not null check (payment_method in ('cod','card','cash')),
  status         text not null check (status in ('pending','paid','fulfilled','cancelled')),
  customer       jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- Optional: current stock per sku/location as a view.
create or replace view public.current_stock as
  select sku, location, sum(quantity)::integer as quantity
  from public.stock_movements
  group by sku, location;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Start strict: enable RLS, allow public READ of the catalog, and require an
-- authenticated/service role for writes and for reading orders. Tighten to fit
-- the real auth model before going live.
-- ---------------------------------------------------------------------------
alter table public.products        enable row level security;
alter table public.stock_movements enable row level security;
alter table public.orders          enable row level security;

create policy "public can read products"
  on public.products for select using (true);

-- Writes (products/movements/orders) and order reads are intentionally NOT
-- granted to anon here — perform them with a service role on a trusted server,
-- or add authenticated-user policies that match your admin login.
