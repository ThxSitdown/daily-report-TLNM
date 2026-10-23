// ผลการวัด 1 ครั้ง เก็บไว้คู่กับตัวเลขในฟอร์ม เพื่อพิสูจน์ว่าค่ามาจากการวัดจริง
export interface SpeedMeta {
  at: string       // เวลาที่วัด (ISO)
  download: number
  upload: number
  ping: number     // ms
  jitter: number   // ms
  server: string   // เช่น 'Cloudflare Bangkok'
  isp: string      // ค่ายเน็ตจาก ASN เช่น 'Advanced Wireless Network'
  asn?: number
}
export type SpeedPhase = 'ping' | 'download' | 'upload'

// วัดกับ Cloudflare โดยตรง (ทั้ง DL/UL รองรับ CORS, ไทยจะวิ่งไป colo BKK)
const CF = 'https://speed.cloudflare.com'
const DURATION_MS = 10000 // เวลาวัดต่อเฟส
const WARMUP_MS = 2000    // ตัดช่วง TCP slow-start ทิ้ง
const TICK_MS = 200
const WINDOW_TICKS = 5    // ความเร็วแต่ละ sample = ค่าเฉลี่ย 1 วินาที
const DL_STREAMS = 6
const DL_BYTES = 25_000_000
const UL_STREAMS = 4
const UL_BYTES = 8_000_000
const PING_COUNT = 10

type Worker = (add: (n: number) => void, signal: AbortSignal) => Promise<void>

// นับ byte แบบ real-time ทุก stream แล้วคิดเป็น Mbps ต่อช่วง 1 วินาที
// ผลลัพธ์ = trimmed mean (ตัด 30% ต่ำสุด และ 10% สูงสุด) แบบเดียวกับ Ookla
async function measure(streams: number, worker: Worker, onSpeed?: (mbps: number) => void): Promise<number> {
  const ctrl = new AbortController()
  let bytes = 0
  const add = (n: number) => { bytes += n }
  const t0 = performance.now()
  const samples = [{ t: 0, b: 0 }]
  const rate = (a: { t: number; b: number }, z: { t: number; b: number }) => ((z.b - a.b) * 8) / ((z.t - a.t) / 1000) / 1_000_000
  const tick = setInterval(() => {
    const z = { t: performance.now() - t0, b: bytes }
    samples.push(z)
    onSpeed?.(parseFloat(rate(samples[Math.max(0, samples.length - 1 - WINDOW_TICKS)], z).toFixed(1)))
  }, TICK_MS)
  const stop = setTimeout(() => ctrl.abort(), DURATION_MS)
  await Promise.allSettled(Array.from({ length: streams }, () => worker(add, ctrl.signal)))
  clearInterval(tick); clearTimeout(stop)
  samples.push({ t: performance.now() - t0, b: bytes })

  const speeds: number[] = []
  for (let i = WINDOW_TICKS; i < samples.length; i++) {
    const a = samples[i - WINDOW_TICKS], z = samples[i]
    if (a.t < WARMUP_MS || z.t <= a.t) continue
    speeds.push(rate(a, z))
  }
  if (speeds.length < 3 || bytes < 100_000) throw new Error('measure failed')
  speeds.sort((x, y) => x - y)
  const kept = speeds.slice(Math.floor(speeds.length * 0.3), Math.ceil(speeds.length * 0.9))
  return parseFloat((kept.reduce((s, v) => s + v, 0) / kept.length).toFixed(1))
}

// เวลาที่ Cloudflare ใช้ประมวลผลฝั่ง server (header server-timing) ต้องหักออกจาก ping
function serverMs(header: string | null) {
  return Array.from((header || '').matchAll(/;dur=([\d.]+)/g)).reduce((s, m) => s + parseFloat(m[1]), 0)
}

// ping = median ของ round-trip request เปล่า, jitter = ค่าเฉลี่ยของผลต่าง ping ที่ติดกัน
async function measurePing(): Promise<{ ping: number; jitter: number }> {
  const rtts: number[] = []
  for (let i = 0; i <= PING_COUNT; i++) {
    const t = performance.now()
    const res = await fetch(`${CF}/__down?bytes=0&r=${Math.random()}`, { cache: 'no-store' })
    await res.arrayBuffer()
    const rtt = performance.now() - t - serverMs(res.headers.get('server-timing'))
    if (i > 0) rtts.push(Math.max(rtt, 0)) // ครั้งแรกรวมเวลาเปิด connection ทิ้งไป
  }
  const jitter = rtts.slice(1).reduce((s, v, i) => s + Math.abs(v - rtts[i]), 0) / (rtts.length - 1)
  const sorted = [...rtts].sort((a, b) => a - b)
  return { ping: Math.round(sorted[Math.floor(sorted.length / 2)]), jitter: Math.round(jitter) }
}

