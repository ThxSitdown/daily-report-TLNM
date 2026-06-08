// src/app/api/speedtest/route.ts
import { NextRequest, NextResponse } from 'next/server'

// LibreSpeed open source test servers (public)
const LIBRESPEED_SERVERS = [
  {
    id: 1,
    name: 'LibreSpeed SG',
    server: 'https://do.speedtest.clouvider.net',
    dlURL: 'backend/garbage.php',
    ulURL: 'backend/empty.php',
    pingURL: 'backend/empty.php',
    getIpURL: 'backend/getIP.php'
  }
]

// We simulate via fetch timing to avoid CORS issues in production
// For real deployment: run LibreSpeed as a self-hosted container
async function measureSpeed(serverUrl: string): Promise<{ download: number; upload: number }> {
  try {
    const testSizeMB = 10 // 10 MB test
    const testSizeBytes = testSizeMB * 1024 * 1024

    // Download test
    const dlStart = Date.now()
    const dlRes = await fetch(`${serverUrl}/backend/garbage.php?ckSize=${testSizeMB}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    })
    const dlBuffer = await dlRes.arrayBuffer()
    const dlTime = (Date.now() - dlStart) / 1000
    const downloadMbps = parseFloat(((dlBuffer.byteLength * 8) / dlTime / 1_000_000).toFixed(1))

    // Upload test
    const ulData = new Uint8Array(testSizeBytes)
    crypto.getRandomValues(ulData)
    const ulStart = Date.now()
    await fetch(`${serverUrl}/backend/empty.php`, {
      method: 'POST',
      body: ulData,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    })
    const ulTime = (Date.now() - ulStart) / 1000
    const uploadMbps = parseFloat(((testSizeBytes * 8) / ulTime / 1_000_000).toFixed(1))

    return { download: downloadMbps, upload: uploadMbps }
  } catch {
    // Fallback: use a public CDN timing approach
    return await measureSpeedFallback()
  }
}

async function measureSpeedFallback(): Promise<{ download: number; upload: number }> {
  // Use Cloudflare speed test endpoint (no CORS issue, public)
  try {
    const sizes = [100000, 1000000, 10000000] // 100KB, 1MB, 10MB
    let bestDl = 0

    for (const size of sizes) {
      const start = Date.now()
      const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${size}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      })
      const buf = await res.arrayBuffer()
      const elapsed = (Date.now() - start) / 1000
      const mbps = (buf.byteLength * 8) / elapsed / 1_000_000
      bestDl = Math.max(bestDl, mbps)
    }

    // Upload test to Cloudflare
    const ulSize = 1_000_000
    const ulData = new Uint8Array(ulSize)
    const ulStart = Date.now()
    await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body: ulData,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    })
    const ulElapsed = (Date.now() - ulStart) / 1000
    const uploadMbps = (ulSize * 8) / ulElapsed / 1_000_000

    return {
      download: parseFloat(bestDl.toFixed(1)),
      upload: parseFloat(uploadMbps.toFixed(1))
    }
  } catch {
    throw new Error('Speed test failed')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json()

    if (!location) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 })
    }

    const result = await measureSpeedFallback()

    return NextResponse.json({
      location,
      download: result.download,
      upload: result.upload,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Speedtest error:', error)
    return NextResponse.json(
      { error: 'Speed test failed. Please try again.' },
      { status: 500 }
    )
  }
}
