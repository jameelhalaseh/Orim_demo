import PublicNav from '../components/PublicNav'
import Placeholder from '../components/Placeholder'

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <Placeholder
        eyebrow="Shop"
        title="The Orim catalog"
        description="Books, faith-appropriate charms, bottles, t-shirts, and home & gifts will live here. Phase 3 brings the category filter, product grid, and stock badges."
      />
    </div>
  )
}
