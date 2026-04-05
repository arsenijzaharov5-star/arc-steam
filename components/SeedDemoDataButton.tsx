'use client'

import { useState } from 'react'

export function SeedDemoDataButton() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function seed() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/seed', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    setMessage(res.ok ? data.message : data.error || 'Seed failed')
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button className="btn" onClick={seed} disabled={loading}>{loading ? 'Seeding...' : 'Seed demo data'}</button>
      {message ? <span className="muted">{message}</span> : null}
    </div>
  )
}
