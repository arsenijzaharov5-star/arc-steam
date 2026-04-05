import { notFound } from 'next/navigation'
import { BuyForm } from '@/components/BuyForm'
import { PageShell } from '@/components/PageShell'
import { RarityBar } from '@/components/RarityBar'
import { resolveItemImage } from '@/lib/item-images'
import { prisma } from '@/lib/prisma'

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({ where: { id }, include: { seller: true } })
  if (!listing) return notFound()

  const resolvedImage = resolveItemImage(listing.itemName, listing.imageUrl)

  return (
    <PageShell title={listing.itemName} subtitle="Market-lot view: price first, visual item focus, quick buy action and trade-aware order flow.">
      <div className="grid grid-2">
        <div className="card">
          <div className="listing-image-wrap" style={{ borderRadius: 18, overflow: 'hidden', height: 320 }}>
            {resolvedImage ? <img src={resolvedImage} alt={listing.itemName} className="listing-image" /> : <div className="listing-image fallback">{listing.game}</div>}
          </div>
          <RarityBar game={listing.game} />
          <div className="callout">Hybrid marketplace model: Arc handles payment settlement, Steam handles item delivery.</div>
        </div>
        <div className="card info-panel">
          <div className="row-between">
            <span className="badge badge-soft">{listing.game}</span>
            <span className="badge">{listing.status}</span>
          </div>
          <div className="info-line"><span>Price</span><span>{listing.priceUsdc.toFixed(2)} USDC</span></div>
          <div className="info-line"><span>Seller wallet</span><span>{listing.seller.walletAddress}</span></div>
          <div className="info-line"><span>Steam asset id</span><span>{listing.steamAssetId || 'Not provided'}</span></div>
          <div className="info-line"><span>Delivery model</span><span>Steam trade</span></div>
          <div className="info-line"><span>Settlement model</span><span>Arc USDC</span></div>
          <BuyForm listingId={listing.id} />
        </div>
      </div>
    </PageShell>
  )
}
