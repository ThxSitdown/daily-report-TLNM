// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { networkTests, serverRoom, upsChecks, roomChecks } = body

    const report = await prisma.dailyReport.create({
      data: {
        tempIn: serverRoom?.tempIn ? parseFloat(serverRoom.tempIn) : null,
        tempOut: serverRoom?.tempOut ? parseFloat(serverRoom.tempOut) : null,
        humidity: serverRoom?.humidity ? parseFloat(serverRoom.humidity) : null,
        serverRoomRemark: serverRoom?.remark || null,
        networkTests: {
          create: networkTests?.map((nt: any) => ({
            location: nt.location,
            downloadMbps: nt.download ? parseFloat(nt.download) : null,
            uploadMbps: nt.upload ? parseFloat(nt.upload) : null,
            remark: nt.remark || null
          })) || []
        },
        upsChecks: {
          create: upsChecks?.map((u: any) => ({
            building: u.building,
            backupMin: u.backupMin ? parseInt(u.backupMin) : null,
            tempC: u.tempC ? parseFloat(u.tempC) : null,
            remark: u.remark || null
          })) || []
        },
        roomChecks: {
          create: roomChecks?.map((r: any) => ({
            roomNumber: r.roomNumber,
            tvOk: r.tvOk === true,
            telOk: r.telOk === true,
            internetDown: r.internetDown ? parseFloat(r.internetDown) : null,
            internetUp: r.internetUp ? parseFloat(r.internetUp) : null,
            remark: r.remark || null
          })) || []
        }
      },
      include: {
        networkTests: true,
        upsChecks: true,
        roomChecks: true
      }
    })

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error) {
    console.error('Save report error:', error)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const reports = await prisma.dailyReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        networkTests: true,
        upsChecks: true,
        roomChecks: true
      }
    })
    return NextResponse.json(reports)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
