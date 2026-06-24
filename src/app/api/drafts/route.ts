import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const s = getSession(req)
  if (!s) return NextResponse.json(null)
  const hotelType = new URL(req.url).searchParams.get('hotelType') || ''
  try {
    const d = await prisma.draft.findUnique({ where: { userId_hotelType: { userId: s.userId, hotelType } } })
    return NextResponse.json(d?.data ?? null)
  } catch { return NextResponse.json(null) }
}
export async function POST(req: NextRequest) {
  const s = getSession(req)
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { hotelType, data } = await req.json()
  await prisma.draft.upsert({
    where: { userId_hotelType: { userId: s.userId, hotelType } },
    update: { data }, create: { userId: s.userId, hotelType, data }
  })
  return NextResponse.json({ success: true })
}
export async function DELETE(req: NextRequest) {
  const s = getSession(req)
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const hotelType = new URL(req.url).searchParams.get('hotelType') || ''
  await prisma.draft.deleteMany({ where: { userId: s.userId, hotelType } })
  return NextResponse.json({ success: true })
}
