import PublicNav from '../components/PublicNav'
import Placeholder from '../components/Placeholder'

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <Placeholder
        eyebrow="Checkout"
        title="Checkout"
        description="Address, delivery, cash-on-delivery + card placeholder, and the coupon field arrive in Phase 3 — and will write sale_online stock movements on order."
      />
    </div>
  )
}
