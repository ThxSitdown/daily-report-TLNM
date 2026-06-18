import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (existing) return NextResponse.json({ message: 'Admin มีอยู่แล้ว' })
  const hash = await bcrypt.hash('Tlcmn@1122', 10)
  await prisma.user.create({ data: { username: 'admin', password: hash, role: 'admin' } })
  return NextResponse.json({ message: 'สร้าง Admin สำเร็จ' })
}
