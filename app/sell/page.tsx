import { CreateListingForm } from '@/components/CreateListingForm'
import { InventoryPreview } from '@/components/InventoryPreview'
import { PageShell } from '@/components/PageShell'

export default function SellPage() {
  return (
    <PageShell title="Sell CS2 skins" subtitle="Inventory-style seller area: list CS2 skins, price them in USDC and route orders through the marketplace flow.">
      <div className="grid grid-2">
        <div className="card">
          <CreateListingForm />
        </div>
        <div className="card info-panel">
          <h3 style={{ marginTop: 0 }}>Inventory preview</h3>
          <InventoryPreview />
          <div className="callout">The seller UX should feel closer to an inventory/trade panel than a generic admin form.</div>
        </div>
      </div>
    </PageShell>
  )
}
