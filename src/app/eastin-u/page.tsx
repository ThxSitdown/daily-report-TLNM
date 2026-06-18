'use client'
import { useAuth } from '@/lib/useAuth'
import { useDraft } from '@/lib/useDraft'
import { AppHeader } from '@/components/AppHeader'
import { SpeedCard } from '@/components/SpeedCard'
import styles from './page.module.css'
import { useState } from 'react'

const EASTIN_LOCS = [
  { key:'eastin_lobby',  label:'Lobby',        icon:'bi-building' },
  { key:'eastin_tstation',label:'T Station',   icon:'bi-train-front' },
  { key:'eastin_cafe',   label:'Cafe',          icon:'bi-cup-hot' },
  { key:'eastin_pool',   label:'Swimming Pool', icon:'bi-water' },
]
const UNIM_LOCS = [
  { key:'unim_lobby',    label:'Lobby',         icon:'bi-building' },
  { key:'unim_eatat',   label:'Eat@',           icon:'bi-fork-knife' },
  { key:'unim_poolbar',  label:'Pool Bar',       icon:'bi-cup-straw' },
]
const ALL_LOCS = [...EASTIN_LOCS, ...UNIM_LOCS]

interface NetItem  { download:string; upload:string; remark:string }
interface RoomItem { roomNumber:string; tvOk:boolean; telOk:boolean; internetDown:string; internetUp:string; remark:string }
interface FormData {
  nets: Record<string,NetItem>
  eastinRooms: RoomItem[]
  unimRooms: RoomItem[]
}

const defRoom = ():RoomItem => ({ roomNumber:'', tvOk:false, telOk:false, internetDown:'', internetUp:'', remark:'' })
const defaultData = ():FormData => ({
  nets: Object.fromEntries(ALL_LOCS.map(l=>[l.key,{download:'',upload:'',remark:''}])),
  eastinRooms: [defRoom(), defRoom()],
  unimRooms: [defRoom(), defRoom()],
})

function formatReport(d: FormData): string {
  const date = new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric',weekday:'long'})
  const lines = ['📋 Daily Report', `📅 ${date}`, '🏨 Eastin Tan & U Nimman Chiang Mai', '─'.repeat(36),'']

  lines.push('═══ EASTIN TAN HOTEL ═══','')
  const en = EASTIN_LOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if (en.length) {
    lines.push('🌐 Network')
    en.forEach(l=>{ const n=d.nets[l.key]; lines.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${n.remark?`  (${n.remark})`:''}`) })
    lines.push('')
  }
  d.eastinRooms.filter(r=>r.roomNumber).forEach(r=>{
    lines.push(`🚪 Room ${r.roomNumber}`)
    lines.push(`• TV : ${r.tvOk?'OK':'NG'}`)
    lines.push(`• Tel : ${r.telOk?'OK':'NG'}`)
    if (r.internetDown||r.internetUp) lines.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps`)
    if (r.remark) lines.push(`• Remark : ${r.remark}`)
    lines.push('')
  })

  lines.push('═══ U NIMMAN HOTEL ═══','')
  const un = UNIM_LOCS.filter(l=>d.nets[l.key]?.download||d.nets[l.key]?.upload)
  if (un.length) {
    lines.push('🌐 Network')
    un.forEach(l=>{ const n=d.nets[l.key]; lines.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${n.remark?`  (${n.remark})`:''}`) })
    lines.push('')
  }
  d.unimRooms.filter(r=>r.roomNumber).forEach(r=>{
    lines.push(`🚪 Room ${r.roomNumber}`)
    lines.push(`• TV : ${r.tvOk?'OK':'NG'}`)
    lines.push(`• Tel : ${r.telOk?'OK':'NG'}`)
    if (r.internetDown||r.internetUp) lines.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps`)
    if (r.remark) lines.push(`• Remark : ${r.remark}`)
    lines.push('')
  })
  return lines.join('\n')
}

