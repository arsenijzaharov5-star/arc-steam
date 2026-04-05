import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { prisma } from '@/lib/prisma'

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: true, buyer: true, seller: true, payout: true },
  })

  if (!order) return notFound()

  return (
    <PageShell title={`Order ${order.id}`} subtitle="Detailed order state for payment, hold, delivery and seller payout tracking.">
      <div className="grid grid-2">
        <div className="card info-panel">
          <h3 style={{ marginTop: 0 }}>Order details</h3>
          <div className="info-line"><span>Item</span><span>{order.listing.itemName}</span></div>
          <div className="info-line"><span>Status</span><span>{order.status}</span></div>
          <div className="info-line"><span>Amount</span><span>{order.amountUsdc.toFixed(2)} USDC</span></div>
          <div className="info-line"><span>Payment tx</span><span>{order.paymentTxHash || 'Not attached yet'}</span></div>
          <div className="info-line"><span>Hold until</span><span>{order.holdUntil ? new Date(order.holdUntil).toLocaleString() : 'No hold'}</span></div>
        </div>
        <div className="card info-panel">
          <h3 style={{ marginTop: 0 }}>Participants</h3>
          <div className="info-line"><span>Buyer</span><span>{order.buyer.walletAddress}</span></div>
          <div className="info-line"><span>Seller</span><span>{order.seller.walletAddress}</span></div>
          <div className="info-line"><span>Payout status</span><span>{order.payout?.status || 'Not created'}</span></div>
          <div className="info-line"><span>Payout tx</span><span>{order.payout?.payoutTxHash || 'Not sent'}</span></div>
          <div className="callout">For this marketplace model, Arc handles settlement while Steam handles the delivery side of the asset transfer.</div>
        </div>
      </div>
    </PageShell>
  )
}
