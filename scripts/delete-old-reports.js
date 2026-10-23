// ลบรายงานเก่าที่ส่งก่อนมีปุ่ม "ยืนยันการส่ง" (reportText ว่าง) ออกจากฐานข้อมูลใน .env
// ไม่แตะร่างฟอร์ม (drafts) และรายงานที่กดยืนยันส่งแล้ว
//   node scripts/delete-old-reports.js        -> นับจำนวน + สำรองเป็นไฟล์ JSON (ยังไม่ลบ)
//   node scripts/delete-old-reports.js --yes  -> สำรองแล้วลบจริง
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const where = { reportText: null }

async function main() {
  const old = await prisma.dailyReport.findMany({ where, orderBy: { createdAt: 'asc' }, include: { networkTests: true, upsChecks: true, roomChecks: true } })
  const kept = await prisma.dailyReport.count({ where: { reportText: { not: null } } })
  console.log(`รายงานเก่าที่จะลบ: ${old.length} ฉบับ (${old[0]?.createdAt.toISOString() ?? '-'} ถึง ${old.at(-1)?.createdAt.toISOString() ?? '-'})`)
  console.log(`รายงานที่กดยืนยันส่ง (เก็บไว้): ${kept} ฉบับ`)
  if (!old.length) return

  const dir = path.join(__dirname, '..', 'backups')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `old-reports-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify(old, null, 2))
  console.log(`สำรองไว้ที่: ${file}`)

  if (!process.argv.includes('--yes')) { console.log('ยังไม่ได้ลบ ถ้าจะลบจริงให้รันซ้ำพร้อม --yes'); return }
  // networkTests / upsChecks / roomChecks ถูกลบตามอัตโนมัติ (onDelete: Cascade)
  const r = await prisma.dailyReport.deleteMany({ where })
  console.log(`ลบแล้ว ${r.count} ฉบับ`)
}

main().catch(e => { console.error(e.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
