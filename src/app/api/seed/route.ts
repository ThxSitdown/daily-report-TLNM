import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // เช็คว่า users table มีอยู่และ admin ยังไม่มี
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
    if (existing) {
      return NextResponse.json({ 
        success: true,
        message: 'Admin มีอยู่แล้ว ไม่ต้องสร้างใหม่',
        username: 'admin'
      })
    }

    const hash = await bcrypt.hash('Tlcmn@1122', 10)
    await prisma.user.create({
      data: { username: 'admin', password: hash, role: 'admin' }
    })

    return NextResponse.json({ 
      success: true,
      message: 'สร้าง Admin สำเร็จ! กรุณา Login ด้วย admin / Tlcmn@1122',
      username: 'admin',
      password: 'Tlcmn@1122'
    })
  } catch (error: any) {
    // ถ้า table ยังไม่มี (ยังไม่ได้รัน prisma db push)
    return NextResponse.json({ 
      success: false,
      error: 'Database error: ' + error.message,
      hint: 'กรุณารัน: npx prisma db push ก่อน แล้วเปิดหน้านี้ใหม่'
    }, { status: 500 })
  }
}
