// src/lib/speedtest.ts — mobile-safe client-side speed test

export interface SpeedResult {
  download: number
  upload: number
}

// AbortController timeout — รองรับ iOS Safari (ไม่ใช้ AbortSignal.timeout)
function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), ms)
  return ctrl.signal
}

// ─── DOWNLOAD ───
// มือถือ: ลด parallel และขนาด chunk ให้เล็กลง
async function measureDownload(): Promise<number> {
  // ตรวจว่าเป็น mobile หรือเปล่า
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const PARALLEL = isMobile ? 2 : 4
  const CHUNK    = isMobile ? 5_000_000 : 20_000_000 // 5MB หรือ 20MB

  const results: number[] = []

  // รัน sequential rounds แทน parallel เดียวทั้งหมด (เสถียรกว่าบน mobile)
  for (let round = 0; round < 2; round++) {
    let roundBytes = 0
    const roundStart = performance.now()

    await Promise.allSettled(
      Array.from({ length: PARALLEL }, async (_, i) => {
        try {
          const url = `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${round}_${i}_${Date.now()}`
          const res = await fetch(url, {
            cache: 'no-store',
            signal: timeoutSignal(12000),
          })
          const buf = await res.arrayBuffer()
          roundBytes += buf.byteLength
        } catch { /* ข้าม */ }
      })
    )

    const elapsed = (performance.now() - roundStart) / 1000
    if (elapsed > 0.5 && roundBytes > 0) {
      results.push((roundBytes * 8) / elapsed / 1_000_000)
    }
  }

  if (results.length === 0) throw new Error('Download failed')

  // เฉลี่ยทุก round
  const avg = results.reduce((a, b) => a + b, 0) / results.length
  return parseFloat(avg.toFixed(1))
}

// ─── UPLOAD ───
// ใช้ fetch แทน XHR — รองรับดีกว่าบน iOS
// ส่งผ่าน proxy /api/speedtest-proxy เพื่อแก้ CORS
async function measureUpload(): Promise<number> {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const PARALLEL = isMobile ? 2 : 3
  const CHUNK    = isMobile ? 2_000_000 : 6_000_000 // 2MB หรือ 6MB

  // สร้าง data ครั้งเดียว reuse
  const data = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) data[i] = (i * 37 ^ 0xA5) & 0xFF

  const results: number[] = []

  for (let round = 0; round < 2; round++) {
    let roundBytes = 0
    const roundStart = performance.now()

    await Promise.allSettled(
      Array.from({ length: PARALLEL }, async () => {
        try {
          const t0 = performance.now()
          const res = await fetch('/api/speedtest-proxy', {
            method: 'POST',
            body: data.slice(), // slice เพื่อป้องกัน detached buffer
            headers: { 'Content-Type': 'application/octet-stream' },
            cache: 'no-store',
            signal: timeoutSignal(15000),
          })
          if (res.ok || res.status === 200) {
            const took = performance.now() - t0
            if (took > 200) roundBytes += CHUNK
          }
        } catch { /* ข้าม */ }
      })
    )

    const elapsed = (performance.now() - roundStart) / 1000
    if (elapsed > 0.5 && roundBytes > 0) {
      results.push((roundBytes * 8) / elapsed / 1_000_000)
    }
  }

  if (results.length === 0) throw new Error('Upload failed')

  const avg = results.reduce((a, b) => a + b, 0) / results.length
  return parseFloat(avg.toFixed(1))
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
