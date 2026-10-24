'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
import { CopyButton } from '@/components/ReportFlow'
import { PageLoading } from '@/components/ui'
import { HOTELS, accentVars } from '@/lib/hotels'
import { apSummary } from '@/lib/speedtest'
import { testRows, dateRange, shiftAnchor, rangeLabel, type Report, type TestRow, type RangeMode } from '@/lib/history'

const MODES:[RangeMode,string][]=[['day','วัน'],['week','สัปดาห์'],['month','เดือน'],['all','ทั้งหมด']]
const NET:Record<string,string>={wifi:'Wi‑Fi',cellular:'เน็ตมือถือ',ethernet:'LAN'}
const time=(iso:string)=>new Date(iso).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})
const pad=(n:number)=>String(n).padStart(2,'0')
const toInput=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

// รายละเอียดแต่ละจุดที่วัด: ความเร็ว, สถานะการวัด, ping/server/ค่ายเน็ต และ AP ที่เกาะ
function TestDetails({ rows }:{ rows:TestRow[] }){
  if(!rows.length)return null
  return(
    <div className="stack-sm">
      <h3 className="row" style={{fontSize:'var(--text-sm)',color:'var(--text-muted)'}}><i className="bi bi-speedometer2" aria-hidden="true"/>รายละเอียดการวัด</h3>
      <ul className="stack-sm" style={{listStyle:'none'}}>
        {rows.map((t,i)=>{
          const m=t.meta;const ap=apSummary(m?.ap)
          const st=m?.auto?(m.warning?{t:m.warning,c:'badge-danger',i:'bi-shield-exclamation'}:{t:'วัดอัตโนมัติ',c:'badge-success',i:'bi-patch-check-fill'}):m?.at?{t:'แก้ตัวเลขหลังวัด',c:'badge-warning',i:'bi-pencil-fill'}:{t:'กรอกเอง',c:'badge-neutral',i:'bi-pencil-fill'}
          return(
            <li key={i} className="subcard" style={{padding:'10px 12px',fontSize:'var(--text-sm)'}}>
              <div className="row" style={{flexWrap:'wrap',gap:'4px 10px'}}>
                <b>{t.label}</b>
                <span className="mono">↓{t.down??'—'} / ↑{t.up??'—'} Mbps</span>
                <span className={`badge ${st.c}`}><i className={`bi ${st.i}`} aria-hidden="true"/>{st.t}{m?.at?` · ${time(m.at)}`:''}</span>
              </div>
              {m?.at&&<div className="muted" style={{fontSize:'var(--text-xs)',marginTop:4}}>ping {m.ping} ms · jitter {m.jitter} ms · {[m.server,m.isp,m.network&&(NET[m.network]||m.network)].filter(Boolean).join(' · ')}</div>}
              <div className="row" style={{fontSize:'var(--text-xs)',marginTop:2,color:ap?'var(--text)':'var(--text-subtle)'}}><i className="bi bi-router" aria-hidden="true"/><span>{ap||'ไม่ได้ระบุ AP'}{m?.ap?.bssid?<span className="mono"> · BSSID {m.ap.bssid}</span>:null}</span></div>
            </li>
          )
        })}
      </ul>
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
  const dateId=useId()
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
  useEffect(()=>{if(!loading)load()},[loading,hotel,mode,anchor.toDateString()]) // eslint-disable-line react-hooks/exhaustive-deps

  if(loading)return<PageLoading/>

  const atNow=!!range&&range.to.getTime()>Date.now()

  return(
    <div style={accentVars(hotel)}>
      <AppHeader username={user?.username||''} backHref={info.path} backLabel={info.name} onLogout={logout}/>
      <main id="main" className="page">
        <div className="row" style={{gap:'var(--sp-3)'}}>
          <span className="hero-icon" style={{color:'#fff',width:40,height:40}} aria-hidden="true"><i className="bi bi-clock-history"/></span>
          <div>
            <h1 style={{fontSize:'var(--text-xl)'}}>ประวัติ Report</h1>
            <p className="muted" style={{fontSize:'var(--text-xs)'}}>{info.name} · เฉพาะรายงานที่กดยืนยันส่ง</p>
          </div>
        </div>

        {/* FILTER */}
        <section className="card card-body stack" aria-label="ตัวกรองช่วงเวลา">
          <div className="segmented" role="group" aria-label="ดูตาม">
            {MODES.map(([k,l])=><button key={k} type="button" aria-pressed={mode===k} onClick={()=>setMode(k)}>{l}</button>)}
          </div>
          {range&&<>
            <div className="row">
              <button type="button" className="btn btn-secondary btn-icon" aria-label="ช่วงก่อนหน้า" onClick={()=>setAnchor(shiftAnchor(mode,anchor,-1))}><i className="bi bi-chevron-left" aria-hidden="true"/></button>
              <p className="grow" style={{textAlign:'center',fontWeight:600}} aria-live="polite">{rangeLabel(mode,range)}</p>
              <button type="button" className="btn btn-secondary btn-icon" aria-label="ช่วงถัดไป" disabled={atNow} onClick={()=>setAnchor(shiftAnchor(mode,anchor,1))}><i className="bi bi-chevron-right" aria-hidden="true"/></button>
            </div>
            <div className="row">
              <label htmlFor={dateId} className="sr-only">เลือกวันที่</label>
              <input id={dateId} type="date" value={toInput(anchor)} max={toInput(new Date())} onChange={e=>{const[y,m,d]=e.target.value.split('-').map(Number);if(y&&m&&d)setAnchor(new Date(y,m-1,d))}}/>
              <button type="button" className="btn btn-secondary" style={{flexShrink:0}} onClick={()=>setAnchor(new Date())}>วันนี้</button>
            </div>
          </>}
          {total!=null&&<p className="muted" style={{fontSize:'var(--text-sm)'}} role="status">พบ {total} รายงาน</p>}
        </section>

        {reports.map(r=>{
          const isOpen=open===r.id;const d=new Date(r.createdAt);const panel=`report-${r.id}`
          return(
            <article key={r.id} className="card">
              <div className="row" style={{padding:'6px 10px 6px 6px'}}>
                <button type="button" className="disclosure grow" style={{minHeight:48}} aria-expanded={isOpen} aria-controls={panel} onClick={()=>setOpen(isOpen?null:r.id)}>
                  <i className={`bi ${isOpen?'bi-chevron-down':'bi-chevron-right'}`} aria-hidden="true"/>
                  <span className="grow">
                    <span style={{display:'block',fontSize:'var(--text-md)',fontWeight:600,color:'var(--text)'}}>{d.toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span>
                    <span style={{display:'block',fontSize:'var(--text-xs)'}}>{time(r.createdAt)} น.{r.submittedBy?` · ส่งโดย ${r.submittedBy}`:''}</span>
                  </span>
                </button>
                <CopyButton text={r.reportText} onDark={false}/>
              </div>
              <div id={panel} hidden={!isOpen} className="stack" style={{padding:'0 var(--sp-4) var(--sp-4)'}}>
                {isOpen&&<><pre className="report-text">{r.reportText}</pre><TestDetails rows={testRows(r)}/></>}
              </div>
            </article>
          )
        })}

        {busy&&<p className="row muted" style={{justifyContent:'center',padding:'var(--sp-5)'}} role="status"><i className="bi bi-arrow-repeat spin" aria-hidden="true"/>กำลังโหลด...</p>}
        {err&&<div className="alert alert-danger" role="alert"><i className="bi bi-exclamation-octagon" aria-hidden="true"/><span className="grow">โหลดประวัติไม่สำเร็จ</span><button type="button" className="btn btn-sm btn-secondary" onClick={()=>load(reports.length?cursor:null)}>ลองใหม่</button></div>}
        {!busy&&!err&&reports.length===0&&<div className="card card-body muted" style={{textAlign:'center'}}><i className="bi bi-inbox" style={{fontSize:28,display:'block',color:'var(--text-subtle)'}} aria-hidden="true"/>{range?'ไม่มีรายงานในช่วงนี้':'ยังไม่มีรายงานที่ส่ง'}</div>}
        {!busy&&!err&&cursor&&<button type="button" className="btn btn-secondary btn-block" onClick={()=>load(cursor)}>โหลดเพิ่ม</button>}
      </main>
    </div>
  )
}
