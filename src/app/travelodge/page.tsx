'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useDraft } from '@/lib/useDraft'
import { AppHeader } from '@/components/AppHeader'
import { SpeedCard } from '@/components/SpeedCard'
import { RoomCard } from '@/components/RoomCard'
import { ReportPreview, ClearFormModal, SubmitBar } from '@/components/ReportFlow'
import { Field, Section, HotelHero, PageLoading, useToast } from '@/components/ui'
import { UPS_BUILDINGS, emptyRoom, type NetData as N, type UpsData as U, type RoomData as R, type ServerRoomData as S } from '@/lib/types'
import { TRAVELODGE_LOCS as LOCS, accentVars } from '@/lib/hotels'
import { reportTag } from '@/lib/speedtest'

interface D{nets:Record<string,N>;srv:S;ups:U[];rooms:R[]}

const def=():D=>({
  nets:Object.fromEntries(LOCS.map(l=>[l.key,{download:'',upload:'',remark:''}])),
  srv:{tempIn:'',tempOut:'',humidity:'',remark:''},
  ups:[{building:'T1',backupMin:'',tempC:'',remark:''}],
  rooms:[emptyRoom(),emptyRoom()]
})

// สถานะความชื้น: อัตโนมัติ 40–60% = Comfort หรือเลือกเองให้ตรงกับเครื่องวัดในห้อง
const HS:Record<string,string>={Comfort:'badge-success',Dry:'badge-warning',Humid:'badge-danger'}
const autoHumid=(h:string)=>{const v=parseFloat(h);return isNaN(v)?'':v>=40&&v<=60?'Comfort':v<40?'Dry':'Humid'}
const humidStatus=(s:S)=>s.humidStatus||autoHumid(s.humidity)

function fmt(d:D):string{
  const L=['📋 Daily Report','─'.repeat(36),'']
  const nn=LOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if(nn.length){L.push('🌐 Network');nn.forEach(l=>{const n=d.nets[l.key];L.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${reportTag(n.download,n.upload,n.meta)}${n.remark?`  (${n.remark})`:''}`)});L.push('')}
  d.rooms.filter(r=>r.roomNumber).forEach(r=>{L.push(`🚪 Room ${r.roomNumber}`);L.push(`• TV : ${r.tvOk?'OK':'NG'}`);L.push(`• Tel : ${r.telOk?'OK':'NG'}`);if(r.internetDown||r.internetUp)L.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps${reportTag(r.internetDown,r.internetUp,r.internetMeta)}`);if(r.remark)L.push(`• Remark : ${r.remark}`);L.push('')})
  const uu=d.ups.filter(u=>u.building&&(u.backupMin||u.tempC))
  if(uu.length){L.push('🔋 UPS');uu.forEach(u=>{L.push(`• ${u.building} : Backup ${u.backupMin||'—'} min`);if(u.tempC)L.push(`  Temp : ${u.tempC}°C`);if(u.remark)L.push(`  Remark : ${u.remark}`)});L.push('')}
  const{srv}=d;if(srv.tempIn||srv.tempOut||srv.humidity){const c=srv.humidity?humidStatus(srv):'';L.push('🖥️ Server Room');if(srv.tempIn)L.push(`• Temp In : ${srv.tempIn}°C`);if(srv.tempOut)L.push(`• Temp Out : ${srv.tempOut}°C`);if(srv.humidity)L.push(`• Humidity : ${srv.humidity}%${c?` (${c})`:''}`);if(srv.remark)L.push(`• Remark : ${srv.remark}`)}
  return L.join('\n').trim()
}

// กันส่งรายงานเปล่า: ต้องมีข้อมูลอย่างน้อย 1 อย่าง
const hasData=(d:D)=>LOCS.some(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)||d.rooms.some(r=>r.roomNumber)||d.ups.some(u=>u.backupMin||u.tempC)||!!(d.srv.tempIn||d.srv.tempOut||d.srv.humidity)

