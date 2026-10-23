'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
import { CopyButton } from '@/components/ReportFlow'
import { HOTELS } from '@/lib/hotels'
import { apSummary } from '@/lib/speedtest'
import { testRows, dateRange, shiftAnchor, rangeLabel, type Report, type TestRow, type RangeMode } from '@/lib/history'
const F='Prompt,sans-serif'; const M='IBM Plex Mono,monospace'

const card:React.CSSProperties={background:'#fff',border:'1px solid #E5E7EB',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}
const note:React.CSSProperties={textAlign:'center',padding:20,fontSize:13,color:'#9CA3AF'}
const MODES:[RangeMode,string][]=[['day','วัน'],['week','สัปดาห์'],['month','เดือน'],['all','ทั้งหมด']]
const NET:Record<string,string>={wifi:'Wi‑Fi',cellular:'เน็ตมือถือ',ethernet:'LAN'}
const time=(iso:string)=>new Date(iso).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})
const pad=(n:number)=>String(n).padStart(2,'0')
const toInput=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

// รายละเอียดแต่ละจุดที่วัด: ความเร็ว, สถานะการวัด, ping/server/ค่ายเน็ต และ AP ที่เกาะ
function TestDetails({ rows }:{ rows:TestRow[] }){
  if(!rows.length)return null
  return(
    <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:6}}>
      <div style={{fontSize:12,fontWeight:600,color:'#374151',display:'flex',alignItems:'center',gap:5}}><i className="bi bi-speedometer2"/> รายละเอียดการวัด</div>
      {rows.map((t,i)=>{
        const m=t.meta;const ap=apSummary(m?.ap)
        const st=m?.auto?(m.warning?{t:`⚠ ${m.warning}`,c:'#B91C1C'}:{t:'✓ วัดอัตโนมัติ',c:'#059669'}):m?.at?{t:'✎ แก้ตัวเลขหลังวัด',c:'#B45309'}:{t:'✎ กรอกเอง',c:'#6B7280'}
        return(
          <div key={i} style={{border:'1px solid #E5E7EB',borderRadius:8,padding:'8px 10px',fontSize:12,lineHeight:1.6}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'baseline'}}>
              <b style={{fontSize:13}}>{t.label}</b>
              <span style={{fontFamily:M}}>↓{t.down??'—'} / ↑{t.up??'—'} Mbps</span>
              <span style={{color:st.c,fontWeight:600}}>{st.t}{m?.at?` ${time(m.at)}`:''}</span>
            </div>
            {m?.at&&<div style={{color:'#6B7280'}}>ping {m.ping} ms · jitter {m.jitter} ms · {[m.server,m.isp,m.network&&(NET[m.network]||m.network)].filter(Boolean).join(' · ')}</div>}
            <div style={{color:ap?'#374151':'#9CA3AF'}}><i className="bi bi-router"/> {ap||'ไม่ได้ระบุ AP'}{m?.ap?.bssid?<span style={{fontFamily:M}}> · BSSID {m.ap.bssid}</span>:null}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function HistoryPage({ params }:{ params:{ hotel:string } }){
  const hotel=HOTELS[params.hotel]?params.hotel:'travelodge'
  const info=HOTELS[hotel]
  const{user,loading,logout}=useAuth()
  const[mode,setMode]=useState<RangeMode>('all')
  const[anchor,setAnchor]=useState(()=>new Date())
  const[reports,setReports]=useState<Report[]>([])
  const[total,setTotal]=useState<number|null>(null)
  const[cursor,setCursor]=useState<string|null>(null)
  const[busy,setBusy]=useState(true)
  const[err,setErr]=useState(false)
  const[open,setOpen]=useState<string|null>(null)
  const req=useRef(0)
  const range=dateRange(mode,anchor)

  const load=async(after?:string|null)=>{
    const id=++req.current
    setBusy(true);setErr(false)
    if(!after){setReports([]);setTotal(null)}
    try{
      const q=new URLSearchParams({hotelType:hotel})
      if(range){q.set('from',range.from.toISOString());q.set('to',range.to.toISOString())}
      if(after)q.set('cursor',after)
      const res=await fetch(`/api/reports?${q}`)
      if(!res.ok)throw new Error(String(res.status))
      const d=await res.json()
      if(id!==req.current)return // ผลของตัวกรองเก่าที่ถูกเปลี่ยนไปแล้ว
      setReports(p=>after?[...p,...d.reports]:d.reports)
      setCursor(d.nextCursor)
      if(!after){setTotal(d.total);if(d.reports[0])setOpen(d.reports[0].id)}
    }catch{if(id===req.current)setErr(true)}
    if(id===req.current)setBusy(false)
  }
  useEffect(()=>{if(!loading)load()},[loading,hotel,mode,anchor.toDateString()])

  if(loading)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F5F5',color:'#9CA3AF',fontFamily:F}}>กำลังโหลด...</div>

  const navBtn:React.CSSProperties={width:34,height:34,background:'#F3F4F6',border:'1px solid #E5E7EB',color:'#374151',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}
  const atNow=!!range&&range.to.getTime()>Date.now()

  return(
    <div style={{minHeight:'100vh',background:'#F5F5F5',fontFamily:F}}>
      <AppHeader username={user?.username||''} backHref={info.path} backLabel={info.name} onLogout={logout}/>
      <div style={{maxWidth:740,margin:'0 auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:9,background:info.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}><i className="bi bi-clock-history"/></div>
          <div><div style={{fontSize:17,fontWeight:700}}>ประวัติ Report</div><div style={{fontSize:12,color:'#6B7280'}}>{info.name} · เฉพาะรายงานที่กดยืนยันส่ง</div></div>
        </div>

        {/* FILTER */}
        <div style={{...card,padding:12,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,background:'#F3F4F6',padding:4,borderRadius:9}}>
            {MODES.map(([k,l])=><button key={k} onClick={()=>setMode(k)} style={{padding:'7px 0',fontSize:13,fontWeight:600,borderRadius:6,background:mode===k?'#fff':'transparent',color:mode===k?info.color:'#6B7280',boxShadow:mode===k?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>{l}</button>)}
          </div>
          {range&&<>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button aria-label="ก่อนหน้า" onClick={()=>setAnchor(shiftAnchor(mode,anchor,-1))} style={navBtn}><i className="bi bi-chevron-left"/></button>
              <div style={{flex:1,textAlign:'center',fontSize:14,fontWeight:600}}>{rangeLabel(mode,range)}</div>
              <button aria-label="ถัดไป" onClick={()=>setAnchor(shiftAnchor(mode,anchor,1))} disabled={atNow} style={{...navBtn,opacity:atNow?0.4:1}}><i className="bi bi-chevron-right"/></button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <input type="date" value={toInput(anchor)} max={toInput(new Date())} onChange={e=>{const[y,m,d]=e.target.value.split('-').map(Number);if(y&&m&&d)setAnchor(new Date(y,m-1,d))}} style={{fontSize:13,padding:'6px 10px'}}/>
              <button onClick={()=>setAnchor(new Date())} style={{padding:'6px 12px',fontSize:13,background:'#F3F4F6',border:'1px solid #E5E7EB',whiteSpace:'nowrap',flexShrink:0}}>วันนี้</button>
            </div>
          </>}
          {total!=null&&<div style={{fontSize:12,color:'#6B7280'}}>พบ {total} รายงาน</div>}
        </div>

        {reports.map(r=>{
          const isOpen=open===r.id;const d=new Date(r.createdAt)
          return(
            <div key={r.id} style={card}>
              <div onClick={()=>setOpen(isOpen?null:r.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',cursor:'pointer'}}>
                <i className={`bi ${isOpen?'bi-chevron-down':'bi-chevron-right'}`} style={{color:'#9CA3AF'}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600}}>{d.toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div>
                  <div style={{fontSize:12,color:'#6B7280'}}>{time(r.createdAt)} น.{r.submittedBy?` · ส่งโดย ${r.submittedBy}`:''}</div>
                </div>
                <div onClick={e=>e.stopPropagation()}><CopyButton text={r.reportText} dark={false}/></div>
              </div>
              {isOpen&&<div style={{padding:'0 14px 14px'}}>
                <pre style={{fontFamily:M,fontSize:13,lineHeight:1.85,background:'#F8F8F8',borderRadius:8,padding:14,border:'1px solid #E5E7EB',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{r.reportText}</pre>
                <TestDetails rows={testRows(r)}/>
              </div>}
            </div>
          )
        })}

        {busy&&<div style={note}>กำลังโหลด...</div>}
        {err&&<div style={note}>โหลดประวัติไม่สำเร็จ <button onClick={()=>load(reports.length?cursor:null)} style={{marginLeft:6,padding:'4px 10px',fontSize:12,background:'#F3F4F6',border:'1px solid #E5E7EB'}}>ลองใหม่</button></div>}
        {!busy&&!err&&reports.length===0&&<div style={note}>{range?'ไม่มีรายงานในช่วงนี้':'ยังไม่มีรายงานที่ส่ง'}</div>}
        {!busy&&!err&&cursor&&<button onClick={()=>load(cursor)} style={{padding:10,background:'#fff',border:'1px solid #E5E7EB',fontSize:13,color:'#4B5563'}}>โหลดเพิ่ม</button>}
      </div>
    </div>
  )
}
