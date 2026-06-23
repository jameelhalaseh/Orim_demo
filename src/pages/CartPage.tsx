import { Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import Placeholder from '../components/Placeholder'

export default function CartPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <Placeholder
        eyebrow="Cart"
        title="Your cart"
        description="The cart context and line items land in Phase 3. From here you'll head to checkout."
      >
        <Link
          to="/checkout"
          className="inline-flex rounded-full bg-[#C53735] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#AE2F2D]"
        >
          Go to checkout
        </Link>
      </Placeholder>
    </div>
  )
}
