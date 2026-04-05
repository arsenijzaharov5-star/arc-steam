import { OrderStatusManager } from '@/components/OrderStatusManager'
import { PageShell } from '@/components/PageShell'
import { PayoutStatusManager } from '@/components/PayoutStatusManager'
import { SeedDemoDataButton } from '@/components/SeedDemoDataButton'
import { StatsStrip } from '@/components/StatsStrip'
import { prisma } from '@/lib/prisma'

export default async function AdminPage() {
  const [listings, orders, payouts, bots, custodyCount, latestOrders, latestPayouts, latestListings] = await Promise.all([
    prisma.listing.count(),
    prisma.order.count(),
    prisma.payout.count(),
    prisma.bot.count(),
    prisma.custodyItem.count(),
    prisma.order.findMany({ include: { listing: true }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.payout.findMany({ include: { order: { include: { listing: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.listing.findMany({ include: { deposit: true, custodyItem: { include: { bot: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ])

  return (
    <PageShell title="Admin operations" subtitle="Backoffice for listings, orders, hold periods, delivery and payouts.">
      <StatsStrip
        items={[
          { label: 'Total listings', value: String(listings) },
          { label: 'Custody items', value: String(custodyCount) },
          { label: 'Custody bots', value: String(bots) },
          { label: 'Total payouts', value: String(payouts) },
        ]}
      />
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row-between">
          <div>
            <h3 style={{ margin: 0 }}>Demo tools</h3>
            <p className="muted">Seed listings, custody items and bots fast so the marketplace is easier to show and test.</p>
          </div>
          <SeedDemoDataButton />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Latest custody listings</h3>
          <span className="muted">Deposit + custody state</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Listing</th>
                <th>Deposit</th>
                <th>Custody</th>
                <th>Bot</th>
              </tr>
            </thead>
            <tbody>
              {latestListings.map((listing) => (
                <tr key={listing.id}>
                  <td>{listing.itemName}</td>
                  <td><span className="badge">{listing.status}</span></td>
                  <td><span className="badge">{listing.deposit?.status || '—'}</span></td>
                  <td><span className="badge">{listing.custodyItem?.custodyStatus || '—'}</span></td>
                  <td>{listing.custodyItem?.bot.displayName || '—'}</td>
                </tr>
              ))}
              {latestListings.length === 0 && (
                <tr><td colSpan={5} className="muted">No custody listings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Latest orders</h3>
          <span className="muted">Manual status tools enabled</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Item</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.listing.itemName}</td>
                  <td><span className="badge">{order.status}</span></td>
                  <td>{order.amountUsdc.toFixed(2)} USDC</td>
                  <td><OrderStatusManager orderId={order.id} currentStatus={order.status} /></td>
                </tr>
              ))}
              {latestOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Latest payouts</h3>
          <span className="muted">Release after delivery confirmation</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Payout</th>
                <th>Item</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.id}</td>
                  <td>{payout.order.listing.itemName}</td>
                  <td><span className="badge">{payout.status}</span></td>
                  <td>{payout.amountUsdc.toFixed(2)} USDC</td>
                  <td><PayoutStatusManager payoutId={payout.id} currentStatus={payout.status} /></td>
                </tr>
              ))}
              {latestPayouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No payouts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}
