// src/app/api/speedtest-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// เพิ่ม body size limit สำหรับ upload
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.arrayBuffer()

    const res = await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(body.byteLength),
      },
    })

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
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
