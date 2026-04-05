import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { walletAddress, steamTradeLink, steamProfile } = body as {
    walletAddress?: string
    steamTradeLink?: string
    steamProfile?: string
  }

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: { steamTradeLink, steamProfile },
    create: { walletAddress, steamTradeLink, steamProfile },
  })

  return NextResponse.json(user)
}
