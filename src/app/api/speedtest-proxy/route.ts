// src/app/api/speedtest-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

// อนุญาตให้ส่งไฟล์ขนาดใหญ่ขึ้นบน Vercel (ถ้าจำเป็น)
export const config = {
  api: {
    bodyParser: false, // ปิด bodyParser เพื่อรับข้อมูลแบบ Stream ตรงๆ
  },
}

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 })
    }

    // 💡 หัวใจสำคัญ: ต้องอ่าน (Consume) ข้อมูลจาก Stream ให้หมด
    // เพื่อให้ฝั่ง Client ทำการ Upload ข้อมูลครบตามจำนวน Bytes จริงๆ 
    // และการใช้ Reader จะไม่กิน Memory ของ Server (ไม่เกิด Memory Leak)
    const reader = request.body.getReader()
    while (true) {
      const { done } = await reader.read()
      if (done) break
    }

    // ตอบกลับเมื่อรับข้อมูลครบถ้วน
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}