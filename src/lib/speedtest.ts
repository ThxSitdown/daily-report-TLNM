// src/lib/speedtest.ts
// Upload chunk ต้องไม่เกิน 4MB (Vercel body limit = 4.5MB)

export interface SpeedResult {
  download: number
  upload: number
}

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function abortAfter(ms: number): AbortController {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), ms)
  return ctrl
}

// ─── DOWNLOAD ───
async function measureDownload(): Promise<number> {
  const mobile  = isMobile()
  const STREAMS = mobile ? 2 : 4
  const SIZE    = mobile ? 8_000_000 : 20_000_000 // 8MB / 20MB

  // warm-up
  try {
    await fetch(`https://speed.cloudflare.com/__down?bytes=100000&r=wu_${Date.now()}`, {
      cache: 'no-store', signal: abortAfter(3000).signal
    })
  } catch { /* ok */ }

  const start = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, i) => {
      try {
        const res = await fetch(
          `https://speed.cloudflare.com/__down?bytes=${SIZE}&r=${i}_${Date.now()}`,
          { cache: 'no-store', signal: abortAfter(15000).signal }
        )
        totalBytes += (await res.arrayBuffer()).byteLength
      } catch { /* skip */ }
    })
  )

  const elapsed = (performance.now() - start) / 1000
  if (!totalBytes || elapsed < 0.5) throw new Error('Download failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ───
// chunk ≤ 4MB เพื่อไม่ให้ติด Vercel 4.5MB limit
// ส่งหลาย round ต่อเนื่องเพื่อให้เวลาวัดยาวพอ
async function measureUpload(): Promise<number> {
  const mobile   = isMobile()
  const STREAMS  = mobile ? 2 : 3
  const CHUNK    = 3_500_000  // 3.5MB — ปลอดภัยกว่า 4.5MB limit
  const ROUNDS   = 4          // ส่งกี่รอบต่อ stream
  const TIMEOUT  = 25000

  // สร้าง payload ที่ไม่ compress ได้
  const payload = new Uint8Array(CHUNK)
  crypto.getRandomValues(payload.subarray(0, 65536))
  for (let i = 65536; i < CHUNK; i++) payload[i] = (i * 1664525 + 1013904223) & 0xFF

  // warm-up upload เล็กๆ
  try {
    await fetch('/api/speedtest-proxy', {
      method: 'POST',
      body: new Uint8Array(50_000),
      headers: { 'Content-Type': 'application/octet-stream' },
      cache: 'no-store',
      signal: abortAfter(4000).signal
    })
  } catch { /* ok */ }

  const start = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async () => {
      const ctrl = abortAfter(TIMEOUT)
      for (let r = 0; r < ROUNDS; r++) {
        if (ctrl.signal.aborted) break
        try {
          const res = await fetch('/api/speedtest-proxy', {
            method: 'POST',
            body: payload.slice(),
            headers: { 'Content-Type': 'application/octet-stream' },
            cache: 'no-store',
            signal: ctrl.signal
          })
          if (res.ok) totalBytes += CHUNK
        } catch { break }
      }
    })
  )

  const elapsed = (performance.now() - start) / 1000
  if (!totalBytes || elapsed < 0.5) throw new Error('Upload failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

export async function runSpeedTest(
  onProgress?: (phase: 'download' | 'upload') => void
): Promise<SpeedResult> {
  onProgress?.('download')
  const download = await measureDownload()
  onProgress?.('upload')
  const upload = await measureUpload()
  return { download, upload }
}
