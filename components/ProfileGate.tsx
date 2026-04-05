'use client'

import Link from 'next/link'
import { useWallet } from '@/components/WalletProvider'

export function ProfileGate({ needsSteam = false }: { needsSteam?: boolean }) {
  const { isConnected } = useWallet()

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="row-between">
        <div>
          <h3 style={{ margin: 0 }}>Account requirements</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            {needsSteam
              ? 'To buy or sell, connect a wallet and add your Steam trade link.'
              : 'To continue, connect a wallet.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge">Wallet: {isConnected ? 'Connected' : 'Required'}</span>
          {needsSteam ? <Link className="btn secondary" href="/profile">Open profile</Link> : null}
        </div>
      </div>
    </div>
  )
}
