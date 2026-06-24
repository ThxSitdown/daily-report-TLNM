'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useDraft } from '@/lib/useDraft'
import { AppHeader } from '@/components/AppHeader'
import { SpeedCard } from '@/components/SpeedCard'
const F='Prompt,sans-serif'; const M='IBM Plex Mono,monospace'

const ELOCS=[{key:'el',label:'Lobby',icon:'bi-building'},{key:'ets',label:'T Station',icon:'bi-signpost-2'},{key:'ec',label:'Cafe',icon:'bi-cup-hot'},{key:'esp',label:'Swimming Pool',icon:'bi-water'}]
const ULOCS=[{key:'ul',label:'Lobby',icon:'bi-building'},{key:'ueat',label:'Eat@',icon:'bi-shop'},{key:'upb',label:'Pool Bar',icon:'bi-cup-straw'}]

interface N{download:string;upload:string;remark:string}
interface R{roomNumber:string;tvOk:boolean;telOk:boolean;internetDown:string;internetUp:string;remark:string}
interface D{nets:Record<string,N>;er:R[];ur:R[]}

const defR=():R=>({roomNumber:'',tvOk:false,telOk:false,internetDown:'',internetUp:'',remark:''})
const def=():D=>({nets:Object.fromEntries([...ELOCS,...ULOCS].map(l=>[l.key,{download:'',upload:'',remark:''}])),er:[defR(),defR()],ur:[defR(),defR()]})

function fmt(d:D):string{
  const date=new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric',weekday:'long'})
  const L=['📋 Daily Report',`📅 ${date}`,'🏨 Eastin Tan & U Nimman Chiang Mai','─'.repeat(36),'']
  L.push('═══ EASTIN TAN HOTEL ═══','')
  const en=ELOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if(en.length){L.push('🌐 Network');en.forEach(l=>{const n=d.nets[l.key];L.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${n.remark?`  (${n.remark})`:''}`)}); L.push('')}
  d.er.filter(r=>r.roomNumber).forEach(r=>{L.push(`🚪 Room ${r.roomNumber}`);L.push(`• TV : ${r.tvOk?'OK':'NG'}`);L.push(`• Tel : ${r.telOk?'OK':'NG'}`);if(r.internetDown||r.internetUp)L.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps`);if(r.remark)L.push(`• Remark : ${r.remark}`);L.push('')})
  L.push('','═══ U NIMMAN HOTEL ═══','')
  const un=ULOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if(un.length){L.push('🌐 Network');un.forEach(l=>{const n=d.nets[l.key];L.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${n.remark?`  (${n.remark})`:''}`)}); L.push('')}
  d.ur.filter(r=>r.roomNumber).forEach(r=>{L.push(`🚪 Room ${r.roomNumber}`);L.push(`• TV : ${r.tvOk?'OK':'NG'}`);L.push(`• Tel : ${r.telOk?'OK':'NG'}`);if(r.internetDown||r.internetUp)L.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps`);if(r.remark)L.push(`• Remark : ${r.remark}`);L.push('')})
  return L.join('\n')
}

