import { DashboardClient } from '@/components/DashboardClient'
import { InventoryPreview } from '@/components/InventoryPreview'
import { PageShell } from '@/components/PageShell'
import { StatsStrip } from '@/components/StatsStrip'

export default function DashboardPage() {
  return (
    <PageShell title="Trading dashboard" subtitle="Orders, payouts and seller-side inventory context in a more trade-oriented interface.">
      <StatsStrip
        items={[
          { label: 'Buyer flow', value: 'Ready' },
          { label: 'Seller flow', value: 'Ready' },
          { label: 'Payout view', value: 'Live' },
          { label: 'Order details', value: 'Enabled' },
        ]}
      />
      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Inventory watch</h3>
          <InventoryPreview />
        </div>
        <div className="card info-panel">
          <h3 style={{ marginTop: 0 }}>Trading flow</h3>
          <div className="info-line"><span>Listings visible</span><span>Market-side</span></div>
          <div className="info-line"><span>Orders tracked</span><span>Wallet-side</span></div>
          <div className="info-line"><span>Trade hold tracked</span><span>Order-side</span></div>
          <div className="info-line"><span>Payout released</span><span>Ops-side</span></div>
          <div className="callout">This dashboard should gradually evolve into an inventory and trade control center, not just an account page.</div>
        </div>
      </div>
      <DashboardClient />
    </PageShell>
  )
}
