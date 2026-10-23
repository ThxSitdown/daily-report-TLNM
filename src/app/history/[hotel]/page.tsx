'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
import { CopyButton } from '@/components/ReportFlow'
import { HOTELS } from '@/lib/hotels'
import { fallbackText, type Report } from '@/lib/history'
const F='Prompt,sans-serif'; const M='IBM Plex Mono,monospace'

const card:React.CSSProperties={background:'#fff',border:'1px solid #E5E7EB',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}
const note:React.CSSProperties={textAlign:'center',padding:20,fontSize:13,color:'#9CA3AF'}

export default function HistoryPage({ params }:{ params:{ hotel:string } }){
  const hotel=HOTELS[params.hotel]?params.hotel:'travelodge'
  const info=HOTELS[hotel]
  const{user,loading,logout}=useAuth()
  const[reports,setReports]=useState<Report[]>([])
  const[cursor,setCursor]=useState<string|null>(null)
  const[busy,setBusy]=useState(true)
  const[err,setErr]=useState(false)
  const[open,setOpen]=useState<string|null>(null)

  const load=async(after?:string|null)=>{
    setBusy(true);setErr(false)
    try{
      const res=await fetch(`/api/reports?hotelType=${encodeURIComponent(hotel)}${after?`&cursor=${after}`:''}`)
      if(!res.ok)throw new Error(String(res.status))
      const d=await res.json()
      setReports(p=>after?[...p,...d.reports]:d.reports)
      setCursor(d.nextCursor)
      if(!after&&d.reports[0])setOpen(d.reports[0].id)
    }catch{setErr(true)}
    setBusy(false)
  }
  useEffect(()=>{if(!loading)load()},[loading,hotel])

  if(loading)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F5F5',color:'#9CA3AF',fontFamily:F}}>กำลังโหลด...</div>

  return(
    <div style={{minHeight:'100vh',background:'#F5F5F5',fontFamily:F}}>
      <AppHeader username={user?.username||''} backHref={info.path} backLabel={info.name} onLogout={logout}/>
      <div style={{maxWidth:740,margin:'0 auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:9,background:info.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}><i className="bi bi-clock-history"/></div>
          <div><div style={{fontSize:17,fontWeight:700}}>ประวัติ Report</div><div style={{fontSize:12,color:'#6B7280'}}>{info.name}</div></div>
        </div>

        {reports.map(r=>{
          const text=r.reportText||fallbackText(r);const isOpen=open===r.id;const d=new Date(r.createdAt)
          return(
            <div key={r.id} style={card}>
              <div onClick={()=>setOpen(isOpen?null:r.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',cursor:'pointer'}}>
                <i className={`bi ${isOpen?'bi-chevron-down':'bi-chevron-right'}`} style={{color:'#9CA3AF'}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600}}>{d.toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div>
                  <div style={{fontSize:12,color:'#6B7280'}}>{d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})} น.{r.submittedBy?` · ส่งโดย ${r.submittedBy}`:''}{r.reportText?'':' · รายงานเก่า'}</div>
                </div>
                <div onClick={e=>e.stopPropagation()}><CopyButton text={text} dark={false}/></div>
              </div>
              {isOpen&&<div style={{padding:'0 14px 14px'}}><pre style={{fontFamily:M,fontSize:13,lineHeight:1.85,background:'#F8F8F8',borderRadius:8,padding:14,border:'1px solid #E5E7EB',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{text}</pre></div>}
            </div>
          )
        })}

        {busy&&<div style={note}>กำลังโหลด...</div>}
        {err&&<div style={note}>โหลดประวัติไม่สำเร็จ <button onClick={()=>load(reports.length?cursor:null)} style={{marginLeft:6,padding:'4px 10px',fontSize:12,background:'#F3F4F6',border:'1px solid #E5E7EB'}}>ลองใหม่</button></div>}
        {!busy&&!err&&reports.length===0&&<div style={note}>ยังไม่มีรายงานที่ส่ง</div>}
        {!busy&&!err&&cursor&&<button onClick={()=>load(cursor)} style={{padding:10,background:'#fff',border:'1px solid #E5E7EB',fontSize:13,color:'#4B5563'}}>โหลดเพิ่ม</button>}
      </div>
    </div>
  )
}
