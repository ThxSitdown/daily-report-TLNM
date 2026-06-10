// src/app/api/speedtest-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 })
    }

    // ใน App Router เราสามารถอ่าน Stream ได้ทันที โดยไม่ต้องปิด bodyParser แล้วครับ
    const reader = request.body.getReader()
    while (true) {
      const { done } = await reader.read()
      if (done) break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}