// 'ADVANCED WIRELESS NETWORK COMPANY LIMITED' -> 'Advanced Wireless Network'
function cleanIsp(name: string) {
  return name
    .replace(/[,.]?\s*(public\s+)?(company|co\.?)\s*,?\s*(limited|ltd\.?)\.?$/i, '')
    .replace(/[,.]?\s+(pcl|plc|ltd\.?|limited|inc\.?)$/i, '')
    .trim()
    .split(/\s+/)
    .map(w => (w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

async function fetchServerInfo(): Promise<Pick<SpeedMeta, 'server' | 'isp' | 'asn'>> {
  try {
    const m = await fetch(`${CF}/meta`, { cache: 'no-store' }).then(r => r.json())
    return {
      server: `Cloudflare ${m.colo?.city || m.colo?.iata || ''}`.trim(),
      isp: m.asOrganization ? cleanIsp(m.asOrganization) : '',
      asn: m.asn,
    }
  } catch { return { server: 'Cloudflare', isp: '' } }
}

const downloadWorker: Worker = async (add, signal) => {
  while (!signal.aborted) {
    try {
      const res = await fetch(`${CF}/__down?bytes=${DL_BYTES}&r=${Math.random()}`, { cache: 'no-store', signal })
      if (!res.ok || !res.body) return
      const reader = res.body.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        add(value.byteLength)
      }
    } catch { return }
  }
}

function uploadOnce(body: Blob, add: (n: number) => void, signal: AbortSignal): Promise<boolean> {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest()
    const onAbort = () => xhr.abort()
    let sent = 0
    xhr.upload.onprogress = e => { add(e.loaded - sent); sent = e.loaded }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
    xhr.onerror = xhr.onabort = xhr.ontimeout = () => resolve(false)
    xhr.onloadend = () => signal.removeEventListener('abort', onAbort)
    signal.addEventListener('abort', onAbort)
    xhr.open('POST', `${CF}/__up?r=${Math.random()}`)
    xhr.send(body)
  })
}

function randomBlob(size: number) {
  const buf = new Uint8Array(size)
  for (let i = 0; i < size; i += 65536) crypto.getRandomValues(buf.subarray(i, i + 65536))
  return new Blob([buf])
}

export async function runSpeedTest(onProgress?: (phase: SpeedPhase, mbps?: number) => void): Promise<SpeedMeta> {
  onProgress?.('ping')
  const [info, { ping, jitter }] = await Promise.all([fetchServerInfo(), measurePing()])
  onProgress?.('download')
  const download = await measure(DL_STREAMS, downloadWorker, v => onProgress?.('download', v))
  onProgress?.('upload')
  const body = randomBlob(UL_BYTES)
  const upload = await measure(UL_STREAMS, async (add, signal) => {
    while (!signal.aborted && await uploadOnce(body, add, signal)) { /* ส่งต่อจนหมดเวลา */ }
  }, v => onProgress?.('upload', v))
  return { at: new Date().toISOString(), download, upload, ping, jitter, ...info }
}

// ค่าในฟอร์มนับว่า "วัดอัตโนมัติ" ก็ต่อเมื่อยังตรงกับผลวัด ถ้าแก้ตัวเลขเองจะกลายเป็น "กรอกเอง"
export function isAutoMeasured(download: string, upload: string, meta?: SpeedMeta | null) {
  return !!meta && parseFloat(download) === meta.download && parseFloat(upload) === meta.upload
}

export function measuredTime(meta: SpeedMeta) {
  const d = new Date(meta.at)
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  const today = d.toDateString() === new Date().toDateString()
  return { today, label: today ? time : `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric' })} ${time}` }
}

// ส่วนท้ายบรรทัดในข้อความรายงาน เช่น ' · ping 25 ms ✓14:32' หรือ ' ✎'
export function reportTag(download: string, upload: string, meta?: SpeedMeta | null) {
  if (!download && !upload) return ''
  if (!meta || !isAutoMeasured(download, upload, meta)) return ' ✎'
  return ` · ping ${meta.ping} ms ✓${measuredTime(meta).label}`
}

export type SpeedItem = [download: string, upload: string, meta: SpeedMeta | null | undefined]

// คำอธิบายท้ายรายงาน: สัญลักษณ์ + server/ค่ายเน็ตที่ใช้วัดของทุกจุด
export function reportLegend(items: SpeedItem[]) {
  if (!items.some(([d, u]) => d || u)) return []
  const auto = items.filter(([d, u, m]) => isAutoMeasured(d, u, m)).map(([, , m]) => m as SpeedMeta)
  const sources = Array.from(new Set(auto.map(m => [m.server, m.isp].filter(Boolean).join(' · '))))
  return [
    'ℹ️ ✓ = วัดอัตโนมัติด้วยระบบ (เวลาที่วัด) · ✎ = กรอกเอง',
    ...sources.map(s => `   วัดกับ ${s}`),
  ]
}
