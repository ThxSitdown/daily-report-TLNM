import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const s = getSession(req)
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const s = getSession(req)
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { username, password: hash, role: 'user' } })
    return NextResponse.json({ id: user.id, username: user.username })
  } catch {
    return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const s = getSession(req)
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (id === s.userId) return NextResponse.json({ error: 'ไม่สามารถลบตัวเองได้' }, { status: 400 })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
