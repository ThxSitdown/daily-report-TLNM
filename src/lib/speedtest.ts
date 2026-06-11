// src/lib/speedtest.ts
// Download: ReadableStream — วัด bytes real-time ขณะไหล ไม่รอโหลดเสร็จทั้งก้อน
// Upload:   Proxy + วัดหลัง warm-up เพื่อตัด latency ออก

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
// วิธีนี้: request ไฟล์ใหญ่ (200MB) แต่ abort หลัง 8 วินาที
// อ่าน bytes ผ่าน ReadableStream ทีละ chunk แบบ streaming
// → วัดได้ว่า ใน 8 วิ ข้อมูลไหลมาเท่าไหร่ → Mbps จริง
async function measureDownload(): Promise<number> {
  const mobile  = isMobile()
  const STREAMS = mobile ? 2 : 4
  const DURATION = mobile ? 7000 : 8000 // ms
  const BIG_FILE = 200_000_000 // request 200MB แต่ abort ก่อน

  // warm-up: establish TCP+TLS connection ก่อน ไม่นับเวลา
  try {
    const res = await fetch(
      `https://speed.cloudflare.com/__down?bytes=500000&r=wu_${Date.now()}`,
      { cache: 'no-store', signal: abortAfter(4000).signal }
    )
    await res.arrayBuffer()
  } catch { /* ok */ }

  const globalAbort = abortAfter(DURATION)
  let totalBytes = 0
  const start = performance.now()

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, i) => {
      try {
        const res = await fetch(
          `https://speed.cloudflare.com/__down?bytes=${BIG_FILE}&r=${i}_${Date.now()}`,
          { cache: 'no-store', signal: globalAbort.signal }
        )

        if (!res.body) {
          // fallback สำหรับ browser เก่า
          const buf = await res.arrayBuffer()
          totalBytes += buf.byteLength
          return
        }

        // ReadableStream: อ่านทีละ chunk real-time
        const reader = res.body.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done || !value) break
            totalBytes += value.byteLength
          }
        } catch { /* abort ตัด stream — ปกติ */ } finally {
          reader.releaseLock()
        }
      } catch { /* stream failed */ }
    })
  )

  const elapsed = (performance.now() - start) / 1000
  if (totalBytes < 100_000 || elapsed < 1) throw new Error('Download failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ───
// warm-up ก่อน แล้วจึงเริ่มจับเวลา → ตัด latency overhead ออก
// chunk ≤ 3.5MB เพื่อไม่ติด Vercel 4.5MB limit
async function measureUpload(): Promise<number> {
  const mobile  = isMobile()
  const STREAMS = mobile ? 2 : 3
  const CHUNK   = 3_500_000 // 3.5MB
  const ROUNDS  = 4

  const payload = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) payload[i] = (i * 1664525 + 1013904223) & 0xFF

  // warm-up — ไม่นับเวลา
  try {
    await fetch('/api/speedtest-proxy', {
      method: 'POST',
      body: new Uint8Array(100_000),
      headers: { 'Content-Type': 'application/octet-stream' },
      cache: 'no-store',
      signal: abortAfter(5000).signal
    })
  } catch { /* ok */ }

  // เริ่มจับเวลาหลัง warm-up
  const start = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async () => {
      const ctrl = abortAfter(25000)
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

// ─── EXPORT ───
export async function runSpeedTest(
  onProgress?: (phase: 'download' | 'upload') => void
): Promise<SpeedResult> {
  onProgress?.('download')
  const download = await measureDownload()
  onProgress?.('upload')
  const upload = await measureUpload()
  return { download, upload }
}
