import { Download } from 'lucide-react'
import { repository } from '../../data'
import { formatJOD } from '../../lib/money'
import { ammanDayKey, formatAmmanDateTime } from '../../lib/datetime'
import ChannelBadge from '../../components/admin/ChannelBadge'
import type { OrderStatus, PaymentMethod } from '../../types'

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

const PAYMENT_LABEL: Record<PaymentMethod, string> = { cod: 'COD', card: 'Card', cash: 'Cash' }

export default function SalesPage() {
  const orders = repository.listOrders()
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const itemCount = orders.reduce((n, o) => n + o.lines.reduce((x, l) => x + l.quantity, 0), 0)

  async function exportExcel() {
    // Loaded on demand so the ~330 kB SheetJS bundle never ships with the storefront.
    const XLSX = await import('xlsx')
    const summary = orders.map((o) => ({
      Reference: o.reference,
      Date: formatAmmanDateTime(o.createdAt),
      Channel: o.channel,
      Customer: o.customer?.name ?? '',
      Phone: o.customer?.phone ?? '',
      City: o.customer?.city ?? '',
      Items: o.lines.reduce((n, l) => n + l.quantity, 0),
      'Subtotal (JOD)': o.subtotal / 1000,
      'Discount (JOD)': o.discount / 1000,
      'Total (JOD)': o.total / 1000,
      Payment: PAYMENT_LABEL[o.paymentMethod],
      Status: o.status,
    }))

    const lines = orders.flatMap((o) =>
      o.lines.map((l) => ({
        Reference: o.reference,
        Date: formatAmmanDateTime(o.createdAt),
        Product: l.name,
        Variant: l.variantLabel ?? '',
        SKU: l.sku,
        Custom: l.isCustom ? 'Yes' : '',
        Qty: l.quantity,
        'Unit (JOD)': l.unitPrice / 1000,
        'Line total (JOD)': l.lineTotal / 1000,
      })),
    )

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Orders')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lines), 'Order Lines')
    XLSX.writeFile(wb, `orim-sales-${ammanDayKey(new Date().toISOString())}.xlsx`)
  }

  return (
    <div className="px-6 py-7 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Sales</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {orders.length} orders · {itemCount} items · {formatJOD(revenue)} revenue
          </p>
        </div>
        <button
          onClick={() => void exportExcel()}
          disabled={orders.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#C53735] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-50 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{o.reference}</td>
                <td className="px-4 py-3 text-neutral-500">{formatAmmanDateTime(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <ChannelBadge channel={o.channel} />
                </td>
                <td className="px-4 py-3 text-neutral-600">{o.customer?.name ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {o.lines.reduce((n, l) => n + l.quantity, 0)}
                </td>
                <td className="px-4 py-3 text-neutral-500">{PAYMENT_LABEL[o.paymentMethod]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusTone(o.status)}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                  {formatJOD(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
