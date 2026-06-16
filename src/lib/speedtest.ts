// src/lib/speedtest.ts
// Download: Sequential small chunks per stream + arrayBuffer()
//           iOS Safari throttles ReadableStream → ใช้ arrayBuffer() แทน
// Upload:   POST to /api/speedtest-proxy (discard-only, ไม่ forward ไป Cloudflare)

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
// หลักการใหม่: แต่ละ stream ดาวน์โหลด chunk เล็กๆ ซ้ำๆ แทนไฟล์ใหญ่ก้อนเดียว
// ข้อดี: arrayBuffer() ทำงานดีบน iOS, ข้ามผล slow-start, วัดได้แม่นยำกว่า
async function measureDownload(): Promise<number> {
  const mobile   = isMobile()
  const STREAMS  = mobile ? 3 : 4
  const CHUNK    = mobile ? 2_000_000 : 5_000_000  // 2MB / 5MB ต่อ request
  const TOTAL_MS = 12000    // หน้าต่างวัดทั้งหมด 12 วินาที
  const SKIP_MS  = 3000     // ข้ามช่วง slow-start 3 วินาทีแรก

  // warm-up: establish HTTP/2 connection ก่อน
  try {
    const r = await fetch(
      `https://speed.cloudflare.com/__down?bytes=1000000&r=wu${Date.now()}`,
      { cache: 'no-store', signal: abortAfter(6000).signal }
    )
    await r.arrayBuffer()
  } catch { /* ok */ }

  const t0         = performance.now()
  let stableT      = -1   // เวลาที่เริ่มนับจริง (หลัง slow-start)
  let stableBytes  = 0    // bytes ที่วัดได้ใน stable phase

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, si) => {
      let n = 0
      // วนซ้ำจนครบ TOTAL_MS
      while (performance.now() - t0 < TOTAL_MS) {
        try {
          const res = await fetch(
            `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${si}_${n++}_${Date.now()}`,
            { cache: 'no-store', signal: abortAfter(10000).signal }
          )
          const buf = await res.arrayBuffer()
          const now = performance.now()

          // นับเฉพาะหลัง slow-start ผ่านไปแล้ว
          if (now - t0 >= SKIP_MS) {
            if (stableT < 0) stableT = now  // บันทึกจุดเริ่มต้นนับ
            stableBytes += buf.byteLength
          }
        } catch { break }
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
// ส่ง POST ไปที่ /api/speedtest-proxy ซึ่งรับแล้ว discard ทันที
// ไม่ forward ไป Cloudflare → ลด latency, วัด upload ถึง Vercel edge โดยตรง
async function measureUpload(): Promise<number> {
  const mobile  = isMobile()
  const STREAMS = 3
  const CHUNK   = 3_000_000  // 3MB ต่อ request (< Vercel 4.5MB limit)
  const ROUNDS  = mobile ? 6 : 5

  // สร้าง payload ที่ไม่ compress
  const payload = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) payload[i] = (i * 1664525 + 1013904223) & 0xFF

  // warm-up (ไม่นับเวลา)
  try {
    await fetch('/api/speedtest-proxy', {
      method: 'POST',
      body: new Uint8Array(200_000),
      headers: { 'Content-Type': 'application/octet-stream' },
      cache: 'no-store',
      signal: abortAfter(6000).signal
    })
  } catch { /* ok */ }

  // เริ่มจับเวลาหลัง warm-up เสร็จ
  const t0 = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async () => {
      const ctrl = abortAfter(35000)
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
