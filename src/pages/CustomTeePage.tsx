import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Trash2, Upload } from 'lucide-react'
import { repository } from '../data'
import { formatJOD } from '../lib/money'
import { useCart } from '../context/CartContext'

const BLANK_ID = 'tee-blank-custom'

// Design-stage geometry (px). The chest "print area" is where artwork may live.
const STAGE_W = 340
const STAGE_H = 420
const BASE_ART = 90 // artwork width at scale 1.0
const PRINT = { x: 125, y: 168, w: 90, h: 120 }

// Print-quality heuristic: the full print width maps to ~28cm on a real tee;
// at 150 DPI that sets the pixels we'd want from the source image.
const PRINT_MAX_CM = 28
const PRINT_DPI = 150

const COLOR_FILL: Record<string, string> = {
  White: '#f3f4f6',
  Black: '#1f2937',
  Sand: '#d6c3a8',
}

const SHIRT_PATH =
  'M110 40 L140 30 Q170 55 200 30 L230 40 L300 90 L270 140 L240 120 L240 380 L100 380 L100 120 L70 140 L40 90 Z'

function uniq<T>(values: (T | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== undefined))]
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(v, hi))
}

export default function CustomTeePage() {
  const { addItem } = useCart()
  const product = repository.getProduct(BLANK_ID)

  const variants = product?.variants ?? []
  const colors = uniq(variants.map((v) => v.color))
  const sizes = uniq(variants.map((v) => v.size))

  const [color, setColor] = useState<string | undefined>(colors[0])
  const [size, setSize] = useState<string | undefined>(sizes[0])
  const [artSrc, setArtSrc] = useState<string | null>(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [transform, setTransform] = useState({ x: PRINT.x, y: PRINT.y, scale: 0.7 })
  const [added, setAdded] = useState(false)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-2xl font-medium text-neutral-900">Custom tee unavailable</h1>
        <Link to="/shop" className="mt-4 inline-block text-sm font-medium text-[#C53735] hover:underline">
          Back to shop
        </Link>
      </main>
    )
  }

  const ratio = natural.w > 0 ? natural.h / natural.w : 1
  const artW = BASE_ART * transform.scale
  const artH = artW * ratio

  const selectedVariant = variants.find((v) => v.color === color && v.size === size)
  const available = selectedVariant ? repository.getStock(selectedVariant.sku) : 0
  const shirtFill = (color && COLOR_FILL[color]) || '#f3f4f6'

  // Min-resolution check (recomputes as the artwork is scaled).
  const printCm = (artW / PRINT.w) * PRINT_MAX_CM
  const requiredPx = Math.round((printCm / 2.54) * PRINT_DPI)
  const lowRes = natural.w > 0 && natural.w < requiredPx

  const canAdd = !!artSrc && !!selectedVariant && available > 0

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const image = new Image()
      image.onload = () => {
        imgRef.current = image
        setNatural({ w: image.naturalWidth, h: image.naturalHeight })
        const w = BASE_ART * 0.7
        const h = w * (image.naturalHeight / image.naturalWidth)
        setTransform({
          scale: 0.7,
          x: PRINT.x + (PRINT.w - w) / 2,
          y: PRINT.y + (PRINT.h - h) / 2,
        })
        setArtSrc(src)
      }
      image.src = src
    }
    reader.readAsDataURL(file)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    dragRef.current = { dx: e.clientX - rect.left - transform.x, dy: e.clientY - rect.top - transform.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = clamp(e.clientX - rect.left - dragRef.current.dx, PRINT.x, PRINT.x + PRINT.w - artW)
    const y = clamp(e.clientY - rect.top - dragRef.current.dy, PRINT.y, PRINT.y + PRINT.h - artH)
    setTransform((t) => ({ ...t, x, y }))
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  function changeScale(next: number) {
    const w = BASE_ART * next
    const h = w * ratio
    setTransform((t) => ({
      scale: next,
      x: clamp(t.x, PRINT.x, PRINT.x + PRINT.w - w),
      y: clamp(t.y, PRINT.y, PRINT.y + PRINT.h - h),
    }))
  }

  function reset() {
    imgRef.current = null
    setArtSrc(null)
    setNatural({ w: 0, h: 0 })
    setTransform({ x: PRINT.x, y: PRINT.y, scale: 0.7 })
  }

  function makeThumbnail(): string {
    const image = imgRef.current
    const size = 240
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx || !image) return artSrc ?? ''
    ctx.fillStyle = shirtFill
    ctx.fillRect(0, 0, size, size)
    const aw = size * 0.6 * transform.scale
    const ah = aw * ratio
    ctx.drawImage(image, (size - aw) / 2, (size - ah) / 2, aw, ah)
    return canvas.toDataURL('image/png')
  }

  function handleAdd() {
    if (!canAdd || !selectedVariant) return
    addItem({
      productId: BLANK_ID,
      variantId: selectedVariant.id,
      quantity: 1,
      custom: {
        previewImage: makeThumbnail(),
        label: `Custom · ${color} / ${size}`,
      },
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl">
          Design your tee
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">
          Choose a colour, upload your artwork, then drag and scale it onto the chest. Made to order
          — free delivery across Amman &amp; Beirut.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Preview stage */}
        <div className="flex justify-center">
          <div
            ref={stageRef}
            className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
            style={{ width: STAGE_W, height: STAGE_H }}
          >
            <svg
              width={STAGE_W}
              height={STAGE_H}
              viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
              aria-hidden="true"
              className="absolute inset-0"
            >
              <path
                d={SHIRT_PATH}
                fill={shirtFill}
                stroke="#d4d4d4"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <path d="M140 30 Q170 55 200 30" fill="none" stroke="#c0c0c0" strokeWidth={1.5} />
              {/* Print-area guide */}
              <rect
                x={PRINT.x}
                y={PRINT.y}
                width={PRINT.w}
                height={PRINT.h}
                fill="none"
                stroke="#C53735"
                strokeOpacity={0.4}
                strokeDasharray="5 4"
                rx={4}
              />
            </svg>

            {artSrc ? (
              <img
                src={artSrc}
                alt="Your uploaded artwork"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: transform.x,
                  top: transform.y,
                  width: artW,
                  height: artH,
                  cursor: 'grab',
                  touchAction: 'none',
                }}
                className="select-none"
              />
            ) : (
              <div
                className="absolute flex flex-col items-center justify-center rounded text-center text-xs text-neutral-400"
                style={{ left: PRINT.x, top: PRINT.y, width: PRINT.w, height: PRINT.h }}
              >
                <Upload size={18} />
                <span className="mt-1 px-2">Your art appears here</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div>
          {/* Colour */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Shirt colour: <span className="text-neutral-900">{color}</span>
          </p>
          <div className="mb-5 flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-110 border-[#C53735]' : 'border-neutral-300'
                }`}
                style={{ backgroundColor: COLOR_FILL[c ?? ''] ?? '#fff' }}
              />
            ))}
          </div>

          {/* Size */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Size: <span className="text-neutral-900">{size}</span>
          </p>
          <div className="mb-5 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm transition-colors ${
                  size === s
                    ? 'border-[#C53735] bg-[#C53735]/5 text-[#C53735]'
                    : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Upload */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900">
            <Upload size={16} />
            {artSrc ? 'Replace artwork' : 'Upload artwork'}
            <input type="file" accept="image/*" onChange={handleFile} className="sr-only" />
          </label>
          {artSrc && (
            <button
              type="button"
              onClick={reset}
              className="ml-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:text-[#C53735]"
            >
              <Trash2 size={15} /> Remove
            </button>
          )}

          {/* Scale */}
          {artSrc && (
            <div className="mt-5">
              <label htmlFor="scale" className="mb-1 block text-xs font-medium text-neutral-500">
                Size on chest
              </label>
              <input
                id="scale"
                type="range"
                min={0.4}
                max={1}
                step={0.02}
                value={transform.scale}
                onChange={(e) => changeScale(Number(e.target.value))}
                aria-label="Artwork scale"
                className="w-full accent-[#C53735]"
              />
            </div>
          )}

          {/* Resolution warning */}
          {artSrc && (
            <div className="mt-3 text-xs">
              {lowRes ? (
                <p className="inline-flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertTriangle size={14} className="mt-px shrink-0" />
                  <span>
                    Low resolution for this print size — your image is {natural.w}px wide; we
                    recommend ≥ {requiredPx}px. It may look blurry when printed.
                  </span>
                </p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-emerald-600">
                  <Check size={14} /> Resolution looks good ({natural.w}×{natural.h}px).
                </p>
              )}
            </div>
          )}

          {/* Price + add */}
          <div className="mt-7 border-t border-neutral-200 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-neutral-900">
                {formatJOD(product.price)}
              </span>
              <span className="text-sm text-neutral-500">
                {available > 0 ? `${available} blanks available` : 'Out of stock'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C53735] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {added ? (
                <>
                  <Check size={18} /> Added to cart
                </>
              ) : !artSrc ? (
                'Upload artwork to continue'
              ) : available <= 0 ? (
                'Out of stock'
              ) : (
                'Add made-to-order tee'
              )}
            </button>
            <p className="mt-3 text-xs text-neutral-400">
              Made to order — each custom tee is printed on an Orim blank ({selectedVariant?.sku}).
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
