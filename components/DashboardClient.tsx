'use client'

import { useEffect, useMemo, useState } from 'react'
import { OrderCard } from '@/components/OrderCard'
import { useWallet } from '@/components/WalletProvider'

type Order = {
  id: string
  status: string
  amountUsdc: number
  holdUntil?: string | null
  buyer: { walletAddress: string }
  seller: { walletAddress: string }
  listing: { itemName: string }
}

type Payout = {
  id: string
  status: string
  amountUsdc: number
  payoutTxHash?: string | null
  order: { listing: { itemName: string } }
}

export function DashboardClient() {
  const { walletAddress, isConnected } = useWallet()
  const [orders, setOrders] = useState<Order[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!isConnected || !walletAddress) return
      setLoading(true)
      const [ordersRes, payoutsRes] = await Promise.all([
        fetch(`/api/orders?walletAddress=${encodeURIComponent(walletAddress)}`),
        fetch(`/api/payouts?walletAddress=${encodeURIComponent(walletAddress)}`),
      ])
      const [ordersData, payoutsData] = await Promise.all([ordersRes.json(), payoutsRes.json()])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setPayouts(Array.isArray(payoutsData) ? payoutsData : [])
      setLoading(false)
    }
    void load()
  }, [walletAddress, isConnected])

  const buyOrders = useMemo(() => orders.filter((o) => o.buyer.walletAddress === walletAddress), [orders, walletAddress])
  const sellOrders = useMemo(() => orders.filter((o) => o.seller.walletAddress === walletAddress), [orders, walletAddress])

  if (!isConnected) {
    return <div className="card">Connect wallet to see your orders, sales and payouts.</div>
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card row-between">
        <div>
          <h3 style={{ margin: 0 }}>Connected wallet</h3>
          <p className="muted" style={{ marginBottom: 0 }}>{walletAddress}</p>
        </div>
        <div className="badge">{loading ? 'Refreshing…' : 'Live dashboard'}</div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>My purchases</h3>
          <div className="grid">
            {buyOrders.map((order) => (
              <OrderCard key={order.id} id={order.id} itemName={order.listing.itemName} amountUsdc={order.amountUsdc} status={order.status} role="buyer" holdUntil={order.holdUntil} />
            ))}
            {buyOrders.length === 0 && <p className="muted">No purchases yet.</p>}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>My sales</h3>
          <div className="grid">
            {sellOrders.map((order) => (
              <OrderCard key={order.id} id={order.id} itemName={order.listing.itemName} amountUsdc={order.amountUsdc} status={order.status} role="seller" holdUntil={order.holdUntil} />
            ))}
            {sellOrders.length === 0 && <p className="muted">No sales yet.</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>My payouts</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.order.listing.itemName}</td>
                  <td><span className="badge">{payout.status}</span></td>
                  <td>{payout.amountUsdc.toFixed(2)} USDC</td>
                  <td>{payout.payoutTxHash || '—'}</td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">No payouts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
