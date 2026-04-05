import { ListingCard } from '@/components/ListingCard'
import { MarketplaceFilters } from '@/components/MarketplaceFilters'
import { PageShell } from '@/components/PageShell'
import { ProfileGate } from '@/components/ProfileGate'
import { prisma } from '@/lib/prisma'

export async function MarketHome() {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return (
    <PageShell title="CS2 Marketplace" subtitle="Buy and sell CS2 skins with Arc USDC settlement and Steam trade delivery.">
      <ProfileGate needsSteam />
      <div className="market-layout">
        <MarketplaceFilters />
        <section>
          <div className="market-topbar">
            <div>
              <h3 style={{ margin: 0 }}>Live listings</h3>
              <p className="muted" style={{ marginBottom: 0 }}>{listings.length} active items</p>
            </div>
            <div className="market-search">
              <input className="input" placeholder="Search by skin name" />
              <select className="select" defaultValue="latest">
                <option value="latest">Latest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
              </select>
            </div>
          </div>
          <div className="market-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                game={listing.game}
                itemName={listing.itemName}
                priceUsdc={listing.priceUsdc}
                status={listing.status}
                imageUrl={listing.imageUrl}
              />
            ))}
            {listings.length === 0 && <div className="card">No active listings yet.</div>}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
