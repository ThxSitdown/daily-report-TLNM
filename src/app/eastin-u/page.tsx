'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useDraft } from '@/lib/useDraft'
import { AppHeader } from '@/components/AppHeader'
import { SpeedCard } from '@/components/SpeedCard'
import { RoomCard } from '@/components/RoomCard'
import { ReportPreview, ClearFormModal, SubmitBar } from '@/components/ReportFlow'
import { Section, HotelHero, PageLoading, useToast } from '@/components/ui'
import { emptyRoom, type NetData as N, type RoomData as R } from '@/lib/types'
import { EASTIN_LOCS as ELOCS, UNIMMAN_LOCS as ULOCS, accentVars, type Loc } from '@/lib/hotels'
import { reportTag } from '@/lib/speedtest'

interface D{nets:Record<string,N>;er:R[];ur:R[]}

const def=():D=>({nets:Object.fromEntries([...ELOCS,...ULOCS].map(l=>[l.key,{download:'',upload:'',remark:''}])),er:[emptyRoom(),emptyRoom()],ur:[emptyRoom(),emptyRoom()]})

function fmt(d:D):string{
  const L=['📋 Daily Report','─'.repeat(36),'']
  L.push('═══ EASTIN TAN HOTEL ═══','')
  const en=ELOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if(en.length){L.push('🌐 Network');en.forEach(l=>{const n=d.nets[l.key];L.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${reportTag(n.download,n.upload,n.meta)}${n.remark?`  (${n.remark})`:''}`)}); L.push('')}
  d.er.filter(r=>r.roomNumber).forEach(r=>{L.push(`🚪 Room ${r.roomNumber}`);L.push(`• TV : ${r.tvOk?'OK':'NG'}`);L.push(`• Tel : ${r.telOk?'OK':'NG'}`);if(r.internetDown||r.internetUp)L.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps${reportTag(r.internetDown,r.internetUp,r.internetMeta)}`);if(r.remark)L.push(`• Remark : ${r.remark}`);L.push('')})
  L.push('','═══ U NIMMAN HOTEL ═══','')
  const un=ULOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if(un.length){L.push('🌐 Network');un.forEach(l=>{const n=d.nets[l.key];L.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${reportTag(n.download,n.upload,n.meta)}${n.remark?`  (${n.remark})`:''}`)}); L.push('')}
  d.ur.filter(r=>r.roomNumber).forEach(r=>{L.push(`🚪 Room ${r.roomNumber}`);L.push(`• TV : ${r.tvOk?'OK':'NG'}`);L.push(`• Tel : ${r.telOk?'OK':'NG'}`);if(r.internetDown||r.internetUp)L.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps${reportTag(r.internetDown,r.internetUp,r.internetMeta)}`);if(r.remark)L.push(`• Remark : ${r.remark}`);L.push('')})
  return L.join('\n').trim()
}

// กันส่งรายงานเปล่า: ต้องมีข้อมูลอย่างน้อย 1 อย่าง
const hasData=(d:D)=>[...ELOCS,...ULOCS].some(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)||[...d.er,...d.ur].some(r=>r.roomNumber)

// ป้ายแบ่งส่วนของแต่ละโรงแรมในหน้ารวม
function HotelDivider({ name, icon }:{ name:string; icon:string }) {
  return <p className="row" style={{ marginTop:'var(--sp-2)', paddingLeft:'var(--sp-3)', borderLeft:'4px solid var(--accent)', fontWeight:700, fontSize:'var(--text-lg)' }}><i className={`bi ${icon}`} style={{ color:'var(--accent)' }} aria-hidden="true"/>{name}</p>
}

