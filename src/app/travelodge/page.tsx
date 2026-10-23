'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { useDraft } from '@/lib/useDraft'
import { AppHeader } from '@/components/AppHeader'
import { SpeedCard } from '@/components/SpeedCard'
import { ReportPreview, ClearFormModal, SubmitBar } from '@/components/ReportFlow'
import { UPS_BUILDINGS } from '@/lib/types'
import { TRAVELODGE_LOCS as LOCS } from '@/lib/hotels'
import { reportTag, type SpeedMeta } from '@/lib/speedtest'
const F='Prompt,sans-serif'; const M='IBM Plex Mono,monospace'

interface N{download:string;upload:string;remark:string;meta?:SpeedMeta}
interface U{building:string;backupMin:string;tempC:string;remark:string}
interface R{roomNumber:string;tvOk:boolean;telOk:boolean;internetDown:string;internetUp:string;remark:string;internetMeta?:SpeedMeta}
interface S{tempIn:string;tempOut:string;humidity:string;remark:string;humidStatus?:string}
interface D{nets:Record<string,N>;srv:S;ups:U[];rooms:R[]}

const def=():D=>({
  nets:Object.fromEntries(LOCS.map(l=>[l.key,{download:'',upload:'',remark:''}])),
  srv:{tempIn:'',tempOut:'',humidity:'',remark:''},
  ups:[{building:'T1',backupMin:'',tempC:'',remark:''}],
  rooms:[{roomNumber:'',tvOk:false,telOk:false,internetDown:'',internetUp:'',remark:''},{roomNumber:'',tvOk:false,telOk:false,internetDown:'',internetUp:'',remark:''}]
})

// สถานะความชื้น: อัตโนมัติ 40–60% = Comfort หรือเลือกเองให้ตรงกับเครื่องวัดในห้อง
const HS:Record<string,{c:string;b:string}>={Comfort:{c:'#059669',b:'#D1FAE5'},Dry:{c:'#D97706',b:'#FEF3C7'},Humid:{c:'#DC2626',b:'#FEE2E2'}}
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

