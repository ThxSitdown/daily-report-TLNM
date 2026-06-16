// src/lib/speedtest.ts
// เพิ่ม streams + chunk ใหญ่ขึ้น + warm-up 2 รอบ

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

// fetch + arrayBuffer รองรับทุก browser รวมถึง iOS Safari
async function fetchChunk(url: string, timeoutMs: number): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: abortAfter(timeoutMs).signal,
    })
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

// ─── DOWNLOAD ───
async function measureDownload(): Promise<number> {
  const mobile   = isMobile()
  const STREAMS  = mobile ? 5 : 6       // เพิ่มจาก 3-4 → 5-6
  const CHUNK    = mobile ? 5_000_000 : 8_000_000  // 5MB / 8MB ต่อ request
  const TOTAL_MS = 15000                // 15 วินาที
  const SKIP_MS  = 4000                 // ข้าม slow-start 4 วินาทีแรก

  // warm-up 2 รอบ: เพื่อ fill TCP congestion window จริงๆ
  for (let i = 0; i < 2; i++) {
    await fetchChunk(
      `https://speed.cloudflare.com/__down?bytes=3000000&r=wu${i}_${Date.now()}`,
      8000
    )
  }

  const t0        = performance.now()
  let stableT     = -1
  let stableBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, si) => {
      let n = 0
      while (performance.now() - t0 < TOTAL_MS) {
        const buf = await fetchChunk(
          `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${si}_${n++}_${Date.now()}`,
          15000
        )
        if (!buf) break
        const now = performance.now()
        if (now - t0 >= SKIP_MS) {
          if (stableT < 0) stableT = now
          stableBytes += buf.byteLength
        }
      }
    })
  )

  const elapsed = stableT > 0
    ? (performance.now() - stableT) / 1000
    : (TOTAL_MS - SKIP_MS) / 1000

  if (stableBytes < 100_000 || elapsed < 0.5) throw new Error('Download failed')
  return parseFloat(((stableBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ───
async function measureUpload(): Promise<number> {
  const mobile  = isMobile()
  const STREAMS = mobile ? 4 : 5        // เพิ่มจาก 3 → 4-5
  const CHUNK   = 3_000_000             // 3MB (ปลอดภัยจาก Vercel 4.5MB limit)
  const ROUNDS  = mobile ? 7 : 6        // รอบมากขึ้น

  const payload = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) payload[i] = (i * 1664525 + 1013904223) & 0xFF

  // warm-up 2 รอบ
  for (let i = 0; i < 2; i++) {
    try {
      await fetch('/api/speedtest-proxy', {
        method: 'POST',
        body: new Uint8Array(200_000),
        headers: { 'Content-Type': 'application/octet-stream' },
        cache: 'no-store',
        signal: abortAfter(6000).signal,
      })
    } catch { /* ok */ }
  }

  const t0 = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async () => {
      const ctrl = abortAfter(40000)
      for (let r = 0; r < ROUNDS; r++) {
        if (ctrl.signal.aborted) break
        try {
          const res = await fetch('/api/speedtest-proxy', {
            method: 'POST',
            body: payload.slice(),
            headers: { 'Content-Type': 'application/octet-stream' },
            cache: 'no-store',
            signal: ctrl.signal,
          })
          if (res.ok) totalBytes += CHUNK
        } catch { break }
      }
    })
  )

  const elapsed = (performance.now() - t0) / 1000
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
