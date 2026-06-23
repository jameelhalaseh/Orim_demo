import type { Product, Variant } from '../types'
import { jod } from '../lib/money'

// --- Seed authoring types ----------------------------------------------------
// Initial stock is authored next to each product/variant, then turned into
// `restock` ledger movements by seed.ts. The exposed `Product` type never
// carries a stock integer (stock is always derived from the ledger).

type SeedVariant = Variant & { initialStock: number }

export type SeedProduct = Omit<Product, 'variants'> & {
  initialStock?: number // simple products
  variants?: SeedVariant[] // variant products
}

// --- Controlled placeholder imagery -----------------------------------------
// Generated placeholders (not third-party photo URLs) guarantee that no broken
// images appear AND — per hard rule #1 — that no inappropriate/forbidden
// imagery can ever slip in. Swap for real product photography later.
const IMG_BG = 'f5f5f4' // neutral-100
const IMG_FG = 'c53735' // brand red

function img(label: string): string {
  return `https://placehold.co/800x800/${IMG_BG}/${IMG_FG}?text=${encodeURIComponent(label)}&font=montserrat`
}

// --- T-shirt variant builder -------------------------------------------------
const TEE_SIZES = ['S', 'M', 'L', 'XL']
const TEE_COLORS: { name: string; code: string }[] = [
  { name: 'White', code: 'WH' },
  { name: 'Black', code: 'BK' },
  { name: 'Sand', code: 'SD' },
]

function teeVariants(baseSku: string, stockPer: number): SeedVariant[] {
  const variants: SeedVariant[] = []
  for (const color of TEE_COLORS) {
    for (const size of TEE_SIZES) {
      variants.push({
        id: `${baseSku}-${color.code}-${size}`.toLowerCase(),
        sku: `${baseSku}-${color.code}-${size}`,
        label: `${color.name} / ${size}`,
        size,
        color: color.name,
        initialStock: stockPer,
      })
    }
  }
  return variants
}

