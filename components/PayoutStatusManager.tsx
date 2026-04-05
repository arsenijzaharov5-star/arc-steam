'use client'

import { useState } from 'react'

const STATUSES = ['PENDING', 'SENT', 'FAILED']

export function PayoutStatusManager({ payoutId, currentStatus }: { payoutId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [txHash, setTxHash] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function apply() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutId, status, payoutTxHash: txHash || undefined }),
    })
    const data = await res.json()
    setLoading(false)
    setMessage(res.ok ? `Payout updated: ${data.status}` : data.error || 'Failed to update payout')
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <input className="input" placeholder="Payout tx hash (optional)" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
      <button className="btn secondary" onClick={apply} disabled={loading}>{loading ? 'Saving...' : 'Update payout'}</button>
      {message ? <span className="muted">{message}</span> : null}
    </div>
  )
}
