import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const existingBots = await prisma.bot.count()
  if (existingBots === 0) {
    await prisma.bot.createMany({
      data: Array.from({ length: 10 }).map((_, i) => ({
        steamAccount: `bot_${i + 1}`,
        displayName: `Custody Bot #${i + 1}`,
        status: 'ONLINE',
        inventoryCap: 200,
      })),
    })
  }

  const seller = await prisma.user.upsert({
    where: { walletAddress: '0xseller000000000000000000000000000000000001' },
    update: { displayName: 'Demo Seller', steamTradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=demo' },
    create: {
      walletAddress: '0xseller000000000000000000000000000000000001',
      displayName: 'Demo Seller',
      steamTradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=demo',
    },
  })

  const items = [
    {
      itemName: 'AK-47 | Redline (FT)',
      game: 'CS2',
      priceUsdc: 129.5,
      imageUrl: '/images/cs2-ak-redline.svg'
    },
    {
      itemName: 'AWP | Asiimov (WW)',
      game: 'CS2',
      priceUsdc: 188.0,
      imageUrl: '/images/cs2-awp-asiimov.svg'
    },
    {
      itemName: 'Butterfly Knife | Fade',
      game: 'CS2',
      priceUsdc: 2149.0,
      imageUrl: '/images/cs2-butterfly-fade.svg'
    },
  ]

  for (const item of items) {
    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        itemName: item.itemName,
        game: item.game,
        priceUsdc: item.priceUsdc,
        imageUrl: item.imageUrl,
        status: 'ACTIVE',
        deposit: {
          create: {
            botId: (await prisma.bot.findFirstOrThrow({ orderBy: { createdAt: 'asc' } })).id,
            status: 'RECEIVED',
            receivedAt: new Date(),
          },
        },
        custodyItem: {
          create: {
            botId: (await prisma.bot.findFirstOrThrow({ orderBy: { createdAt: 'asc' } })).id,
            steamAssetId: item.itemName,
            custodyStatus: 'LISTED',
          },
        },
      },
    })
  }

  return NextResponse.json({ ok: true, message: 'Demo data seeded with custody bots' })
}
