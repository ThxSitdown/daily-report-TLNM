// src/app/api/speedtest-proxy/route.ts
// รับ upload data แล้ว discard ทันที — ไม่ forward ไปที่ไหน
// วัด: pure upload speed จาก client → Vercel edge
// ข้อดี: ลด 1 hop (ไม่ต้องรอ Vercel → Cloudflare), ลด latency, แม่นยำขึ้น

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    await req.arrayBuffer()  // consume และ discard body
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
