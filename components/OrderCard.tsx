import Link from 'next/link'

type OrderCardProps = {
  id: string
  itemName: string
  amountUsdc: number
  status: string
  role: 'buyer' | 'seller'
  holdUntil?: string | null
}

export function OrderCard({ id, itemName, amountUsdc, status, role, holdUntil }: OrderCardProps) {
  return (
    <Link href={`/orders/${id}`} className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="row-between">
        <span className="badge badge-soft">{role}</span>
        <span className="badge">{status}</span>
      </div>
      <div>
        <h3 style={{ margin: '0 0 8px' }}>{itemName}</h3>
        <p className="muted" style={{ margin: 0 }}>{amountUsdc.toFixed(2)} USDC</p>
      </div>
      {holdUntil ? <div className="muted">Hold until: {new Date(holdUntil).toLocaleString()}</div> : <div className="muted">Open order</div>}
    </Link>
  )
}
