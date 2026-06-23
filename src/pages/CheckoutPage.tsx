import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Tag } from 'lucide-react'
import type { Order } from '../types'
import type { Fils } from '../lib/money'
import { formatJOD, jod } from '../lib/money'
import { repository } from '../data'
import { useCart } from '../context/CartContext'
import { useI18n } from '../lib/i18n'

// Demo coupons. Each returns the discount (in fils) for a given subtotal.
const COUPONS: Record<string, { label: string; compute: (subtotal: Fils) => Fils }> = {
  WELCOME10: { label: '10% off', compute: (s) => Math.round(s * 0.1) },
  ORIM5: { label: '5 JD off', compute: () => jod(5) },
}

const CITIES = ['Amman', 'Beirut']

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const { t } = useI18n()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Amman',
  })
  const [payment, setPayment] = useState<'cod' | 'card'>('cod')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')
  const [placed, setPlaced] = useState<Order | null>(null)

  const discount = coupon ? Math.min(COUPONS[coupon].compute(subtotal), subtotal) : 0
  const deliveryFee = 0
  const total = Math.max(0, subtotal - discount) + deliveryFee

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (COUPONS[code]) {
      setCoupon(code)
      setCouponError('')
    } else {
      setCoupon(null)
      setCouponError(t('checkout.couponInvalid'))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return

    const order = repository.createOrder({
      channel: 'online',
      paymentMethod: payment,
      customer: {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address,
        city: form.city,
      },
      couponCode: coupon ?? undefined,
      discount,
      deliveryFee,
      lines: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        isCustom: i.isCustom,
      })),
    })

    setPlaced(order)
    clear()
  }

  // Confirmation -------------------------------------------------------------
  if (placed) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Check size={28} className="text-emerald-600" />
        </div>
        <h1 className="mt-5 text-2xl font-medium text-neutral-900">{t('checkout.thanks')}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t('checkout.ref', { ref: placed.reference })}
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-start text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">{t('checkout.total')}</span>
            <span className="font-semibold text-neutral-900">{formatJOD(placed.total)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-neutral-500">{t('checkout.payment')}</span>
            <span className="text-neutral-900">
              {placed.paymentMethod === 'cod' ? t('checkout.cod') : t('checkout.cardPaid')}
            </span>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            {placed.paymentMethod === 'cod'
              ? t('checkout.courier', { amount: formatJOD(placed.total) })
              : t('checkout.received')}{' '}
            {t('checkout.freeAcross')}
          </p>
        </div>
        <Link
          to="/shop"
          className="mt-7 inline-block rounded-full bg-[#C53735] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
        >
          {t('cart.continue')}
        </Link>
      </main>
    )
  }

  // Empty cart ---------------------------------------------------------------
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-medium text-neutral-900">{t('checkout.emptyTitle')}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t('checkout.emptySub')}</p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-[#C53735] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
        >
          {t('checkout.browse')}
        </Link>
      </main>
    )
  }

  // Checkout form ------------------------------------------------------------
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <h1 className="mb-8 text-3xl font-medium tracking-tight text-neutral-900">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        {/* Details */}
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {t('checkout.contact')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('checkout.name')} required value={form.name} onChange={(v) => update('name', v)} />
              <Field
                label={t('checkout.phone')}
                type="tel"
                required
                value={form.phone}
                onChange={(v) => update('phone', v)}
              />
              <div className="sm:col-span-2">
                <Field
                  label={t('checkout.email')}
                  type="email"
                  value={form.email}
                  onChange={(v) => update('email', v)}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {t('checkout.delivery')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label={t('checkout.address')}
                  required
                  value={form.address}
                  onChange={(v) => update('address', v)}
                />
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-neutral-700">{t('checkout.city')}</span>
                <select
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`city.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  {t('checkout.freeBadge')}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {t('checkout.payment')}
            </h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-300 px-4 py-3 has-[:checked]:border-[#C53735] has-[:checked]:bg-[#C53735]/5">
                <input
                  type="radio"
                  name="payment"
                  checked={payment === 'cod'}
                  onChange={() => setPayment('cod')}
                  className="accent-[#C53735]"
                />
                <span className="text-sm font-medium text-neutral-900">{t('checkout.cod')}</span>
              </label>
              <label className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 opacity-60">
                <input type="radio" name="payment" disabled className="accent-[#C53735]" />
                <span className="text-sm font-medium text-neutral-500">{t('checkout.cardSoon')}</span>
              </label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-sm font-medium text-neutral-900">{t('checkout.summary')}</h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3 text-sm">
                <span className="text-neutral-600">
                  {item.name}
                  {item.variantLabel ? ` · ${item.variantLabel}` : ''}
                  <span className="text-neutral-400"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium text-neutral-900">
                  {formatJOD(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {/* Coupon */}
          <div className="mt-5 border-t border-neutral-200 pt-4">
            <label htmlFor="coupon" className="mb-1.5 block text-xs font-medium text-neutral-500">
              {t('checkout.coupon')}
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="e.g. WELCOME10"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900"
              >
                {t('checkout.apply')}
              </button>
            </div>
            {couponError && <p className="mt-1.5 text-xs text-[#C53735]">{couponError}</p>}
            {coupon && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600">
                <Tag size={12} /> {t('checkout.couponApplied', { code: coupon, label: COUPONS[coupon].label })}
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">{t('checkout.subtotal')}</dt>
              <dd className="font-medium text-neutral-900">{formatJOD(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">{t('checkout.discount')}</dt>
                <dd className="font-medium text-emerald-600">−{formatJOD(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">{t('checkout.delivery')}</dt>
              <dd className="font-medium text-emerald-600">{t('checkout.free')}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
              <dt className="font-medium text-neutral-900">{t('checkout.total')}</dt>
              <dd className="font-semibold text-neutral-900">{formatJOD(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-[#C53735] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
          >
            {t('checkout.place')}
          </button>
          <p className="mt-2 text-center text-xs text-neutral-400">{t('checkout.payNote')}</p>
        </aside>
      </form>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[#C53735] focus:outline-none focus:ring-1 focus:ring-[#C53735]"
      />
    </label>
  )
}
