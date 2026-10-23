import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { storedMeta as speedMeta } from '@/lib/speedtest'

export async function POST(req: NextRequest) {
  const s = getSession(req)
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { hotelType, reportText, networkTests, serverRoom, upsChecks, roomChecks } = await req.json()
    const report = await prisma.dailyReport.create({
      data: {
        hotelType: hotelType || 'travelodge',
        reportText: typeof reportText === 'string' ? reportText.slice(0, 20000) : null,
        submittedBy: s.username,
        tempIn: serverRoom?.tempIn ? parseFloat(serverRoom.tempIn) : null,
        tempOut: serverRoom?.tempOut ? parseFloat(serverRoom.tempOut) : null,
        humidity: serverRoom?.humidity ? parseFloat(serverRoom.humidity) : null,
        serverRoomRemark: serverRoom?.remark || null,
        networkTests: { create: (networkTests||[]).map((n:any) => ({ location:n.location, downloadMbps:n.download?parseFloat(n.download):null, uploadMbps:n.upload?parseFloat(n.upload):null, remark:n.remark||null, speedMeta:speedMeta(n.download,n.upload,n.meta,n.ap) })) },
        upsChecks: { create: (upsChecks||[]).map((u:any) => ({ building:u.building, backupMin:u.backupMin?parseInt(u.backupMin):null, tempC:u.tempC?parseFloat(u.tempC):null, remark:u.remark||null })) },
        roomChecks: { create: (roomChecks||[]).map((r:any) => ({ roomNumber:r.roomNumber, tvOk:r.tvOk===true, telOk:r.telOk===true, internetDown:r.internetDown?parseFloat(r.internetDown):null, internetUp:r.internetUp?parseFloat(r.internetUp):null, remark:r.remark||null, speedMeta:speedMeta(r.internetDown,r.internetUp,r.internetMeta,r.internetAp) })) }
      }
    })
    return NextResponse.json({ success: true, reportId: report.id })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

// ประวัติรายงานที่กดยืนยันส่งแล้ว ใหม่สุดก่อน: GET /api/reports?hotelType=travelodge&from=<ISO>&to=<ISO>&cursor=<id ตัวสุดท้าย>
export async function GET(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const hotelType = q.get('hotelType') || 'travelodge'
  const cursor = q.get('cursor')
  const take = Math.min(Math.max(parseInt(q.get('take') || '20') || 20, 1), 50)
  const date = (k: string) => { const d = new Date(q.get(k) || ''); return isNaN(d.getTime()) ? undefined : d }
  const from = date('from'), to = date('to')
  const where = {
    hotelType,
    reportText: { not: null },
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
  }
  try {
    const [rows, total] = await Promise.all([prisma.dailyReport.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { networkTests: true, upsChecks: true, roomChecks: true },
    }), prisma.dailyReport.count({ where })])
    const more = rows.length > take
    const reports = more ? rows.slice(0, take) : rows
    return NextResponse.json({ reports, total, nextCursor: more ? reports[reports.length - 1].id : null })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