function RoomCard({ r, i, onUpdate }: { r:RoomItem; i:number; onUpdate:(f:keyof RoomItem,v:string|boolean)=>void }) {
  return (
    <div className={styles.roomCard}>
      <div className={styles.roomHead}>
        <div style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}># เลขห้อง</div>
        <input type="text" placeholder="XXX" value={r.roomNumber} onChange={e=>onUpdate('roomNumber',e.target.value)}
          style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:22, fontWeight:600, letterSpacing:4, textAlign:'center', color:'#fff', background:'transparent', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:7, padding:'6px', width:'100%', outline:'none' }}/>
      </div>
      <div className={styles.roomBody}>
        <div style={{ display:'flex', gap:8 }}>
          {(['tvOk','telOk'] as const).map(k=>(
            <button key={k} onClick={()=>onUpdate(k,!r[k])} style={{ flex:1, padding:'8px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontFamily:'inherit',
              background:r[k]?'#D1FAE5':'#FEE2E2', color:r[k]?'#059669':'#DC2626', borderColor:r[k]?'#A7F3D0':'#FECACA'
            }}>
              <i className={`bi ${k==='tvOk'?(r[k]?'bi-tv-fill':'bi-tv'):(r[k]?'bi-telephone-fill':'bi-telephone')}`}/>
              {k==='tvOk'?'TV':'Tel'} {r[k]?'OK':'NG'}
            </button>
          ))}
        </div>
        <SpeedCard label={`Internet ห้อง ${r.roomNumber||'—'}`} icon="bi-wifi"
          download={r.internetDown} upload={r.internetUp} remark={r.remark}
          onDownload={v=>onUpdate('internetDown',v)} onUpload={v=>onUpdate('internetUp',v)} onRemark={v=>onUpdate('remark',v)}
        />
      </div>
    </div>
  )
}

