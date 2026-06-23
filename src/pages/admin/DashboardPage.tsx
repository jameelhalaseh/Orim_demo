import { Link } from 'react-router-dom'
import { TrendingUp, ShoppingCart, AlertTriangle, Sparkles } from 'lucide-react'
import { repository } from '../../data'
import { formatJOD } from '../../lib/money'
import { ammanDayKey, formatAmmanDateTime, last7DayKeys } from '../../lib/datetime'
import Kpi from '../../components/admin/Kpi'
import ChannelBadge from '../../components/admin/ChannelBadge'
import type { OrderStatus } from '../../types'

function statusTone(status: OrderStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    case 'fulfilled':
      return 'bg-sky-50 text-sky-700 ring-sky-600/20'
    case 'cancelled':
      return 'bg-neutral-100 text-neutral-500 ring-neutral-500/20'
    default:
      return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  }
}

function dayLabel(key: string): { weekday: string; day: string } {
  const d = new Date(`${key}T12:00:00+03:00`)
  return {
    weekday: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Amman', weekday: 'short' }).format(d),
    day: key.slice(8),
  }
}

export default function DashboardPage() {
  const orders = repository.listOrders() // newest first
  const products = repository.getProducts()

  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const onlineOrders = orders.filter((o) => o.channel === 'online')
  const bazaarOrders = orders.filter((o) => o.channel === 'bazaar')
  const onlineRev = onlineOrders.reduce((s, o) => s + o.total, 0)
  const bazaarRev = bazaarOrders.reduce((s, o) => s + o.total, 0)
  const lowStock = products.filter((p) => repository.getProductStock(p.id).total <= p.reorderThreshold)
  const customOrders = orders.filter((o) => o.lines.some((l) => l.isCustom))

  // 7-day revenue, anchored to the most recent order (keeps the demo populated).
  const endIso = orders[0]?.createdAt ?? new Date().toISOString()
  const dayKeys = last7DayKeys(endIso)
  const byDay = dayKeys.map((key) => ({
    key,
    total: orders
      .filter((o) => ammanDayKey(o.createdAt) === key)
      .reduce((s, o) => s + o.total, 0),
  }))
  const maxDay = Math.max(1, ...byDay.map((d) => d.total))

  const splitTotal = Math.max(1, onlineRev + bazaarRev)
  const onlinePct = Math.round((onlineRev / splitTotal) * 100)
  const recent = orders.slice(0, 6)

  return (
    <div className="px-6 py-7 sm:px-8">
      <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">An overview of Orim's trading across both channels.</p>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue" value={formatJOD(revenue)} hint={`${orders.length} orders`} icon={<TrendingUp size={18} />} accent />
        <Kpi
          label="Orders"
          value={String(orders.length)}
          hint={`${onlineOrders.length} online · ${bazaarOrders.length} bazaar`}
          icon={<ShoppingCart size={18} />}
        />
        <Kpi label="Low stock" value={String(lowStock.length)} hint="at or below reorder level" icon={<AlertTriangle size={18} />} />
        <Kpi label="Custom orders" value={String(customOrders.length)} hint="made-to-order tees" icon={<Sparkles size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* 7-day revenue chart */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-neutral-900">Revenue — last 7 days</h2>
          <div className="mt-6 flex h-44 gap-3">
            {byDay.map((d) => {
              const { weekday, day } = dayLabel(d.key)
              return (
                <div key={d.key} className="flex h-full flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-neutral-500">
                    {d.total > 0 ? formatJOD(d.total).replace(' JD', '') : ''}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-[#C53735]/85"
                      style={{ height: `${Math.max(2, (d.total / maxDay) * 100)}%` }}
                      title={formatJOD(d.total)}
                    />
                  </div>
                  <span className="text-center text-[11px] leading-tight text-neutral-500">
                    {weekday}
                    <br />
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Online vs bazaar split */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-medium text-neutral-900">Online vs bazaar</h2>
          <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="bg-[#C53735]" style={{ width: `${onlinePct}%` }} />
            <div className="bg-neutral-800" style={{ width: `${100 - onlinePct}%` }} />
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-neutral-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C53735]" /> Online
              </dt>
              <dd className="font-medium text-neutral-900">{formatJOD(onlineRev)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-neutral-600">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-800" /> Bazaar
              </dt>
              <dd className="font-medium text-neutral-900">{formatJOD(bazaarRev)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-sm font-medium text-neutral-900">Recent orders</h2>
          <Link to="/admin/sales" className="text-sm font-medium text-[#C53735] hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-neutral-900">{o.reference}</td>
                  <td className="px-5 py-3 text-neutral-500">{formatAmmanDateTime(o.createdAt)}</td>
                  <td className="px-5 py-3">
                    <ChannelBadge channel={o.channel} />
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {o.lines.reduce((n, l) => n + l.quantity, 0)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusTone(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-neutral-900">
                    {formatJOD(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
