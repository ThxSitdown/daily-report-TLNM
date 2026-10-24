import { locLabel } from '@/lib/hotels'
import type { SpeedMeta } from '@/lib/speedtest'

// speedMeta ที่เก็บใน DB: ผลวัด + auto/warning ที่ server คำนวณ
export type StoredMeta = Partial<SpeedMeta> & { auto?: boolean; warning?: string | null }

// รายงาน 1 ฉบับตามที่ GET /api/reports ส่งกลับมา (เฉพาะที่กดยืนยันส่ง จึงมี reportText เสมอ)
export interface Report {
  id:string; createdAt:string; reportText:string; submittedBy:string|null
  networkTests:{location:string;downloadMbps:number|null;uploadMbps:number|null;speedMeta:StoredMeta|null}[]
  roomChecks:{roomNumber:string;internetDown:number|null;internetUp:number|null;speedMeta:StoredMeta|null}[]
}

export interface TestRow { label:string; down:number|null; up:number|null; meta:StoredMeta|null }

// ทุกจุดที่วัดเน็ตในรายงาน (จุดในโรงแรม + ห้องพัก) สำหรับแสดงรายละเอียดในหน้าประวัติ
export function testRows(r:Report):TestRow[] {
  const has = (d:number|null, u:number|null, m:StoredMeta|null) => d != null || u != null || !!m
  return [
    ...r.networkTests.filter(n => has(n.downloadMbps, n.uploadMbps, n.speedMeta)).map(n => ({ label: locLabel(n.location), down: n.downloadMbps, up: n.uploadMbps, meta: n.speedMeta })),
    ...r.roomChecks.filter(x => x.roomNumber && has(x.internetDown, x.internetUp, x.speedMeta)).map(x => ({ label: `ห้อง ${x.roomNumber}`, down: x.internetDown, up: x.internetUp, meta: x.speedMeta })),
  ]
}

// ช่วงเวลาสำหรับกรองประวัติ (ตามเวลาในเครื่อง, สัปดาห์เริ่มวันจันทร์)
export type RangeMode = 'day' | 'week' | 'month' | 'all'
export interface Range { from:Date; to:Date }

export function dateRange(mode:RangeMode, anchor:Date):Range|null {
  const y = anchor.getFullYear(), m = anchor.getMonth(), d = anchor.getDate()
  if (mode === 'day') return { from: new Date(y, m, d), to: new Date(y, m, d + 1) }
  if (mode === 'week') { const s = d - (anchor.getDay() + 6) % 7; return { from: new Date(y, m, s), to: new Date(y, m, s + 7) } }
  if (mode === 'month') return { from: new Date(y, m, 1), to: new Date(y, m + 1, 1) }
  return null
}

export function shiftAnchor(mode:RangeMode, anchor:Date, dir:1|-1):Date {
  const y = anchor.getFullYear(), m = anchor.getMonth(), d = anchor.getDate()
  if (mode === 'day') return new Date(y, m, d + dir)
  if (mode === 'week') return new Date(y, m, d + 7 * dir)
  if (mode === 'month') return new Date(y, m + dir, Math.min(d, new Date(y, m + dir + 1, 0).getDate())) // คงวันที่เดิมไว้ (31 → 30 ถ้าเดือนนั้นสั้นกว่า)
  return anchor
}

export function rangeLabel(mode:RangeMode, r:Range):string {
  const th = (d:Date, o:Intl.DateTimeFormatOptions) => d.toLocaleDateString('th-TH', o)
  if (mode === 'day') return th(r.from, { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  if (mode === 'week') { const last = new Date(r.to.getFullYear(), r.to.getMonth(), r.to.getDate() - 1); return `${th(r.from, { day:'numeric', month:'short' })} – ${th(last, { day:'numeric', month:'short', year:'numeric' })}` }
  return th(r.from, { month:'long', year:'numeric' })
}