export default function EastinUPage(){
  const{user,loading,logout}=useAuth()
  const{data,setData,loaded,saving,clearDraft}=useDraft<D>('eastin-u',def())
  const[rpt,setRpt]=useState('');const[showRpt,setShowRpt]=useState(false);const[sent,setSent]=useState(false);const[showClr,setShowClr]=useState(false);const[sub,setSub]=useState(false)
  const toast=useToast()

  if(loading||!loaded)return<PageLoading/>

  const updN=(k:string,f:keyof N,v:N[keyof N])=>setData(p=>({...p,nets:{...p.nets,[k]:{...p.nets[k],[f]:v}}}))
  const updR=(hotel:'er'|'ur',i:number,f:keyof R,v:R[keyof R])=>setData(p=>{const r=[...p[hotel]];(r[i] as any)[f]=v;return{...p,[hotel]:r}})

  const preview=()=>{if(!hasData(data)){toast('ยังไม่มีข้อมูลในฟอร์ม กรอกอย่างน้อย 1 ส่วนก่อนส่ง','error');return}setRpt(fmt(data));setSent(false);setShowRpt(true);window.scrollTo(0,0)}
  const confirmSend=async()=>{
    setSub(true)
    try{const res=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotelType:'eastin-u',reportText:rpt,networkTests:[...ELOCS,...ULOCS].map(l=>({location:l.key,...data.nets[l.key]})),roomChecks:[...data.er,...data.ur]})});if(!res.ok)throw new Error(String(res.status));await clearDraft();setData(def());setSent(true)}catch{toast('ส่งไม่สำเร็จ ตรวจการเชื่อมต่อแล้วกดยืนยันอีกครั้ง','error')}
    setSub(false)
  }
  const clear=async()=>{await clearDraft();setData(def());setShowClr(false);toast('ล้างข้อมูลในฟอร์มแล้ว','success')}
  const backToForm=()=>{setShowRpt(false);setSent(false)}

  const netSection=(title:string,locs:Loc[])=>(
    <Section title={title} icon="bi-speedometer2" badge={`${locs.length} จุด`} bodyClassName="grid-auto grid-cards">
      {locs.map(l=><SpeedCard key={l.key} label={l.label} icon={l.icon} download={data.nets[l.key]?.download||''} upload={data.nets[l.key]?.upload||''} remark={data.nets[l.key]?.remark||''} meta={data.nets[l.key]?.meta} ap={data.nets[l.key]?.ap} onDownload={v=>updN(l.key,'download',v)} onUpload={v=>updN(l.key,'upload',v)} onRemark={v=>updN(l.key,'remark',v)} onMeta={m=>updN(l.key,'meta',m)} onAp={a=>updN(l.key,'ap',a)}/>)}
    </Section>
  )
  const roomSection=(title:string,rooms:R[],hotel:'er'|'ur')=>(
    <Section title={title} icon="bi-door-open" tone={{bg:'var(--success-bg)',fg:'var(--success)'}} badge={`${rooms.length} ห้อง`} bodyClassName="grid-auto grid-cards">
      {rooms.map((r,i)=><RoomCard key={i} room={r} index={i} onChange={(f,v)=>updR(hotel,i,f,v)}/>)}
    </Section>
  )

  return(
    <div style={accentVars('eastin-u')}>
      <AppHeader username={user?.username||''} saving={saving} showBack onLogout={logout}/>
      <HotelHero name="Eastin Tan & U Nimman" sub="Chiang Mai — Combined Daily Report" icon="bi-buildings-fill" historyHref="/history/eastin-u"/>

      <main id="main" className="page">
        {showRpt?<ReportPreview text={rpt} sent={sent} sending={sub} historyHref="/history/eastin-u" onEdit={backToForm} onConfirm={confirmSend} onNew={backToForm}/>:(<>
          <HotelDivider name="Eastin Tan Hotel" icon="bi-building-fill"/>
          {netSection('Eastin · Network Speed Test',ELOCS)}
          {roomSection('Eastin · Room Check',data.er,'er')}

          <HotelDivider name="U Nimman Hotel" icon="bi-buildings-fill"/>
          {netSection('U Nimman · Network Speed Test',ULOCS)}
          {roomSection('U Nimman · Room Check',data.ur,'ur')}

          <SubmitBar onClear={()=>setShowClr(true)} onPreview={preview}/>
        </>)}
      </main>

      <ClearFormModal open={showClr} onCancel={()=>setShowClr(false)} onConfirm={clear}/>
    </div>
  )
}
