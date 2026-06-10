// src/lib/speedtest.ts
// วิธีวัดที่แม่นยำ: วัดเฉพาะ throughput จริง ไม่รวม latency

export interface SpeedResult {
  download: number
  upload: number
}

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

// AbortController timeout รองรับ iOS Safari
function abortAfter(ms: number): AbortController {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), ms)
  return ctrl
}

// ─── DOWNLOAD ───
// หลักการ: ดาวน์โหลดนานพอ (5-8 วิ) แล้วคำนวณจาก total bytes / total time
// ไม่ใช้ parallel chunk เล็กๆ เพราะ overhead ต่อ request มีผลมาก
async function measureDownload(): Promise<number> {
  const mobile   = isMobile()
  const STREAMS  = mobile ? 2 : 4
  const SIZE     = mobile ? 10_000_000 : 25_000_000 // 10MB หรือ 25MB ต่อ stream
  const TIMEOUT  = 15000

  // warm-up request เล็กๆ ก่อน เพื่อ establish connection
  try {
    await fetch(`https://speed.cloudflare.com/__down?bytes=100000&r=warmup_${Date.now()}`, {
      cache: 'no-store', signal: abortAfter(3000).signal
    })
  } catch { /* ไม่เป็นไร */ }

  const globalStart = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, i) => {
      try {
        const ctrl = abortAfter(TIMEOUT)
        const url  = `https://speed.cloudflare.com/__down?bytes=${SIZE}&r=${i}_${Date.now()}`
        const res  = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
        const buf  = await res.arrayBuffer()
        totalBytes += buf.byteLength
      } catch { /* stream failed */ }
    })
  )

  const elapsed = (performance.now() - globalStart) / 1000
  if (totalBytes === 0 || elapsed < 0.5) throw new Error('Download failed')

  // Mbps = bits / seconds / 1_000_000
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ───
// หลักการ: ส่งหลาย chunk ต่อเนื่อง แล้ววัด throughput รวม
// วัดเวลาแบบ "sliding window" — เริ่มจับเวลาหลัง connection ขึ้นแล้ว
async function measureUpload(): Promise<number> {
  const mobile   = isMobile()
  const STREAMS  = mobile ? 2 : 3
  const CHUNK    = mobile ? 3_000_000 : 8_000_000 // 3MB หรือ 8MB
  const TIMEOUT  = 20000

  // สร้าง payload ที่ไม่ compress ได้ (random-ish)
  const payload = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) payload[i] = (Math.imul(i, 1664525) + 1013904223) & 0xFF

  // warm-up เล็กๆ
  try {
    const warm = new Uint8Array(50_000)
    await fetch('/api/speedtest-proxy', {
      method: 'POST', body: warm,
      headers: { 'Content-Type': 'application/octet-stream' },
      cache: 'no-store', signal: abortAfter(4000).signal
    })
  } catch { /* ไม่เป็นไร */ }

  const globalStart = performance.now()
  let totalBytes = 0

  await Promise.allSettled(
    Array.from({ length: STREAMS }, async () => {
      try {
        const ctrl = abortAfter(TIMEOUT)
        // ส่ง 3 chunks ต่อเนื่องต่อ stream เพื่อให้เวลาวัดยาวพอ
        for (let r = 0; r < 3; r++) {
          if (ctrl.signal.aborted) break
          const res = await fetch('/api/speedtest-proxy', {
            method: 'POST',
            body: payload.slice(), // slice ป้องกัน detached
            headers: { 'Content-Type': 'application/octet-stream' },
            cache: 'no-store',
            signal: ctrl.signal
          })
          if (res.ok) totalBytes += CHUNK
        }
      } catch { /* stream failed */ }
    })
  )

  const elapsed = (performance.now() - globalStart) / 1000
  if (totalBytes === 0 || elapsed < 0.5) throw new Error('Upload failed')

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
