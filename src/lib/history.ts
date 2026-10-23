import { locLabel } from '@/lib/hotels'

// รายงาน 1 ฉบับตามที่ GET /api/reports ส่งกลับมา
export interface Report {
  id:string; createdAt:string; reportText:string|null; submittedBy:string|null
  tempIn:number|null; tempOut:number|null; humidity:number|null; serverRoomRemark:string|null
  networkTests:{location:string;downloadMbps:number|null;uploadMbps:number|null;remark:string|null}[]
  upsChecks:{building:string;backupMin:number|null;tempC:number|null;remark:string|null}[]
  roomChecks:{roomNumber:string;tvOk:boolean;telOk:boolean;internetDown:number|null;internetUp:number|null;remark:string|null}[]
}

// รายงานที่ส่งก่อนมีการเก็บข้อความ: สร้างข้อความจากข้อมูลที่บันทึกไว้แทน
export function fallbackText(r:Report){
  const v=(x:number|null)=>x??'—'
  const L:string[]=[]
  const nets=r.networkTests.filter(n=>n.downloadMbps!=null||n.uploadMbps!=null)
  if(nets.length){L.push('🌐 Network');nets.forEach(n=>L.push(`• ${locLabel(n.location)} : ↓${v(n.downloadMbps)} / ↑${v(n.uploadMbps)} Mbps${n.remark?`  (${n.remark})`:''}`));L.push('')}
  r.roomChecks.filter(x=>x.roomNumber).forEach(x=>{L.push(`🚪 Room ${x.roomNumber}`,`• TV : ${x.tvOk?'OK':'NG'}`,`• Tel : ${x.telOk?'OK':'NG'}`);if(x.internetDown!=null||x.internetUp!=null)L.push(`• Internet : ↓${v(x.internetDown)} / ↑${v(x.internetUp)} Mbps`);if(x.remark)L.push(`• Remark : ${x.remark}`);L.push('')})
  const ups=r.upsChecks.filter(u=>u.backupMin!=null||u.tempC!=null)
  if(ups.length){L.push('🔋 UPS');ups.forEach(u=>{L.push(`• ${u.building} : Backup ${v(u.backupMin)} min`);if(u.tempC!=null)L.push(`  Temp : ${u.tempC}°C`);if(u.remark)L.push(`  Remark : ${u.remark}`)});L.push('')}
  if(r.tempIn!=null||r.tempOut!=null||r.humidity!=null){L.push('🖥️ Server Room');if(r.tempIn!=null)L.push(`• Temp In : ${r.tempIn}°C`);if(r.tempOut!=null)L.push(`• Temp Out : ${r.tempOut}°C`);if(r.humidity!=null)L.push(`• Humidity : ${r.humidity}%`);if(r.serverRoomRemark)L.push(`• Remark : ${r.serverRoomRemark}`)}
  return L.join('\n').trim()||'(ไม่มีข้อมูล)'
}
