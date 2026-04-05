'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useWallet } from '@/components/WalletProvider'

export function CreateListingForm() {
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
      walletAddress,
      steamTradeLink: formData.get('steamTradeLink'),
      itemName: formData.get('itemName'),
      game: formData.get('game'),
      steamAssetId: formData.get('steamAssetId'),
      priceUsdc: formData.get('priceUsdc'),
    }

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    setLoading(false)
    setMessage(res.ok ? `Listing created: ${data.id}` : data.error || 'Failed to create listing')
  }

  return (
    <form
      action={async (fd) => {
        await onSubmit(fd)
      }}
      className="form-grid"
    >
      <label className="form-label">
        <span>Connected wallet</span>
        <input className="input" value={walletAddress || 'Connect wallet in the header'} readOnly />
      </label>
      <label className="form-label">
        <span>Steam trade link</span>
        <input className="input" name="steamTradeLink" placeholder="https://steamcommunity.com/tradeoffer/new/..." />
      </label>
      <label className="form-label">
        <span>Item name</span>
        <input className="input" name="itemName" placeholder="AK-47 | Redline (Field-Tested)" required />
      </label>
      <div className="grid grid-2">
        <label className="form-label">
          <span>Game</span>
          <input className="input" name="game" placeholder="CS2" required />
        </label>
        <label className="form-label">
          <span>Price in USDC</span>
          <input className="input" name="priceUsdc" placeholder="129.50" required />
        </label>
      </div>
      <label className="form-label">
        <span>Steam asset id</span>
        <input className="input" name="steamAssetId" placeholder="Optional internal asset id" />
      </label>
      <label className="form-label">
        <span>Steam setup status</span>
        <select className="select" value={steamReady ? 'ready' : 'missing'} onChange={(e) => setSteamReady(e.target.value === 'ready')}>
          <option value="missing">Steam trade link not added yet</option>
          <option value="ready">Steam trade link added</option>
        </select>
      </label>
      <p className="helper">This is MVP flow: listing is created in-app, settlement later happens in Arc USDC, delivery happens through Steam trade.</p>
      {!steamReady ? <div className="muted">Before listing, open <Link href="/profile">profile setup</Link> and add your Steam trade link.</div> : null}
      <button className="btn" disabled={loading || !isConnected || !steamReady}>{loading ? 'Creating listing...' : 'Create listing'}</button>
      {message && <p className={message.startsWith('Listing created') ? 'success' : 'muted'}>{message}</p>}
    </form>
  )
}
