'use client'

import { useState } from 'react'

const STATUSES = ['CREATED', 'PAID', 'AWAITING_SELLER', 'IN_DELIVERY', 'TRADE_HOLD', 'DELIVERED', 'CANCELED', 'DISPUTED']

export function OrderStatusManager({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function apply() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
    const data = await res.json()
    setLoading(false)
    setMessage(res.ok ? `Updated to ${data.status}` : data.error || 'Failed to update')
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
        {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <button className="btn secondary" onClick={apply} disabled={loading}>{loading ? 'Saving...' : 'Update'}</button>
      {message ? <span className="muted">{message}</span> : null}
    </div>
  )
}
