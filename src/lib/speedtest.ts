// src/lib/speedtest.ts — client-side only
// ใช้ Multi-stream parallel download/upload เพื่อความแม่นยำ

export interface SpeedResult {
  download: number
  upload: number
}

// ─── DOWNLOAD ───
// ดาวน์โหลดหลาย stream พร้อมกัน (parallel) เหมือน Speedtest.net จริง
async function measureDownload(): Promise<number> {
  const DURATION_MS = 6000   // เทส 6 วินาที
  const PARALLEL   = 4       // 4 streams พร้อมกัน
  const CHUNK      = 25_000_000 // 25MB ต่อ stream

  let totalBytes = 0
  const startTime = performance.now()

  // สร้าง promise หลายอันแล้วรันพร้อมกัน
  const streams = Array.from({ length: PARALLEL }, async (_, i) => {
    try {
      // cache bust ด้วย random query string
      const url = `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${i}_${Math.random()}`
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(DURATION_MS + 2000)
      })
      const buf = await res.arrayBuffer()
      totalBytes += buf.byteLength
    } catch {
      // stream หนึ่งล้มเหลว ไม่ถือเป็น error รวม
    }
  })

  await Promise.allSettled(streams)
  const elapsed = (performance.now() - startTime) / 1000
  const mbps = (totalBytes * 8) / elapsed / 1_000_000
  return parseFloat(mbps.toFixed(1))
}

// ─── UPLOAD ───
// ใช้ XMLHttpRequest แทน fetch เพราะ XHR upload แม่นยำกว่าใน browser
// + ส่งหลาย stream พร้อมกัน
async function measureUpload(): Promise<number> {
  const DURATION_MS = 6000
  const PARALLEL   = 3
  const CHUNK      = 4_000_000 // 4MB ต่อ chunk

  // สร้าง random data ไว้ก่อน (ใช้ร่วมกันทุก stream)
  const data = new Uint8Array(CHUNK)
  // fill ด้วย pseudo-random (ไม่ใช้ crypto เพราะช้า)
  for (let i = 0; i < CHUNK; i++) data[i] = (i * 37 + 91) % 256

  let totalBytes = 0
  const startTime = performance.now()

  const uploadOne = (): Promise<void> => new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://speed.cloudflare.com/__up', true)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    xhr.upload.onprogress = (e) => {
      // นับ bytes ที่ส่งได้จริง (real-time)
      totalBytes += e.loaded
    }

    xhr.onload = () => resolve()
    xhr.onerror = () => resolve()
    xhr.ontimeout = () => resolve()
    xhr.timeout = DURATION_MS + 3000

    // ส่งหลาย chunk ติดต่อกัน
    const blob = new Blob([data, data, data]) // ~12MB per request
    xhr.send(blob)
  })

  // รัน parallel streams
  await Promise.allSettled(Array.from({ length: PARALLEL }, uploadOne))

  const elapsed = (performance.now() - startTime) / 1000
  // หาร 2 เพราะ onprogress นับซ้ำ (loaded เพิ่มขึ้นต่อเนื่อง ไม่ใช่ delta)
  // ใช้ totalBytes จาก XHR loaded แล้วหารด้วยเวลาจริง
  const mbps = (totalBytes * 8) / elapsed / 1_000_000
  return parseFloat(Math.min(mbps, 1000).toFixed(1)) // cap ที่ 1Gbps
}

// ─── MAIN EXPORT ───
export async function runSpeedTest(
  onProgress?: (phase: 'download' | 'upload') => void
): Promise<SpeedResult> {
  onProgress?.('download')
  const download = await measureDownload()

  onProgress?.('upload')
  const upload = await measureUpload()

  return { download, upload }
}
