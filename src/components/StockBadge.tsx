import { useI18n } from '../lib/i18n'

type StockBadgeProps = {
  total: number
  threshold: number
  className?: string
}

export default function StockBadge({ total, threshold, className = '' }: StockBadgeProps) {
  const { t } = useI18n()
  let label = t('stock.in')
  let tone = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'

  if (total <= 0) {
    label = t('stock.out')
    tone = 'bg-neutral-100 text-neutral-500 ring-neutral-500/20'
  } else if (total <= threshold) {
    label = t('stock.low')
    tone = 'bg-amber-50 text-amber-700 ring-amber-600/20'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone} ${className}`}
    >
      {label}
    </span>
  )
}
