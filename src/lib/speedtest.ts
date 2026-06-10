// src/lib/speedtest.ts
// Time-based measurement + Streaming Reader = แม่นยำเหมือน Speedtest.net

export interface SpeedResult {
  download: number
  upload: number
}

const IS_MOBILE = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

function abortAfter(ms: number): AbortController {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), ms)
  return ctrl
}

// ─── DOWNLOAD ───
// วิธี: เปิดหลาย stream พร้อมกัน นับ bytes ขณะ stream ไหลเข้า
// หยุดหลัง DURATION ms แล้วคำนวณ bytes / time
async function measureDownload(): Promise<number> {
  const mobile   = IS_MOBILE()
  const STREAMS  = mobile ? 3 : 6       // parallel streams
  const DURATION = mobile ? 7000 : 8000 // วัดนานแค่ไหน (ms)
  const CHUNK    = 100_000_000          // ขอ 100MB แต่จะถูก abort ก่อน

  let totalBytes = 0
  const globalCtrl = abortAfter(DURATION + 1000) // kill ทุกอย่างหลัง timeout

  // warm-up
  try {
    await fetch(`https://speed.cloudflare.com/__down?bytes=200000&r=wu${Date.now()}`, {
      cache: 'no-store', signal: abortAfter(3000).signal
    })
  } catch { /* ok */ }

  const start = performance.now()

  // ฟังก์ชัน stream หนึ่งอัน: อ่าน chunk-by-chunk นับ bytes สะสม
  const streamOne = async (idx: number) => {
    const ctrl = abortAfter(DURATION)
    try {
      const res = await fetch(
        `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${idx}_${Date.now()}`,
        { cache: 'no-store', signal: ctrl.signal }
      )
      if (!res.body) return
      const reader = res.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done || ctrl.signal.aborted || globalCtrl.signal.aborted) break
        totalBytes += value?.byteLength ?? 0
      }
    } catch { /* stream ended by abort = ปกติ */ }
  }

  await Promise.allSettled(Array.from({ length: STREAMS }, (_, i) => streamOne(i)))

  const elapsed = (performance.now() - start) / 1000
  if (!totalBytes || elapsed < 1) throw new Error('Download failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

// ─── UPLOAD ───
// chunk ≤ 3.5MB (Vercel limit 4.5MB)
// ส่งหลาย request ต่อเนื่อง วัด throughput รวม
async function measureUpload(): Promise<number> {
  const mobile   = IS_MOBILE()
  const STREAMS  = mobile ? 2 : 3
  const CHUNK    = 3_500_000  // 3.5MB — ใต้ Vercel 4.5MB limit
  const DURATION = mobile ? 8000 : 10000

  const payload = new Uint8Array(CHUNK)
  // fill ด้วยค่า random-ish ที่ไม่ compress ได้
  for (let i = 0; i < CHUNK; i++) payload[i] = (Math.imul(i, 1664525) + 1013904223) & 0xFF

  // warm-up
  try {
    await fetch('/api/speedtest-proxy', {
      method: 'POST', body: new Uint8Array(100_000),
      headers: { 'Content-Type': 'application/octet-stream' },
      cache: 'no-store', signal: abortAfter(4000).signal
    })
  } catch { /* ok */ }

  let totalBytes = 0
  const start = performance.now()

  const uploadStream = async () => {
    const deadline = Date.now() + DURATION
    while (Date.now() < deadline) {
      try {
        const res = await fetch('/api/speedtest-proxy', {
          method: 'POST',
          body: payload.slice(),
          headers: { 'Content-Type': 'application/octet-stream' },
          cache: 'no-store',
          signal: abortAfter(8000).signal
        })
        if (res.ok) totalBytes += CHUNK
      } catch { break }
    }
  }

  await Promise.allSettled(Array.from({ length: STREAMS }, uploadStream))

  const elapsed = (performance.now() - start) / 1000
  if (!totalBytes || elapsed < 1) throw new Error('Upload failed')
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