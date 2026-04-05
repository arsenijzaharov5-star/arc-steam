import { PageShell } from '@/components/PageShell'
import { ProfileForm } from '@/components/ProfileForm'

export default function ProfilePage() {
  return (
    <PageShell title="Profile setup" subtitle="Connect wallet, add your Steam trade link, and prepare your account for buying, selling and receiving trades.">
      <div className="grid grid-2">
        <div className="card">
          <ProfileForm />
        </div>
        <div className="card info-panel">
          <h3 style={{ marginTop: 0 }}>Why this is required</h3>
          <div className="info-line"><span>Wallet</span><span>Arc USDC settlement</span></div>
          <div className="info-line"><span>Steam trade link</span><span>Item delivery</span></div>
          <div className="info-line"><span>Steam profile</span><span>Seller/account context</span></div>
          <div className="callout">The marketplace should open directly on the market, but actions like buy/sell should require a connected wallet and Steam setup.</div>
        </div>
      </div>
    </PageShell>
  )
}
