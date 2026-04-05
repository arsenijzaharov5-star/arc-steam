'use client'

import { useState } from 'react'
import { useWallet } from '@/components/WalletProvider'

export function ProfileForm() {
  const { walletAddress, isConnected } = useWallet()
  const [steamTradeLink, setSteamTradeLink] = useState('')
  const [steamProfile, setSteamProfile] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!isConnected || !walletAddress) {
      setMessage('Connect wallet first')
      return
    }
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, steamTradeLink, steamProfile }),
    })
    const data = await res.json()
    setLoading(false)
    setMessage(res.ok ? 'Profile saved' : data.error || 'Failed to save profile')
  }

  return (
    <div className="form-grid">
      <label className="form-label">
        <span>Connected wallet</span>
        <input className="input" value={walletAddress || 'Connect wallet in header'} readOnly />
      </label>
      <label className="form-label">
        <span>Steam trade link</span>
        <input className="input" value={steamTradeLink} onChange={(e) => setSteamTradeLink(e.target.value)} placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..." />
      </label>
      <label className="form-label">
        <span>Steam profile link</span>
        <input className="input" value={steamProfile} onChange={(e) => setSteamProfile(e.target.value)} placeholder="https://steamcommunity.com/id/..." />
      </label>
      <button className="btn" onClick={save} disabled={loading || !isConnected}>{loading ? 'Saving...' : 'Save profile'}</button>
      {message ? <div className="muted">{message}</div> : null}
    </div>
  )
}