export default function TravelodgePage() {
  const{user,loading,logout}=useAuth()
  const{data,setData,loaded,saving,clearDraft}=useDraft<D>('travelodge',def())
  const[rpt,setRpt]=useState('');const[showRpt,setShowRpt]=useState(false);const[sent,setSent]=useState(false);const[showClr,setShowClr]=useState(false);const[sub,setSub]=useState(false)
  const toast=useToast()

  if(loading||!loaded)return<PageLoading/>

  const upd=(p:Partial<D>)=>setData(prev=>({...prev,...p}))
  const updN=(k:string,f:keyof N,v:N[keyof N])=>setData(p=>({...p,nets:{...p.nets,[k]:{...p.nets[k],[f]:v}}}))
  const updR=(i:number,f:keyof R,v:R[keyof R])=>setData(p=>{const r=[...p.rooms];(r[i] as any)[f]=v;return{...p,rooms:r}})
  const updU=(i:number,f:keyof U,v:string)=>setData(p=>{const u=[...p.ups];u[i][f]=v;return{...p,ups:u}})

  const preview=()=>{if(!hasData(data)){toast('ยังไม่มีข้อมูลในฟอร์ม กรอกอย่างน้อย 1 ส่วนก่อนส่ง','error');return}setRpt(fmt(data));setSent(false);setShowRpt(true);window.scrollTo(0,0)}
  const confirmSend=async()=>{
    setSub(true)
    try{const res=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotelType:'travelodge',reportText:rpt,networkTests:LOCS.map(l=>({location:l.key,...data.nets[l.key]})),serverRoom:data.srv,upsChecks:data.ups,roomChecks:data.rooms})});if(!res.ok)throw new Error(String(res.status));await clearDraft();setData(def());setSent(true)}catch{toast('ส่งไม่สำเร็จ ตรวจการเชื่อมต่อแล้วกดยืนยันอีกครั้ง','error')}
    setSub(false)
  }
  const clear=async()=>{await clearDraft();setData(def());setShowClr(false);toast('ล้างข้อมูลในฟอร์มแล้ว','success')}
  const backToForm=()=>{setShowRpt(false);setSent(false)}

  const hl=data.srv.humidity?humidStatus(data.srv):'';const ha=autoHumid(data.srv.humidity)
  const hv=parseFloat(data.srv.humidity);const hBad=!isNaN(hv)&&(hv<0||hv>100)

  return(
    <div style={accentVars('travelodge')}>
      <AppHeader username={user?.username||''} saving={saving} showBack onLogout={logout}/>
      <HotelHero name="Travelodge Nimman" sub="89 Chonprathan Rd, Nimmanhaemin, Chiang Mai" icon="bi-building-fill" historyHref="/history/travelodge"/>

      <main id="main" className="page">
        {showRpt?<ReportPreview text={rpt} sent={sent} sending={sub} historyHref="/history/travelodge" onEdit={backToForm} onConfirm={confirmSend} onNew={backToForm}/>:(<>
          <Section title="Network Speed Test" icon="bi-speedometer2" badge={`${LOCS.length} จุด`} bodyClassName="grid-auto grid-cards">
            {LOCS.map(l=><SpeedCard key={l.key} label={l.label} icon={l.icon} download={data.nets[l.key]?.download||''} upload={data.nets[l.key]?.upload||''} remark={data.nets[l.key]?.remark||''} meta={data.nets[l.key]?.meta} ap={data.nets[l.key]?.ap} onDownload={v=>updN(l.key,'download',v)} onUpload={v=>updN(l.key,'upload',v)} onRemark={v=>updN(l.key,'remark',v)} onMeta={m=>updN(l.key,'meta',m)} onAp={a=>updN(l.key,'ap',a)}/>)}
          </Section>

          <Section title="Server Room" icon="bi-server" tone={{bg:'var(--surface-muted)',fg:'#374151'}}>
            <div className="grid-auto" style={{'--col':'150px'} as React.CSSProperties}>
              <Field label="Temp In (°C)" icon="bi-thermometer-half">{id=><input id={id} type="number" inputMode="decimal" step="0.1" placeholder="23.5" value={data.srv.tempIn} onChange={e=>upd({srv:{...data.srv,tempIn:e.target.value}})}/>}</Field>
              <Field label="Temp Out (°C)" icon="bi-thermometer">{id=><input id={id} type="number" inputMode="decimal" step="0.1" placeholder="23.2" value={data.srv.tempOut} onChange={e=>upd({srv:{...data.srv,tempOut:e.target.value}})}/>}</Field>
              <Field label="Humidity (%)" icon="bi-droplet-half" extra={hl&&!hBad?<span className={`badge ${HS[hl]}`}>{hl}</span>:null} hint={hBad?<span style={{color:'var(--danger)'}}>ต้องอยู่ระหว่าง 0–100</span>:undefined}>
                {id=><input id={id} type="number" inputMode="decimal" min="0" max="100" placeholder="59" aria-invalid={hBad} value={data.srv.humidity} onChange={e=>upd({srv:{...data.srv,humidity:e.target.value}})}/>}
              </Field>
              <Field label="สถานะความชื้น" icon="bi-sliders" hint="ปล่อยอัตโนมัติ หรือเลือกให้ตรงกับเครื่องวัด">
                {id=><select id={id} value={data.srv.humidStatus||''} onChange={e=>upd({srv:{...data.srv,humidStatus:e.target.value}})}><option value="">อัตโนมัติ{ha?` (${ha})`:''}</option>{Object.keys(HS).map(k=><option key={k} value={k}>{k}</option>)}</select>}
              </Field>
            </div>
            <Field label="หมายเหตุ" icon="bi-chat-square-text">{id=><textarea id={id} placeholder="หมายเหตุ (ถ้ามี)" value={data.srv.remark} onChange={e=>upd({srv:{...data.srv,remark:e.target.value}})}/>}</Field>
          </Section>

          <Section title="UPS Check" icon="bi-battery-charging" tone={{bg:'var(--warning-bg)',fg:'var(--warning)'}} badge={`${data.ups.length} รายการ`}>
            {data.ups.map((u,i)=>(
              <article key={i} className="subcard">
                <div className="subcard-header">
                  <i className="bi bi-lightning-charge-fill" style={{color:'var(--warning)'}} aria-hidden="true"/>
                  <h3 className="subcard-title grow">UPS #{i+1}</h3>
                  {data.ups.length>1&&<button type="button" className="btn btn-sm btn-icon btn-ghost" aria-label={`ลบ UPS #${i+1}`} onClick={()=>setData(p=>({...p,ups:p.ups.filter((_,j)=>j!==i)}))}><i className="bi bi-trash3" aria-hidden="true"/></button>}
                </div>
                <div className="subcard-body">
                  <div className="grid-auto" style={{'--col':'130px'} as React.CSSProperties}>
                    <Field label="ตึก" icon="bi-building">{id=><select id={id} value={u.building} onChange={e=>updU(i,'building',e.target.value)}>{UPS_BUILDINGS.map(b=><option key={b}>{b}</option>)}</select>}</Field>
                    <Field label="Backup (นาที)" icon="bi-clock-history">{id=><input id={id} type="number" inputMode="numeric" min="0" placeholder="12" value={u.backupMin} onChange={e=>updU(i,'backupMin',e.target.value)}/>}</Field>
                    <Field label="Temp (°C)" icon="bi-thermometer">{id=><input id={id} type="number" inputMode="decimal" step="0.1" placeholder="32" value={u.tempC} onChange={e=>updU(i,'tempC',e.target.value)}/>}</Field>
                  </div>
                  <Field label="หมายเหตุ">{id=><input id={id} type="text" placeholder="หมายเหตุ (ถ้ามี)" value={u.remark} onChange={e=>updU(i,'remark',e.target.value)}/>}</Field>
                </div>
              </article>
            ))}
            <button type="button" className="btn btn-dashed btn-block" onClick={()=>setData(p=>({...p,ups:[...p.ups,{building:'T1',backupMin:'',tempC:'',remark:''}]}))}>
              <i className="bi bi-plus-lg" aria-hidden="true"/>เพิ่ม UPS
            </button>
          </Section>

          <Section title="Room Check" icon="bi-door-open" tone={{bg:'var(--success-bg)',fg:'var(--success)'}} badge={`${data.rooms.length} ห้อง`} bodyClassName="grid-auto grid-cards">
            {data.rooms.map((r,i)=><RoomCard key={i} room={r} index={i} onChange={(f,v)=>updR(i,f,v)}/>)}
          </Section>

          <SubmitBar onClear={()=>setShowClr(true)} onPreview={preview}/>
        </>)}
      </main>

      <ClearFormModal open={showClr} onCancel={()=>setShowClr(false)} onConfirm={clear}/>
    </div>
  )
}
