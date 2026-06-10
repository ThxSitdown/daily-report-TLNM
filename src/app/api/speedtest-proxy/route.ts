// src/app/api/speedtest-proxy/route.ts
// Proxy สำหรับ Upload test — แก้ CORS ที่ Cloudflare __up ไม่รับ browser โดยตรง

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.arrayBuffer()
    const res = await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    return new NextResponse(null, {
      status: res.status,
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
