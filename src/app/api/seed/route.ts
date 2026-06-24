import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
    if (existing) return NextResponse.json({ success: true, message: 'Admin มีอยู่แล้ว' })
    const hash = await bcrypt.hash('Tlcmn@1122', 10)
    await prisma.user.create({ data: { username: 'admin', password: hash, role: 'admin' } })
    return NextResponse.json({ success: true, message: 'สร้าง Admin สำเร็จ! Login: admin / Tlcmn@1122' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, hint: 'รัน: npx prisma db push ก่อน' }, { status: 500 })
  }
}
