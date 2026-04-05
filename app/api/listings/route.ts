import { NextRequest, NextResponse } from 'next/server'
import { resolveItemImage } from '@/lib/item-images'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const listings = await prisma.listing.findMany({
    include: { deposit: true, custodyItem: { include: { bot: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(listings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { walletAddress, steamTradeLink, itemName, game, priceUsdc, steamAssetId } = body

  if (!walletAddress || !itemName || !game || !priceUsdc) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: { steamTradeLink: steamTradeLink || undefined },
    create: { walletAddress, steamTradeLink },
  })

  const bot = await prisma.bot.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!bot) {
    return NextResponse.json({ error: 'No custody bot available. Seed bots first.' }, { status: 503 })
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      itemName,
      game,
      imageUrl: resolveItemImage(itemName),
      priceUsdc: Number(priceUsdc),
      steamAssetId,
      status: 'PENDING_DEPOSIT',
      deposit: {
        create: {
          botId: bot.id,
          status: 'OFFER_SENT',
        },
      },
      custodyItem: {
        create: {
          botId: bot.id,
          steamAssetId,
          custodyStatus: 'AWAITING_DEPOSIT',
        },
      },
    },
    include: { deposit: true, custodyItem: true },
  })

  return NextResponse.json(listing, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { listingId, status } = body as { listingId?: string; status?: string }

  if (!listingId || !status) {
    return NextResponse.json({ error: 'listingId and status are required' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { custodyItem: true, deposit: true } })
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status: status as 'PENDING_DEPOSIT' | 'IN_CUSTODY' | 'ACTIVE' | 'RESERVED' | 'SOLD' | 'REMOVED' },
    include: { deposit: true, custodyItem: { include: { bot: true } } },
  })

  if (status === 'IN_CUSTODY' || status === 'ACTIVE') {
    if (listing.deposit) {
      await prisma.deposit.update({
        where: { listingId },
        data: { status: 'RECEIVED', receivedAt: new Date() },
      })
    }
    if (listing.custodyItem) {
      await prisma.custodyItem.update({
        where: { listingId },
        data: { custodyStatus: status === 'ACTIVE' ? 'LISTED' : 'RECEIVED' },
      })
    }
  }

  return NextResponse.json(updated)
}
