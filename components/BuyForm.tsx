'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useWallet } from '@/components/WalletProvider'

export function BuyForm({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [steamReady, setSteamReady] = useState(false)
  const { walletAddress, isConnected } = useWallet()

  async function onSubmit(formData: FormData) {
    if (!isConnected || !walletAddress) {
      setMessage('Connect wallet first')
      return
    }
    setLoading(true)
    setMessage('')
    const payload = {
      listingId,
      buyerWalletAddress: walletAddress,
      paymentTxHash: formData.get('paymentTxHash'),
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)
    setMessage(res.ok ? `Order created: ${data.id}` : data.error || 'Failed to create order')
  }

  return (
    <form action={async (fd) => { await onSubmit(fd) }} className="form-grid" style={{ marginTop: 18 }}>
      <label className="form-label">
        <span>Connected wallet</span>
        <input className="input" value={walletAddress || 'Connect wallet in the header'} readOnly />
      </label>
      <label className="form-label">
        <span>Payment tx hash</span>
        <input className="input" name="paymentTxHash" placeholder="Mock for now — real Arc tx hash later" />
      </label>
      <label className="form-label">
        <span>Steam setup status</span>
        <select className="select" value={steamReady ? 'ready' : 'missing'} onChange={(e) => setSteamReady(e.target.value === 'ready')}>
          <option value="missing">Steam trade link not added yet</option>
          <option value="ready">Steam trade link added</option>
        </select>
      </label>
      <div className="callout">MVP note: this currently creates an order and reserves the listing. Real Arc USDC payment verification comes next.</div>
      {!steamReady ? <div className="muted">Before buying, open <Link href="/profile">profile setup</Link> and add your Steam trade link.</div> : null}
      <button className="btn" disabled={loading || !isConnected || !steamReady}>{loading ? 'Creating order...' : 'Buy with Arc USDC'}</button>
      {message && <p className={message.startsWith('Order created') ? 'success' : 'muted'}>{message}</p>}
    </form>
  )
}
