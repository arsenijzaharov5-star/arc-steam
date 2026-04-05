import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const walletAddress = searchParams.get('walletAddress')

  const payouts = await prisma.payout.findMany({
    where: walletAddress ? { seller: { walletAddress } } : undefined,
    include: { order: { include: { listing: true } }, seller: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(payouts)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { payoutId, status, payoutTxHash } = body as { payoutId?: string; status?: string; payoutTxHash?: string }

  if (!payoutId || !status) {
    return NextResponse.json({ error: 'payoutId and status are required' }, { status: 400 })
  }

  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: status as 'PENDING' | 'SENT' | 'FAILED', payoutTxHash },
    include: { order: { include: { listing: true } }, seller: true },
  })

  return NextResponse.json(payout)
}
