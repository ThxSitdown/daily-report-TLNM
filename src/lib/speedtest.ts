// src/lib/speedtest.ts
// แก้ mobile: skip TCP slow-start, เพิ่ม streams, warm-up ที่ดีขึ้น

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
// วิธี: วัดเฉพาะ "steady state" — ข้ามช่วง slow-start แรก (SKIP_MS)
// ทำให้ค่าที่ได้ตรงกับความเร็วจริงที่ TCP เต็มสปีดแล้ว
async function measureDownload(): Promise<number> {
  const mobile   = isMobile()
  const STREAMS  = mobile ? 4 : 4      // เพิ่ม mobile จาก 2 → 4
  const TOTAL_MS = 12000               // วัดนาน 12 วินาที
  const SKIP_MS  = mobile ? 4000 : 3000 // ข้ามช่วง slow-start

  // Warm-up: ดาวน์โหลด 2MB ก่อนเพื่อ fill TCP buffer
  try {
    const r = await fetch(
      `https://speed.cloudflare.com/__down?bytes=2000000&r=wu${Date.now()}`,
      { cache: 'no-store', signal: abortAfter(6000).signal }
    )
    if (r.body) {
      const rd = r.body.getReader()
      // อ่านจนหมด เพื่อ establish connection จริงๆ
      while (!(await rd.read()).done) {}
    } else {
      await r.arrayBuffer()
    }
  } catch { /* ok */ }

  const abort      = abortAfter(TOTAL_MS)
  const t0         = performance.now()
  let stableT0     = -1      // เวลาที่เริ่มนับจริง (หลัง skip)
  let stableBytes  = 0       // bytes ที่นับเฉพาะ stable phase

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, i) => {
      try {
        const res = await fetch(
          `https://speed.cloudflare.com/__down?bytes=500000000&r=${i}_${Date.now()}`,
          { cache: 'no-store', signal: abort.signal }
        )

        if (!res.body) {
          // fallback สำหรับ browser เก่า
          const buf = await res.arrayBuffer()
          stableBytes += buf.byteLength
          return
        }

        const reader = res.body.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done || !value) break
            const now = performance.now()
            // เริ่มนับหลัง SKIP_MS ผ่านไป (TCP ถึง full speed แล้ว)
            if (now - t0 >= SKIP_MS) {
              if (stableT0 < 0) stableT0 = now  // บันทึกเวลาเริ่มนับครั้งแรก
              stableBytes += value.byteLength
            }
          }
        } catch {
          // AbortError ปกติเมื่อหมดเวลา
        } finally {
          reader.releaseLock()
        }
      } catch { /* stream failed */ }
    })
  )

  // elapsed = เวลาที่นับจริง (ไม่รวม slow-start)
  const elapsed = stableT0 > 0
    ? (performance.now() - stableT0) / 1000
    : (TOTAL_MS - SKIP_MS) / 1000

  if (stableBytes < 50_000 || elapsed < 1) throw new Error('Download failed')
  return parseFloat(((stableBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ───
// วิธี: warm-up แยก (ไม่นับ) แล้วจึงเริ่มจับเวลา
// Mobile: chunk เล็กลงเพื่อไม่ติด Vercel limit, แต่ rounds มากขึ้น
async function measureUpload(): Promise<number> {
  const mobile  = isMobile()
  const STREAMS = 3
  const CHUNK   = mobile ? 2_000_000 : 3_500_000  // 2MB / 3.5MB
  const ROUNDS  = mobile ? 6 : 5                  // mobile rounds มากขึ้น

  // สร้าง non-compressible payload
  const payload = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) payload[i] = (i * 1664525 + 1013904223) & 0xFF

  // Warm-up upload (ไม่นับใน timing)
  try {
    await fetch('/api/speedtest-proxy', {
      method: 'POST',
      body: new Uint8Array(300_000),
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
