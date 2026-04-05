import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'

export function Header() {
  return (
    <div className="header">
      <div>
        <Link href="/"><strong>Arc Steam Marketplace</strong></Link>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Hybrid Steam item trading with Arc USDC settlement</div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="nav">
          <Link href="/">Marketplace</Link>
          <Link href="/sell">Sell</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <WalletButton />
      </div>
    </div>
  )
}
