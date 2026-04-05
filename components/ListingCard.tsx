import Link from 'next/link'
import { resolveItemImage } from '@/lib/item-images'

type ListingCardProps = {
  id: string
  game: string
  itemName: string
  priceUsdc: number
  status: string
  imageUrl?: string | null
}

function guessWear(name: string) {
  const match = name.match(/\(([^)]+)\)$/)
  return match?.[1] || 'Market lot'
}

export function ListingCard({ id, game, itemName, priceUsdc, status, imageUrl }: ListingCardProps) {
  const wear = guessWear(itemName)
  const resolvedImage = resolveItemImage(itemName, imageUrl)

  return (
    <Link href={`/marketplace/${id}`} className="listing-card">
      <div className="listing-image-wrap">
        {resolvedImage ? <img src={resolvedImage} alt={itemName} className="listing-image" /> : <div className="listing-image fallback">{game}</div>}
        <div className="listing-overlay">
          <span className="badge badge-soft">{wear}</span>
          <span className="badge">{status}</span>
        </div>
      </div>
      <div className="listing-content">
        <div className="row-between">
          <span className="badge badge-soft">{game}</span>
          <span className="muted" style={{ fontSize: 12 }}>Arc settlement</span>
        </div>
        <h3>{itemName}</h3>
        <div className="listing-meta">
          <span>Instant checkout UI</span>
          <span>Steam fulfillment</span>
        </div>
        <div className="row-between listing-footer">
          <span className="listing-price">{priceUsdc.toFixed(2)} USDC</span>
          <span className="listing-cta">View lot →</span>
        </div>
      </div>
    </Link>
  )
}
