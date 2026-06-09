// src/lib/speedtest.ts
// ทำงานบน browser (client-side) เท่านั้น — วัดความเร็ว WiFi จริงของ device

export interface SpeedResult {
  download: number
  upload: number
}

// ดาวน์โหลดหลายขนาด แล้วเฉลี่ย เพื่อความแม่นยำ
async function measureDownload(): Promise<number> {
  // ทดสอบ 3 ขนาด แล้วเฉลี่ย
  const sizes = [5_000_000, 10_000_000, 25_000_000] // 5MB, 10MB, 25MB
  const results: number[] = []

  for (const bytes of sizes) {
    try {
      const start = performance.now()
      const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000)
      })
      const buf = await res.arrayBuffer()
      const elapsed = (performance.now() - start) / 1000 // seconds
      const mbps = (buf.byteLength * 8) / elapsed / 1_000_000
      results.push(mbps)
    } catch {
      // ถ้า timeout (เน็ตช้า) ข้ามไปขนาดถัดไป
      break
    }
  }

  if (results.length === 0) throw new Error('Download test failed')

  // ตัดค่าสูงสุดออก 1 ค่า (outlier) แล้วเฉลี่ยที่เหลือ
  const sorted = [...results].sort((a, b) => a - b)
  const trimmed = sorted.length > 1 ? sorted.slice(0, -1) : sorted
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  return parseFloat(avg.toFixed(1))
}

async function measureUpload(): Promise<number> {
  const sizes = [3_000_000, 5_000_000, 10_000_000] // 3MB, 5MB, 10MB
  const results: number[] = []

  for (const bytes of sizes) {
    try {
      // สร้าง random data สำหรับ upload (ป้องกัน compression skew)
      const data = new Uint8Array(bytes)
      crypto.getRandomValues(data.subarray(0, Math.min(bytes, 65536))) // random แค่ส่วนแรก
      // fill ส่วนที่เหลือด้วย pattern
      for (let i = 65536; i < bytes; i++) data[i] = i % 256

      const start = performance.now()
      await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        body: data,
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
        // duplex จำเป็นสำหรับ streaming upload บน Chrome
        // @ts-ignore
        duplex: 'half'
      })
      const elapsed = (performance.now() - start) / 1000
      const mbps = (bytes * 8) / elapsed / 1_000_000
      results.push(mbps)
    } catch {
      break
    }
  }

  if (results.length === 0) throw new Error('Upload test failed')

  const sorted = [...results].sort((a, b) => a - b)
  const trimmed = sorted.length > 1 ? sorted.slice(0, -1) : sorted
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  return parseFloat(avg.toFixed(1))
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
