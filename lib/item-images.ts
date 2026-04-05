const IMAGE_MAP: Record<string, string> = {
  'AK-47 | Redline (FT)': '/images/cs2-ak-redline.svg',
  'AWP | Asiimov (WW)': '/images/cs2-awp-asiimov.svg',
  'Butterfly Knife | Fade': '/images/cs2-butterfly-fade.svg',
  'M4A1-S | Printstream': '/images/cs2-printstream.svg',
}

function fallbackByName(itemName: string) {
  const lower = itemName.toLowerCase()
  if (lower.includes('knife')) return '/images/cs2-butterfly-fade.svg'
  if (lower.includes('awp')) return '/images/cs2-awp-asiimov.svg'
  if (lower.includes('m4')) return '/images/cs2-printstream.svg'
  return '/images/cs2-ak-redline.svg'
}

export function resolveItemImage(itemName: string, imageUrl?: string | null) {
  if (imageUrl && imageUrl.startsWith('/images/')) return imageUrl
  return IMAGE_MAP[itemName] || fallbackByName(itemName)
}

export { IMAGE_MAP }