const sec=(extra?:object):React.CSSProperties=>({background:'#fff',border:'1px solid #E5E7EB',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',...extra})
const secHead:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #E5E7EB'}
const lbl:React.CSSProperties={fontSize:11,fontWeight:600,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.4px',display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}

export default function TravelodgePage() {
  const{user,loading,logout}=useAuth()
  const{data,setData,loaded,saving,clearDraft}=useDraft<D>('travelodge',def())
  const[rpt,setRpt]=useState('');const[showRpt,setShowRpt]=useState(false);const[sent,setSent]=useState(false);const[showClr,setShowClr]=useState(false);const[sub,setSub]=useState(false)

  if(loading||!loaded)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F5F5',color:'#9CA3AF',fontFamily:F}}>กำลังโหลดข้อมูล...</div>

  const upd=(p:Partial<D>)=>setData(prev=>({...prev,...p}))
  const updN=(k:string,f:keyof N,v:N[keyof N])=>setData(p=>({...p,nets:{...p.nets,[k]:{...p.nets[k],[f]:v}}}))
  const updR=(i:number,f:keyof R,v:R[keyof R])=>setData(p=>{const r=[...p.rooms];(r[i] as any)[f]=v;return{...p,rooms:r}})
  const updU=(i:number,f:keyof U,v:string)=>setData(p=>{const u=[...p.ups];u[i][f]=v;return{...p,ups:u}})

  const preview=()=>{setRpt(fmt(data));setSent(false);setShowRpt(true);window.scrollTo(0,0)}
  const confirmSend=async()=>{
    setSub(true)
    try{const res=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotelType:'travelodge',reportText:rpt,networkTests:LOCS.map(l=>({location:l.key,...data.nets[l.key]})),serverRoom:data.srv,upsChecks:data.ups,roomChecks:data.rooms})});if(!res.ok)throw new Error(String(res.status));await clearDraft();setData(def());setSent(true)}catch{alert('ส่งไม่สำเร็จ ลองกดยืนยันอีกครั้ง')}
    setSub(false)
  }
  const clear=async()=>{await clearDraft();setData(def());setShowClr(false)}
  const backToForm=()=>{setShowRpt(false);setSent(false)}

  const hl=data.srv.humidity?humidStatus(data.srv):'';const hs=hl?{l:hl,...HS[hl]}:null;const ha=autoHumid(data.srv.humidity)

  return(
    <div style={{minHeight:'100vh',background:'#F5F5F5',fontFamily:F}}>
      <AppHeader username={user?.username||''} saving={saving} showBack onLogout={logout}/>
      <div style={{background:'#111',borderBottom:'3px solid #C8102E',padding:16}}>
        <div style={{maxWidth:740,margin:'0 auto',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,background:'#C8102E',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',flexShrink:0}}><i className="bi bi-building-fill"/></div>
          <div style={{flex:1}}><div style={{fontSize:18,fontWeight:700,color:'#fff'}}>Travelodge Nimman</div><div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>89 Chonprathan Rd, Nimmanhaemin, Chiang Mai</div></div>
          <Link href="/history/travelodge" style={{padding:'6px 12px',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:7,fontSize:12,display:'flex',alignItems:'center',gap:5,textDecoration:'none',whiteSpace:'nowrap'}}><i className="bi bi-clock-history"/> ประวัติ</Link>
        </div>
      </div>

      <div style={{maxWidth:740,margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>

        {showRpt&&<ReportPreview text={rpt} sent={sent} sending={sub} headerBg="#111" accent="#C8102E" historyHref="/history/travelodge" onEdit={backToForm} onConfirm={confirmSend} onNew={backToForm}/>}

        {!showRpt&&(<>
          {/* NETWORK */}
          <div style={sec()}>
            <div style={secHead}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:30,height:30,borderRadius:7,background:'#FDEAED',color:'#C8102E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}><i className="bi bi-speedometer2"/></div><span style={{fontSize:14,fontWeight:600}}>Network Speed Test</span></div><span style={{fontSize:11,color:'#6B7280',background:'#F3F4F6',padding:'2px 8px',borderRadius:20,fontWeight:500}}>4 จุด</span></div>
            <div style={{padding:'14px 16px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{LOCS.map(l=><SpeedCard key={l.key} label={l.label} icon={l.icon} download={data.nets[l.key]?.download||''} upload={data.nets[l.key]?.upload||''} remark={data.nets[l.key]?.remark||''} meta={data.nets[l.key]?.meta} onDownload={v=>updN(l.key,'download',v)} onUpload={v=>updN(l.key,'upload',v)} onRemark={v=>updN(l.key,'remark',v)} onMeta={m=>updN(l.key,'meta',m)}/>)}</div></div>
          </div>

          {/* SERVER ROOM */}
          <div style={sec()}>
            <div style={secHead}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:30,height:30,borderRadius:7,background:'#F3F4F6',color:'#374151',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}><i className="bi bi-server"/></div><span style={{fontSize:14,fontWeight:600}}>Server Room</span></div></div>
            <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-thermometer-half"/>Temp In (°C)</label><input type="number" step="0.1" placeholder="23.5" value={data.srv.tempIn} onChange={e=>upd({srv:{...data.srv,tempIn:e.target.value}})}/></div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-thermometer"/>Temp Out (°C)</label><input type="number" step="0.1" placeholder="23.2" value={data.srv.tempOut} onChange={e=>upd({srv:{...data.srv,tempOut:e.target.value}})}/></div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-droplet-half"/>Humidity (%){hs&&<span style={{fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:20,background:hs.b,color:hs.c}}>{hs.l}</span>}</label><input type="number" min="0" max="100" placeholder="59" value={data.srv.humidity} onChange={e=>upd({srv:{...data.srv,humidity:e.target.value}})}/><select value={data.srv.humidStatus||''} onChange={e=>upd({srv:{...data.srv,humidStatus:e.target.value}})} style={{fontSize:12,padding:'5px 8px'}}><option value="">อัตโนมัติ{ha?` (${ha})`:''}</option>{Object.keys(HS).map(k=><option key={k} value={k}>{k}</option>)}</select></div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-chat-square-text"/>Remark</label><textarea placeholder="หมายเหตุ..." value={data.srv.remark} onChange={e=>upd({srv:{...data.srv,remark:e.target.value}})}/></div>
            </div>
          </div>

          {/* UPS */}
          <div style={sec()}>
            <div style={secHead}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:30,height:30,borderRadius:7,background:'#FEF3C7',color:'#D97706',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}><i className="bi bi-battery-charging"/></div><span style={{fontSize:14,fontWeight:600}}>UPS Check</span></div><span style={{fontSize:11,color:'#6B7280',background:'#F3F4F6',padding:'2px 8px',borderRadius:20,fontWeight:500}}>{data.ups.length} รายการ</span></div>
            <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
              {data.ups.map((u,i)=>(
                <div key={i} style={{border:'1.5px solid #E5E7EB',borderRadius:9,overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#1E1E1E'}}>
                    <span style={{fontSize:13,fontWeight:600,color:'#fff',display:'flex',alignItems:'center',gap:6}}><i className="bi bi-lightning-charge-fill" style={{color:'#FACC15'}}/>UPS #{i+1}</span>
                    {data.ups.length>1&&<button onClick={()=>setData(p=>({...p,ups:p.ups.filter((_,j)=>j!==i)}))} style={{width:22,height:22,background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:5,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontFamily:F}}><i className="bi bi-x"/></button>}
                  </div>
                  <div style={{padding:12,display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                      <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-building"/>ตึก</label><select value={u.building} onChange={e=>updU(i,'building',e.target.value)}>{UPS_BUILDINGS.map(b=><option key={b}>{b}</option>)}</select></div>
                      <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-clock-history"/>Backup (min)</label><input type="number" placeholder="12" value={u.backupMin} onChange={e=>updU(i,'backupMin',e.target.value)}/></div>
                      <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-thermometer"/>Temp (°C)</label><input type="number" step="0.1" placeholder="32" value={u.tempC} onChange={e=>updU(i,'tempC',e.target.value)}/></div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={lbl}><i className="bi bi-chat-square-text"/>Remark</label><input type="text" placeholder="หมายเหตุ..." value={u.remark} onChange={e=>updU(i,'remark',e.target.value)}/></div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setData(p=>({...p,ups:[...p.ups,{building:'T1',backupMin:'',tempC:'',remark:''}]}))} style={{width:'100%',padding:9,background:'transparent',border:'2px dashed #E5E7EB',color:'#9CA3AF',borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:F}}>
                <i className="bi bi-plus-lg"/> เพิ่ม UPS
              </button>
            </div>
          </div>

          {/* ROOMS */}
          <div style={sec()}>
            <div style={secHead}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:30,height:30,borderRadius:7,background:'#D1FAE5',color:'#059669',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}><i className="bi bi-door-open"/></div><span style={{fontSize:14,fontWeight:600}}>Room Check</span></div><span style={{fontSize:11,color:'#6B7280',background:'#F3F4F6',padding:'2px 8px',borderRadius:20,fontWeight:500}}>2 ห้อง</span></div>
            <div style={{padding:'14px 16px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {data.rooms.map((r,i)=>(
                <div key={i} style={{border:'1.5px solid #E5E7EB',borderRadius:9,overflow:'hidden'}}>
                  <div style={{padding:'10px 12px',background:'#111',borderBottom:'2px solid #C8102E'}}>
                    <div style={{fontSize:10,fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:4}}># เลขห้อง</div>
                    <input type="text" placeholder="2205" value={r.roomNumber} onChange={e=>updR(i,'roomNumber',e.target.value)} style={{fontFamily:M,fontSize:22,fontWeight:600,letterSpacing:4,textAlign:'center',color:'#fff',background:'transparent',border:'1.5px solid rgba(255,255,255,0.2)',borderRadius:7,padding:'6px',width:'100%',outline:'none'}}/>
                  </div>
                  <div style={{padding:12,display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'flex',gap:8}}>
                      {(['tvOk','telOk'] as const).map(k=>(
                        <button key={k} onClick={()=>updR(i,k,!r[k])} style={{flex:1,padding:'8px',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:F,background:r[k]?'#D1FAE5':'#FEE2E2',color:r[k]?'#059669':'#DC2626',borderColor:r[k]?'#A7F3D0':'#FECACA'}}>
                          <i className={`bi ${k==='tvOk'?(r[k]?'bi-tv-fill':'bi-tv'):(r[k]?'bi-telephone-fill':'bi-telephone')}`}/>{k==='tvOk'?'TV':'Tel'} {r[k]?'OK':'NG'}
                        </button>
                      ))}
                    </div>
                    <SpeedCard label={`Internet ห้อง ${r.roomNumber||'—'}`} icon="bi-wifi" download={r.internetDown} upload={r.internetUp} remark={r.remark} meta={r.internetMeta} onDownload={v=>updR(i,'internetDown',v)} onUpload={v=>updR(i,'internetUp',v)} onRemark={v=>updR(i,'remark',v)} onMeta={m=>updR(i,'internetMeta',m)}/>
                  </div>
                </div>
              ))}
            </div></div>
          </div>

          {/* SUBMIT */}
          <SubmitBar background="#C8102E" shadow="0 3px 10px rgba(200,16,46,0.28)" onClear={()=>setShowClr(true)} onPreview={preview}/>
        </>)}
      </div>

      {showClr&&<ClearFormModal onCancel={()=>setShowClr(false)} onConfirm={clear}/>}
    </div>
  )
}
