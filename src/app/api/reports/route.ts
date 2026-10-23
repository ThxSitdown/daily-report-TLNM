import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isAutoMeasured, routeWarning } from '@/lib/speedtest'

// เก็บผลวัดพร้อม flag auto = ตัวเลขที่ส่งมายังตรงกับผลวัดจริงไหม, warning = วัดผ่าน Private Relay/VPN หรือ server ต่างประเทศ
const speedMeta = (down: any, up: any, meta: any) => meta ? { ...meta, auto: isAutoMeasured(String(down ?? ''), String(up ?? ''), meta), warning: routeWarning(meta)?.short ?? null } : undefined

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
        networkTests: { create: (networkTests||[]).map((n:any) => ({ location:n.location, downloadMbps:n.download?parseFloat(n.download):null, uploadMbps:n.upload?parseFloat(n.upload):null, remark:n.remark||null, speedMeta:speedMeta(n.download,n.upload,n.meta) })) },
        upsChecks: { create: (upsChecks||[]).map((u:any) => ({ building:u.building, backupMin:u.backupMin?parseInt(u.backupMin):null, tempC:u.tempC?parseFloat(u.tempC):null, remark:u.remark||null })) },
        roomChecks: { create: (roomChecks||[]).map((r:any) => ({ roomNumber:r.roomNumber, tvOk:r.tvOk===true, telOk:r.telOk===true, internetDown:r.internetDown?parseFloat(r.internetDown):null, internetUp:r.internetUp?parseFloat(r.internetUp):null, remark:r.remark||null, speedMeta:speedMeta(r.internetDown,r.internetUp,r.internetMeta) })) }
      }
    })
    return NextResponse.json({ success: true, reportId: report.id })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

// ประวัติรายงานของโรงแรม ใหม่สุดก่อน: GET /api/reports?hotelType=travelodge&cursor=<id ตัวสุดท้าย>
export async function GET(req: NextRequest) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const hotelType = q.get('hotelType') || 'travelodge'
  const cursor = q.get('cursor')
  const take = Math.min(Math.max(parseInt(q.get('take') || '20') || 20, 1), 50)
  try {
    const rows = await prisma.dailyReport.findMany({
      where: { hotelType },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { networkTests: true, upsChecks: true, roomChecks: true },
    })
    const more = rows.length > take
    const reports = more ? rows.slice(0, take) : rows
    return NextResponse.json({ reports, nextCursor: more ? reports[reports.length - 1].id : null })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
