// src/lib/speedtest-client.ts
// Runs entirely in the browser — measures real local network speed

export interface SpeedResult {
  download: number
  upload: number
}

async function measureDownload(): Promise<number> {
  // Use multiple Cloudflare test files and pick the best measurement
  const testSizes = [
    { url: 'https://speed.cloudflare.com/__down?bytes=10000000', bytes: 10_000_000 },
    { url: 'https://speed.cloudflare.com/__down?bytes=25000000', bytes: 25_000_000 },
  ]

  const results: number[] = []

  for (const test of testSizes) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)
      const start = performance.now()
      const res = await fetch(test.url + `&t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      const buf = await res.arrayBuffer()
      clearTimeout(timeout)
      const elapsed = (performance.now() - start) / 1000
      const mbps = (buf.byteLength * 8) / elapsed / 1_000_000
      results.push(mbps)
    } catch {
      // skip failed test
    }
  }

  if (results.length === 0) throw new Error('Download test failed')
  // Return median-ish value
  results.sort((a, b) => a - b)
  return parseFloat(results[Math.floor(results.length / 2)].toFixed(1))
}

async function measureUpload(): Promise<number> {
  const testSize = 5_000_000 // 5MB
  const data = new Uint8Array(testSize)
  crypto.getRandomValues(data)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const start = performance.now()
    await fetch(`https://speed.cloudflare.com/__up?t=${Date.now()}`, {
      method: 'POST',
      body: data,
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const elapsed = (performance.now() - start) / 1000
    const mbps = (testSize * 8) / elapsed / 1_000_000
    return parseFloat(mbps.toFixed(1))
  } catch {
    throw new Error('Upload test failed')
  }
}

export async function runSpeedTest(): Promise<SpeedResult> {
  const [download, upload] = await Promise.all([
    measureDownload(),
    measureUpload(),
  ])
  return { download, upload }
}