export default function EastinUPage() {
  const { user, loading, logout } = useAuth()
  const { data, setData, loaded, saving, clearDraft } = useDraft<FormData>('eastin-u', defaultData())
  const [showReport, setShowReport] = useState(false)
  const [reportText, setReportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (loading || !loaded) return (
    <div style={{ minHeight:'100vh', background:'#F5F5F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#6B7280' }}>กำลังโหลดข้อมูล...</span>
    </div>
  )

  const updNet = (key:string, f:keyof NetItem, v:string) =>
    setData(p=>({...p, nets:{...p.nets,[key]:{...p.nets[key],[f]:v}}}))
  const updRoom = (hotel:'eastinRooms'|'unimRooms', i:number, f:keyof RoomItem, v:string|boolean) =>
    setData(p=>{ const r=[...p[hotel]]; (r[i] as any)[f]=v; return {...p,[hotel]:r} })

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/reports', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ hotelType:'eastin-u', networkTests: ALL_LOCS.map(l=>({location:l.key,...data.nets[l.key]})), roomChecks:[...data.eastinRooms,...data.unimRooms] })
      })
      setReportText(formatReport(data))
      setShowReport(true)
    } catch { alert('Error') }
    setSubmitting(false)
  }

  const handleCopy = async () => { await navigator.clipboard.writeText(reportText); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  const handleClear = async () => { await clearDraft(); setData(defaultData()); setShowReport(false); setShowClear(false) }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F5F5', fontFamily:'Prompt,sans-serif' }}>
      <AppHeader username={user?.username||''} saving={saving} showBack onLogout={logout}/>

      {/* Hotel Header */}
      <div style={{ background:'linear-gradient(135deg,#0D4A3A,#0891B2)', borderBottom:'3px solid #0891B2', padding:'16px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, background:'rgba(8,145,178,0.3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
            <i className="bi bi-buildings-fill"/>
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'#fff' }}>Eastin Tan & U Nimman</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Chiang Mai — Combined Daily Report</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>

        {showReport && (
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
            <div style={{ background:'#0D4A3A', borderBottom:'3px solid #0891B2', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:7 }}>
                <i className="bi bi-check-circle-fill" style={{ color:'#34D399' }}/> บันทึกสำเร็จ
              </span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleCopy} style={{ padding:'6px 13px', background:copied?'rgba(5,150,105,0.5)':'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:'inherit' }}>
                  <i className={`bi ${copied?'bi-check2':'bi-clipboard'}`}/>{copied?'Copied!':'Copy'}
                </button>
                <button onClick={()=>setShowClear(true)} style={{ padding:'6px 13px', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                  <i className="bi bi-trash3"/> Clear
                </button>
              </div>
            </div>
            <div style={{ padding:16 }}>
              <pre style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:13, lineHeight:1.85, background:'#F8F8F8', borderRadius:8, padding:14, border:'1px solid #E5E7EB', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{reportText}</pre>
            </div>
            <button onClick={()=>setShowReport(false)} style={{ display:'flex', alignItems:'center', gap:5, margin:'0 16px 16px', padding:'8px 14px', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:7, fontSize:13, color:'#6B7280', cursor:'pointer', fontFamily:'inherit' }}>
              <i className="bi bi-arrow-left"/> แก้ไข
            </button>
          </div>
        )}

        {!showReport && (<>

          {/* ══ EASTIN TAN ══ */}
          <div className={styles.hotelBlock} style={{ '--accent':'#0D9488' } as any}>
            <div className={styles.hotelLabel} style={{ background:'linear-gradient(135deg,#0D4A3A,#0D9488)' }}>
              <i className="bi bi-building-fill"/> Eastin Tan Hotel
            </div>

            <div className={styles.section}>
              <div className={styles.secHead}>
                <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoTeal}`}><i className="bi bi-speedometer2"/></div><span className={styles.secTitle}>Network Speed Test</span></div>
                <span className={styles.badge}>4 จุด</span>
              </div>
              <div className={styles.secBody}>
                <div className={styles.netGrid}>
                  {EASTIN_LOCS.map(l=>(
                    <SpeedCard key={l.key} label={l.label} icon={l.icon}
                      download={data.nets[l.key]?.download||''} upload={data.nets[l.key]?.upload||''} remark={data.nets[l.key]?.remark||''}
                      onDownload={v=>updNet(l.key,'download',v)} onUpload={v=>updNet(l.key,'upload',v)} onRemark={v=>updNet(l.key,'remark',v)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.secHead}>
                <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoGreen}`}><i className="bi bi-door-open"/></div><span className={styles.secTitle}>Room Check</span></div>
                <span className={styles.badge}>2 ห้อง</span>
              </div>
              <div className={styles.secBody}>
                <div className={styles.roomGrid}>
                  {data.eastinRooms.map((r,i)=>(
                    <RoomCard key={i} r={r} i={i} onUpdate={(f,v)=>updRoom('eastinRooms',i,f,v)}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══ U NIMMAN ══ */}
          <div className={styles.hotelBlock}>
            <div className={styles.hotelLabel} style={{ background:'linear-gradient(135deg,#1D4ED8,#0891B2)' }}>
              <i className="bi bi-buildings-fill"/> U Nimman Hotel
            </div>

            <div className={styles.section}>
              <div className={styles.secHead}>
                <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoBlue}`}><i className="bi bi-speedometer2"/></div><span className={styles.secTitle}>Network Speed Test</span></div>
                <span className={styles.badge}>3 จุด</span>
              </div>
              <div className={styles.secBody}>
                <div className={styles.netGrid}>
                  {UNIM_LOCS.map(l=>(
                    <SpeedCard key={l.key} label={l.label} icon={l.icon}
                      download={data.nets[l.key]?.download||''} upload={data.nets[l.key]?.upload||''} remark={data.nets[l.key]?.remark||''}
                      onDownload={v=>updNet(l.key,'download',v)} onUpload={v=>updNet(l.key,'upload',v)} onRemark={v=>updNet(l.key,'remark',v)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.secHead}>
                <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoGreen}`}><i className="bi bi-door-open"/></div><span className={styles.secTitle}>Room Check</span></div>
                <span className={styles.badge}>2 ห้อง</span>
              </div>
              <div className={styles.secBody}>
                <div className={styles.roomGrid}>
                  {data.unimRooms.map((r,i)=>(
                    <RoomCard key={i} r={r} i={i} onUpdate={(f,v)=>updRoom('unimRooms',i,f,v)}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className={styles.submitBar}>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting} style={{ background:'linear-gradient(135deg,#0D9488,#0891B2)', boxShadow:'0 3px 10px rgba(13,149,136,0.28)' }}>
              <i className="bi bi-send-fill"/>{submitting?'กำลังบันทึก...':'ส่ง Daily Report (Eastin + U Nimman)'}
            </button>
          </div>
        </>)}
      </div>

      {showClear && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, maxWidth:340, width:'100%' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ width:46, height:46, background:'#FEE2E2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, margin:'0 auto 12px', color:'#DC2626' }}><i className="bi bi-trash3-fill"/></div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>ล้างข้อมูลทั้งหมด?</div>
              <div style={{ fontSize:13, color:'#6B7280' }}>ข้อมูลทั้งหมดจะถูกลบออกจาก Server ด้วย</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button onClick={()=>setShowClear(false)} style={{ padding:10, background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:8, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>ยกเลิก</button>
              <button onClick={handleClear} style={{ padding:10, background:'#DC2626', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>ล้างข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
