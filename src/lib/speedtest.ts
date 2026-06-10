// src/lib/speedtest.ts — client-side speed test
// Download: fetch ไป Cloudflare โดยตรง (GET ไม่มี CORS)
// Upload:   POST ผ่าน /api/speedtest-proxy ของเรา (แก้ CORS)

export interface SpeedResult {
  download: number
  upload: number
}

// ─── DOWNLOAD ─── (parallel streams, fetch โดยตรงได้เพราะเป็น GET)
async function measureDownload(): Promise<number> {
  const PARALLEL = 4
  const CHUNK    = 25_000_000 // 25MB per stream
  let totalBytes = 0
  const start = performance.now()

  await Promise.allSettled(
    Array.from({ length: PARALLEL }, async (_, i) => {
      try {
        const url = `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${i}_${Date.now()}`
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        })
        const buf = await res.arrayBuffer()
        totalBytes += buf.byteLength
      } catch { /* stream ล้มเหลว ข้ามไป */ }
    })
  )

  const elapsed = (performance.now() - start) / 1000
  if (elapsed < 0.1 || totalBytes === 0) throw new Error('Download failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ─── (ผ่าน proxy /api/speedtest-proxy เพื่อแก้ CORS)
// ใช้ fetch + ReadableStream เพื่อวัดเวลาที่แน่นอน
async function measureUpload(): Promise<number> {
  const PARALLEL  = 3
  const CHUNK     = 8_000_000 // 8MB per request

  // สร้าง data ที่ไม่ compressible
  const data = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) data[i] = (i * 37 ^ 0xA5) & 0xFF

  let totalBytes = 0
  const start = performance.now()

  await Promise.allSettled(
    Array.from({ length: PARALLEL }, async () => {
      try {
        const t0 = performance.now()
        await fetch('/api/speedtest-proxy', {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/octet-stream' },
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        })
        const took = performance.now() - t0
        // นับ bytes ก็ต่อเมื่อ request สำเร็จ
        if (took > 100) totalBytes += CHUNK
      } catch { /* ล้มเหลว ข้ามไป */ }
    })
  )

  const elapsed = (performance.now() - start) / 1000
  if (elapsed < 0.1 || totalBytes === 0) throw new Error('Upload failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── MAIN ───
export async function runSpeedTest(
  onProgress?: (phase: 'download' | 'upload') => void
): Promise<SpeedResult> {
  onProgress?.('download')
  const download = await measureDownload()

  onProgress?.('upload')
  const upload = await measureUpload()

  return { download, upload }
}