// --- Catalog -----------------------------------------------------------------
export const CATALOG: SeedProduct[] = [
  // Books -------------------------------------------------------------------
  {
    id: 'book-daily-encouragement',
    sku: 'BK-DEV-001',
    name: 'Daily Encouragement Devotional',
    category: 'books',
    description: '365 short, hope-filled readings — a verse and a thought for every day of the year.',
    price: jod(12.5),
    cost: jod(6),
    image: img('Devotional'),
    reorderThreshold: 10,
    initialStock: 40,
    tags: ['bestseller'],
  },
  {
    id: 'book-psalms-comfort',
    sku: 'BK-PSA-002',
    name: 'Psalms of Comfort — Pocket Edition',
    category: 'books',
    description: 'A pocket-sized selection of the Psalms, chosen to comfort and steady the heart.',
    price: jod(7.9),
    cost: jod(3.5),
    image: img('Psalms'),
    reorderThreshold: 10,
    initialStock: 6, // intentionally low — demonstrates the low-stock flag
  },
  {
    id: 'book-hope-grace-journal',
    sku: 'BK-JRN-003',
    name: 'Hope & Grace Lined Journal',
    category: 'books',
    description: 'A 160-page lined journal with a gentle verse footer on every page.',
    price: jod(9),
    cost: jod(4),
    image: img('Journal'),
    reorderThreshold: 8,
    initialStock: 25,
  },

  // Charms (faith-appropriate) ---------------------------------------------
  {
    id: 'charm-olivewood-cross',
    sku: 'CH-CRS-001',
    name: 'Olive-wood Cross Charm',
    category: 'charms',
    description: 'Hand-carved olive-wood cross from the Holy Land, on a slim cord.',
    price: jod(5.5),
    cost: jod(2),
    image: img('Olive-wood Cross'),
    reorderThreshold: 15,
    initialStock: 60,
    tags: ['handmade'],
  },
  {
    id: 'charm-ceramic-dove',
    sku: 'CH-DOV-002',
    name: 'Ceramic Dove Charm',
    category: 'charms',
    description: 'A small glazed ceramic dove — a quiet symbol of peace.',
    price: jod(4.75),
    cost: jod(1.8),
    image: img('Dove Charm'),
    reorderThreshold: 12,
    initialStock: 5, // low-stock
  },
  {
    id: 'charm-silver-cross-pendant',
    sku: 'CH-SLV-003',
    name: 'Silver Cross Pendant',
    category: 'charms',
    description: 'A sterling-silver cross pendant with a polished finish and an 18" chain.',
    price: jod(18),
    cost: jod(9),
    image: img('Silver Cross'),
    reorderThreshold: 6,
    initialStock: 20,
  },

  // Bottles -----------------------------------------------------------------
  {
    id: 'bottle-bestill-steel',
    sku: 'BT-STL-001',
    name: "Stainless Steel Bottle — 'Be Still'",
    category: 'bottles',
    description: "A 600ml insulated steel bottle engraved with 'Be still and know'.",
    price: jod(14),
    cost: jod(6.5),
    image: img('Be Still Bottle'),
    reorderThreshold: 10,
    initialStock: 30,
  },
  {
    id: 'bottle-grace-tumbler',
    sku: 'BT-TMB-002',
    name: "Insulated Tumbler — 'Grace'",
    category: 'bottles',
    description: 'A 350ml double-walled tumbler with a soft-touch finish and a sip lid.',
    price: jod(16.5),
    cost: jod(7.5),
    image: img('Grace Tumbler'),
    reorderThreshold: 8,
    initialStock: 18,
  },
  {
    id: 'bottle-olive-glass',
    sku: 'BT-GLS-003',
    name: 'Glass Bottle — Olive Branch',
    category: 'bottles',
    description: 'A 500ml glass bottle with a protective sleeve and an olive-branch motif.',
    price: jod(11),
    cost: jod(5),
    image: img('Olive Glass Bottle'),
    reorderThreshold: 8,
    initialStock: 9,
  },

  // T-Shirts ----------------------------------------------------------------
  {
    id: 'tee-faith-classic',
    sku: 'TEE-FAITH',
    name: 'Faith Tee — Classic',
    category: 'tshirts',
    description: 'Soft ringspun cotton tee with a clean chest print. Runs true to size.',
    price: jod(15),
    cost: jod(6),
    image: img('Faith Tee'),
    reorderThreshold: 24,
    variants: teeVariants('TEE-FAITH', 8),
    tags: ['bestseller'],
  },
  {
    id: 'tee-grace',
    sku: 'TEE-GRACE',
    name: 'Grace Tee',
    category: 'tshirts',
    description: "A relaxed-fit cotton tee with a hand-lettered 'Grace upon grace' print.",
    price: jod(16),
    cost: jod(6.5),
    image: img('Grace Tee'),
    reorderThreshold: 24,
    variants: teeVariants('TEE-GRACE', 6),
  },
  {
    id: 'tee-blank-custom',
    sku: 'TEE-BLANK',
    name: 'Orim Blank Tee (Custom Base)',
    category: 'tshirts',
    description: 'The blank premium tee used by the custom designer — choose a colour and add your own artwork.',
    price: jod(14),
    cost: jod(5.5),
    image: img('Custom Tee'),
    reorderThreshold: 30,
    madeToOrder: true,
    variants: teeVariants('TEE-BLANK', 20),
  },

  // Home & Gifts ------------------------------------------------------------
  {
    id: 'home-candle-frankincense',
    sku: 'HG-CDL-001',
    name: 'Scented Candle — Frankincense & Myrrh',
    category: 'home-gifts',
    description: 'A 200g soy candle with warm frankincense and myrrh — about 40 hours of burn time.',
    price: jod(8.5),
    cost: jod(3.2),
    image: img('Candle'),
    reorderThreshold: 10,
    initialStock: 4, // low-stock
  },
  {
    id: 'home-coaster-olivewood',
    sku: 'HG-CST-002',
    name: 'Olive-wood Coaster Set (4)',
    category: 'home-gifts',
    description: 'A set of four olive-wood coasters, each with a subtly different grain.',
    price: jod(13),
    cost: jod(5.5),
    image: img('Coaster Set'),
    reorderThreshold: 8,
    initialStock: 22,
  },
  {
    id: 'home-mug-blessed',
    sku: 'HG-MUG-003',
    name: "Ceramic Mug — 'Blessed'",
    category: 'home-gifts',
    description: "A 330ml stoneware mug glazed in cream with a simple 'Blessed' mark.",
    price: jod(6.5),
    cost: jod(2.4),
    image: img('Blessed Mug'),
    reorderThreshold: 12,
    initialStock: 35,
  },
  {
    id: 'home-tote-olive',
    sku: 'HG-TOT-004',
    name: 'Linen Tote — Olive Branch',
    category: 'home-gifts',
    description: 'A natural linen tote with an embroidered olive branch and reinforced handles.',
    price: jod(9.5),
    cost: jod(3.8),
    image: img('Linen Tote'),
    reorderThreshold: 10,
    initialStock: 28,
  },
]
