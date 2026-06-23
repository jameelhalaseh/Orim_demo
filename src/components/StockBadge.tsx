type StockBadgeProps = {
  total: number
  threshold: number
  className?: string
}

export default function StockBadge({ total, threshold, className = '' }: StockBadgeProps) {
  let label = 'In stock'
  let tone = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'

  if (total <= 0) {
    label = 'Out of stock'
    tone = 'bg-neutral-100 text-neutral-500 ring-neutral-500/20'
  } else if (total <= threshold) {
    label = 'Low stock'
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
