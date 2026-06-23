import { useParams } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import Placeholder from '../components/Placeholder'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <Placeholder
        eyebrow="Product"
        title="Product detail"
        description={`Gallery, variant/size selector, quantity, and add-to-cart arrive in Phase 3. Requested product id: ${id ?? '—'}.`}
      />
    </div>
  )
}
