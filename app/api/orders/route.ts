import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const walletAddress = searchParams.get('walletAddress')

  const orders = await prisma.order.findMany({
    where: walletAddress
      ? {
          OR: [
            { buyer: { walletAddress } },
            { seller: { walletAddress } },
          ],
        }
      : undefined,
    include: { listing: true, buyer: true, seller: true, payout: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { listingId, buyerWalletAddress, paymentTxHash } = body

  if (!listingId || !buyerWalletAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { seller: true, custodyItem: true } })
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Listing is not available' }, { status: 409 })
  }
  if (!listing.custodyItem) {
    return NextResponse.json({ error: 'Listing is not in custody yet' }, { status: 409 })
  }

  const buyer = await prisma.user.upsert({
    where: { walletAddress: buyerWalletAddress },
    update: {},
    create: { walletAddress: buyerWalletAddress },
  })

  const initialStatus = paymentTxHash ? 'PAID' : 'CREATED'
  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      listingId: listing.id,
      amountUsdc: listing.priceUsdc,
      paymentTxHash,
      status: initialStatus,
    },
  })

  await prisma.listing.update({ where: { id: listing.id }, data: { status: 'RESERVED' } })
  await prisma.custodyItem.update({ where: { listingId: listing.id }, data: { custodyStatus: 'RESERVED' } })

  return NextResponse.json(order, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { orderId, status } = body as { orderId?: string; status?: string }

  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { listing: { include: { custodyItem: true } } } })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const patch: Record<string, unknown> = { status }

  if (status === 'TRADE_HOLD') {
    const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    patch.holdUntil = holdUntil
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: patch,
    include: { listing: true, buyer: true, seller: true, payout: true },
  })

  if (status === 'DELIVERED') {
    await prisma.listing.update({ where: { id: order.listingId }, data: { status: 'SOLD' } })

    if (order.listing.custodyItem) {
      await prisma.withdrawal.upsert({
        where: { orderId },
        update: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          sentAt: new Date(),
          botId: order.listing.custodyItem.botId,
        },
        create: {
          orderId,
          custodyItemId: order.listing.custodyItem.id,
          botId: order.listing.custodyItem.botId,
          status: 'ACCEPTED',
          sentAt: new Date(),
          acceptedAt: new Date(),
        },
      })
      await prisma.custodyItem.update({ where: { listingId: order.listingId }, data: { custodyStatus: 'COMPLETED' } })
    }

    const existingPayout = await prisma.payout.findUnique({ where: { orderId } })
    if (!existingPayout) {
      await prisma.payout.create({
        data: {
          orderId,
          sellerId: order.sellerId,
          amountUsdc: order.amountUsdc,
          status: 'PENDING',
        },
      })
    }
  }

  if (status === 'IN_DELIVERY' && order.listing.custodyItem) {
    await prisma.withdrawal.upsert({
      where: { orderId },
      update: {
        status: 'OFFER_SENT',
        sentAt: new Date(),
        botId: order.listing.custodyItem.botId,
      },
      create: {
        orderId,
        custodyItemId: order.listing.custodyItem.id,
        botId: order.listing.custodyItem.botId,
        status: 'OFFER_SENT',
        sentAt: new Date(),
      },
    })
    await prisma.custodyItem.update({ where: { listingId: order.listingId }, data: { custodyStatus: 'SENT_TO_BUYER' } })
  }

  if (status === 'CANCELED' || status === 'DISPUTED') {
    await prisma.listing.update({ where: { id: order.listingId }, data: { status: 'ACTIVE' } })
    if (order.listing.custodyItem) {
      await prisma.custodyItem.update({ where: { listingId: order.listingId }, data: { custodyStatus: 'LISTED' } })
    }
  }

  return NextResponse.json(updated)
}
