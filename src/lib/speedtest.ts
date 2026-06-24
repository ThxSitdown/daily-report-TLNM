export interface SpeedResult { download: number; upload: number }

function isMobile() { return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) }
function abortAfter(ms: number) { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c }

async function measureDownload(): Promise<number> {
  const mobile = isMobile()
  const STREAMS = mobile ? 5 : 6
  const CHUNK = mobile ? 5_000_000 : 8_000_000
  const TOTAL = 15000
  const SKIP = 4000
  try {
    const r = await fetch(`https://speed.cloudflare.com/__down?bytes=1000000&r=wu${Date.now()}`, { cache:'no-store', signal:abortAfter(6000).signal })
    await r.arrayBuffer()
  } catch { /* ok */ }
  const t0 = performance.now()
  let stableT = -1, stableBytes = 0
  await Promise.allSettled(Array.from({ length: STREAMS }, async (_, si) => {
    let n = 0
    while (performance.now() - t0 < TOTAL) {
      const buf = await fetch(`https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=${si}_${n++}_${Date.now()}`, { cache:'no-store', signal:abortAfter(12000).signal })
        .then(r => r.arrayBuffer()).catch(() => null)
      if (!buf) break
      const now = performance.now()
      if (now - t0 >= SKIP) { if (stableT < 0) stableT = now; stableBytes += buf.byteLength }
    }
  }))
  const elapsed = stableT > 0 ? (performance.now() - stableT) / 1000 : (TOTAL - SKIP) / 1000
  if (stableBytes < 100_000 || elapsed < 0.5) throw new Error('DL failed')
  return parseFloat(((stableBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

async function measureUpload(): Promise<number> {
  const mobile = isMobile()
  const STREAMS = mobile ? 2 : 3
  const CHUNK = 1_000_000
  const MEASURE_MS = 6000
  const payload = new Uint8Array(CHUNK)
  for (let i = 0; i < CHUNK; i++) payload[i] = (i * 1664525 + 1013904223) & 0xFF
  try {
    await fetch('/api/speedtest-proxy', { method:'POST', body:new Uint8Array(100_000), headers:{'Content-Type':'application/octet-stream'}, cache:'no-store', signal:abortAfter(5000).signal })
  } catch { /* ok */ }
  const ctrl = abortAfter(MEASURE_MS)
  const start = performance.now()
  let totalBytes = 0
  await Promise.allSettled(Array.from({ length: STREAMS }, async () => {
    while (!ctrl.signal.aborted) {
      try {
        const res = await fetch('/api/speedtest-proxy', { method:'POST', body:payload.slice(), headers:{'Content-Type':'application/octet-stream'}, cache:'no-store', signal:ctrl.signal })
        if (res.ok) totalBytes += CHUNK
      } catch { break }
    }
  }))
  const elapsed = (performance.now() - start) / 1000
  if (!totalBytes || elapsed < 0.5) throw new Error('UL failed')
  return parseFloat(((totalBytes * 8) / elapsed / 1_000_000).toFixed(1))
}

export async function runSpeedTest(onProgress?: (phase: 'download' | 'upload') => void): Promise<SpeedResult> {
  onProgress?.('download')
  const download = await measureDownload()
  onProgress?.('upload')
  const upload = await measureUpload()
  return { download, upload }
}