function RoomCard({r,onChange}:{r:R;onChange:(f:keyof R,v:string|boolean)=>void}){
  return(
    <div style={{border:'1.5px solid #E5E7EB',borderRadius:9,overflow:'hidden'}}>
      <div style={{padding:'10px 12px',background:'#111',borderBottom:'2px solid #0891B2'}}>
        <div style={{fontSize:10,fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:4}}># เลขห้อง</div>
        <input type="text" placeholder="XXX" value={r.roomNumber} onChange={e=>onChange('roomNumber',e.target.value)} style={{fontFamily:M,fontSize:22,fontWeight:600,letterSpacing:4,textAlign:'center',color:'#fff',background:'transparent',border:'1.5px solid rgba(255,255,255,0.2)',borderRadius:7,padding:'6px',width:'100%',outline:'none'}}/>
      </div>
      <div style={{padding:12,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          {(['tvOk','telOk'] as const).map(k=>(
            <button key={k} onClick={()=>onChange(k,!r[k])} style={{flex:1,padding:'8px',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:F,background:r[k]?'#D1FAE5':'#FEE2E2',color:r[k]?'#059669':'#DC2626',borderColor:r[k]?'#A7F3D0':'#FECACA'}}>
              <i className={`bi ${k==='tvOk'?(r[k]?'bi-tv-fill':'bi-tv'):(r[k]?'bi-telephone-fill':'bi-telephone')}`}/>{k==='tvOk'?'TV':'Tel'} {r[k]?'OK':'NG'}
            </button>
          ))}
        </div>
        <SpeedCard label={`Internet ห้อง ${r.roomNumber||'—'}`} icon="bi-wifi" download={r.internetDown} upload={r.internetUp} remark={r.remark} onDownload={v=>onChange('internetDown',v)} onUpload={v=>onChange('internetUp',v)} onRemark={v=>onChange('remark',v)}/>
      </div>
    </div>
  )
}

const card=(extra?:object):React.CSSProperties=>({background:'#fff',border:'1px solid #E5E7EB',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',...extra})
const secH:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #E5E7EB'}
const ico=(bg:string,c:string):React.CSSProperties=>({width:30,height:30,borderRadius:7,background:bg,color:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15})

export default function EastinUPage(){
  const{user,loading,logout}=useAuth()
  const{data,setData,loaded,saving,clearDraft}=useDraft<D>('eastin-u',def())
  const[rpt,setRpt]=useState('');const[showRpt,setShowRpt]=useState(false);const[copied,setCopied]=useState(false);const[showClr,setShowClr]=useState(false);const[sub,setSub]=useState(false)

  if(loading||!loaded)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F5F5',color:'#9CA3AF',fontFamily:F}}>กำลังโหลดข้อมูล...</div>

  const updN=(k:string,f:keyof N,v:string)=>setData(p=>({...p,nets:{...p.nets,[k]:{...p.nets[k],[f]:v}}}))
  const updR=(hotel:'er'|'ur',i:number,f:keyof R,v:string|boolean)=>setData(p=>{const r=[...p[hotel]];(r[i] as any)[f]=v;return{...p,[hotel]:r}})

  const submit=async()=>{
    setSub(true)
    try{await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotelType:'eastin-u',networkTests:[...ELOCS,...ULOCS].map(l=>({location:l.key,...data.nets[l.key]})),roomChecks:[...data.er,...data.ur]})});setRpt(fmt(data));setShowRpt(true)}catch{alert('Error')}
    setSub(false)
  }
  const copy=async()=>{await navigator.clipboard.writeText(rpt);setCopied(true);setTimeout(()=>setCopied(false),2000)}
  const clear=async()=>{await clearDraft();setData(def());setShowRpt(false);setShowClr(false)}

  const netSection=(locs:typeof ELOCS,badge:string,icoStyle:{bg:string;c:string})=>(
    <div style={card()}>
      <div style={secH}>
        <div style={{display:'flex',alignItems:'center',gap:10}}><div style={ico(icoStyle.bg,icoStyle.c)}><i className="bi bi-speedometer2"/></div><span style={{fontSize:14,fontWeight:600}}>Network Speed Test</span></div>
        <span style={{fontSize:11,color:'#6B7280',background:'#F3F4F6',padding:'2px 8px',borderRadius:20,fontWeight:500}}>{badge}</span>
      </div>
      <div style={{padding:'14px 16px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{locs.map(l=><SpeedCard key={l.key} label={l.label} icon={l.icon} download={data.nets[l.key]?.download||''} upload={data.nets[l.key]?.upload||''} remark={data.nets[l.key]?.remark||''} onDownload={v=>updN(l.key,'download',v)} onUpload={v=>updN(l.key,'upload',v)} onRemark={v=>updN(l.key,'remark',v)}/>)}</div></div>
    </div>
  )

  const roomSection=(rooms:R[],hotel:'er'|'ur')=>(
    <div style={card()}>
      <div style={secH}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={ico('#D1FAE5','#059669')}><i className="bi bi-door-open"/></div><span style={{fontSize:14,fontWeight:600}}>Room Check</span></div><span style={{fontSize:11,color:'#6B7280',background:'#F3F4F6',padding:'2px 8px',borderRadius:20,fontWeight:500}}>2 ห้อง</span></div>
      <div style={{padding:'14px 16px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{rooms.map((r,i)=><RoomCard key={i} r={r} onChange={(f,v)=>updR(hotel,i,f,v)}/>)}</div></div>
    </div>
  )

  return(
    <div style={{minHeight:'100vh',background:'#F5F5F5',fontFamily:F}}>
      <AppHeader username={user?.username||''} saving={saving} showBack onLogout={logout}/>
      <div style={{background:'linear-gradient(135deg,#0D4A3A,#0891B2)',borderBottom:'3px solid #0891B2',padding:16}}>
        <div style={{maxWidth:760,margin:'0 auto',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,background:'rgba(8,145,178,0.3)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',border:'1px solid rgba(255,255,255,0.2)',flexShrink:0}}><i className="bi bi-buildings-fill"/></div>
          <div><div style={{fontSize:17,fontWeight:700,color:'#fff'}}>Eastin Tan & U Nimman</div><div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>Chiang Mai — Combined Daily Report</div></div>
        </div>
      </div>

      <div style={{maxWidth:760,margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>

        {showRpt&&(
          <div style={card()}>
            <div style={{background:'#0D4A3A',borderBottom:'3px solid #0891B2',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:14,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:7}}><i className="bi bi-check-circle-fill" style={{color:'#34D399'}}/> บันทึกสำเร็จ</span>
              <div style={{display:'flex',gap:8}}>
                <button onClick={copy} style={{padding:'6px 13px',background:copied?'rgba(5,150,105,0.5)':'rgba(255,255,255,0.12)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:6,fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontFamily:F}}><i className={`bi ${copied?'bi-check2':'bi-clipboard'}`}/>{copied?'Copied!':'Copy'}</button>
                <button onClick={()=>setShowClr(true)} style={{padding:'6px 13px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.75)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:F,display:'flex',alignItems:'center',gap:5}}><i className="bi bi-trash3"/> Clear</button>
              </div>
            </div>
            <div style={{padding:16}}><pre style={{fontFamily:M,fontSize:13,lineHeight:1.85,background:'#F8F8F8',borderRadius:8,padding:14,border:'1px solid #E5E7EB',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{rpt}</pre></div>
            <button onClick={()=>setShowRpt(false)} style={{display:'flex',alignItems:'center',gap:5,margin:'0 16px 16px',padding:'8px 14px',background:'#F3F4F6',border:'1px solid #E5E7EB',borderRadius:7,fontSize:13,color:'#6B7280',cursor:'pointer',fontFamily:F}}><i className="bi bi-arrow-left"/> แก้ไข</button>
          </div>
        )}

        {!showRpt&&(<>
          {/* EASTIN TAN */}
          <div style={{padding:'10px 14px',background:'linear-gradient(135deg,#0D4A3A,#0D9488)',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            <i className="bi bi-building-fill"/> Eastin Tan Hotel
          </div>
          {netSection(ELOCS,'4 จุด',{bg:'#CCFBF1',c:'#0D9488'})}
          {roomSection(data.er,'er')}

          {/* U NIMMAN */}
          <div style={{padding:'10px 14px',background:'linear-gradient(135deg,#1D4ED8,#0891B2)',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:8,marginTop:4}}>
            <i className="bi bi-buildings-fill"/> U Nimman Hotel
          </div>
          {netSection(ULOCS,'3 จุด',{bg:'#DBEAFE',c:'#1D4ED8'})}
          {roomSection(data.ur,'ur')}

          {/* SUBMIT */}
          <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:12,padding:14}}>
            <button onClick={submit} disabled={sub} style={{width:'100%',padding:13,background:'linear-gradient(135deg,#0D9488,#0891B2)',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:sub?'not-allowed':'pointer',opacity:sub?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:F,boxShadow:'0 3px 10px rgba(13,149,136,0.28)'}}>
              <i className="bi bi-send-fill"/>{sub?'กำลังบันทึก...':'ส่ง Daily Report (Eastin + U Nimman)'}
            </button>
          </div>
        </>)}
      </div>

      {showClr&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,padding:20}}>
          <div style={{background:'#fff',borderRadius:14,padding:24,maxWidth:340,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{width:46,height:46,background:'#FEE2E2',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,margin:'0 auto 12px',color:'#DC2626'}}><i className="bi bi-trash3-fill"/></div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>ล้างข้อมูลทั้งหมด?</div>
              <div style={{fontSize:13,color:'#6B7280'}}>ข้อมูลทั้งหมดจะถูกลบออกจาก Server ด้วย</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <button onClick={()=>setShowClr(false)} style={{padding:10,background:'#F3F4F6',border:'1px solid #E5E7EB',borderRadius:8,fontSize:14,cursor:'pointer',fontFamily:F}}>ยกเลิก</button>
              <button onClick={clear} style={{padding:10,background:'#DC2626',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:F}}>ล้างข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
