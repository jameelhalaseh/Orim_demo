import type { ReactNode } from 'react'

type KpiProps = {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  accent?: boolean
}

export default function Kpi({ label, value, hint, icon, accent }: KpiProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        {icon && (
          <span className={accent ? 'text-[#C53735]' : 'text-neutral-400'}>{icon}</span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}
