import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { hotelType, networkTests, serverRoom, upsChecks, roomChecks } = await req.json()
    const report = await prisma.dailyReport.create({
      data: {
        hotelType: hotelType || 'travelodge',
        tempIn: serverRoom?.tempIn ? parseFloat(serverRoom.tempIn) : null,
        tempOut: serverRoom?.tempOut ? parseFloat(serverRoom.tempOut) : null,
        humidity: serverRoom?.humidity ? parseFloat(serverRoom.humidity) : null,
        serverRoomRemark: serverRoom?.remark || null,
        networkTests: { create: (networkTests||[]).map((n:any) => ({ location:n.location, downloadMbps:n.download?parseFloat(n.download):null, uploadMbps:n.upload?parseFloat(n.upload):null, remark:n.remark||null })) },
        upsChecks: { create: (upsChecks||[]).map((u:any) => ({ building:u.building, backupMin:u.backupMin?parseInt(u.backupMin):null, tempC:u.tempC?parseFloat(u.tempC):null, remark:u.remark||null })) },
        roomChecks: { create: (roomChecks||[]).map((r:any) => ({ roomNumber:r.roomNumber, tvOk:r.tvOk===true, telOk:r.telOk===true, internetDown:r.internetDown?parseFloat(r.internetDown):null, internetUp:r.internetUp?parseFloat(r.internetUp):null, remark:r.remark||null })) }
      }
    })
    return NextResponse.json({ success: true, reportId: report.id })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
export async function GET() {
  const reports = await prisma.dailyReport.findMany({ orderBy:{createdAt:'desc'}, take:10, include:{networkTests:true,upsChecks:true,roomChecks:true} })
  return NextResponse.json(reports)
}
