'use client'
import { useAuth } from '@/lib/useAuth'
import { useDraft } from '@/lib/useDraft'
import { AppHeader } from '@/components/AppHeader'
import { SpeedCard } from '@/components/SpeedCard'
import { UPS_BUILDINGS } from '@/lib/types'
import styles from './page.module.css'
import { useState } from 'react'

const LOCS = [
  { key: 'cafe6t6',  label: 'Cafe 6T6',   icon: 'bi-cup-hot' },
  { key: 'thelodge', label: 'The Lodge',  icon: 'bi-house' },
  { key: 'lobby',    label: 'Lobby',      icon: 'bi-building' },
  { key: 'swimgym',  label: 'Swim & Gym', icon: 'bi-dribbble' },
]

interface NetItem  { download: string; upload: string; remark: string }
interface UpsItem  { building: string; backupMin: string; tempC: string; remark: string }
interface RoomItem { roomNumber: string; tvOk: boolean; telOk: boolean; internetDown: string; internetUp: string; remark: string }
interface SrvRoom  { tempIn: string; tempOut: string; humidity: string; remark: string }

interface FormData {
  nets: Record<string, NetItem>
  srv: SrvRoom
  ups: UpsItem[]
  rooms: RoomItem[]
}

const defaultData = (): FormData => ({
  nets: Object.fromEntries(LOCS.map(l => [l.key, { download: '', upload: '', remark: '' }])),
  srv: { tempIn: '', tempOut: '', humidity: '', remark: '' },
  ups: [{ building: 'T1', backupMin: '', tempC: '', remark: '' }],
  rooms: [
    { roomNumber: '', tvOk: false, telOk: false, internetDown: '', internetUp: '', remark: '' },
    { roomNumber: '', tvOk: false, telOk: false, internetDown: '', internetUp: '', remark: '' },
  ]
})

function humidStatus(h: string) {
  const v = parseFloat(h)
  if (isNaN(v)) return null
  if (v >= 40 && v <= 60) return { label: 'Comfort', color: '#059669', bg: '#D1FAE5' }
  if (v < 40) return { label: 'Dry', color: '#D97706', bg: '#FEF3C7' }
  return { label: 'Humid', color: '#DC2626', bg: '#FEE2E2' }
}

function formatReport(d: FormData): string {
  const date = new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric', weekday:'long' })
  const lines = ['📋 Daily Report', `📅 ${date}`, '🏨 Travelodge Nimman Chiang Mai', '─'.repeat(36), '']
  const nets = LOCS.filter(l => d.nets[l.key]?.download || d.nets[l.key]?.upload)
  if (nets.length) {
    lines.push('🌐 Network')
    nets.forEach(l => {
      const n = d.nets[l.key]
      lines.push(`• ${l.label} : ↓${n.download||'—'} / ↑${n.upload||'—'} Mbps${n.remark ? `  (${n.remark})` : ''}`)
    })
    lines.push('')
  }
  d.rooms.filter(r => r.roomNumber).forEach(r => {
    lines.push(`🚪 Room ${r.roomNumber}`)
    lines.push(`• TV : ${r.tvOk ? 'OK' : 'NG'}`)
    lines.push(`• Tel : ${r.telOk ? 'OK' : 'NG'}`)
    if (r.internetDown || r.internetUp) lines.push(`• Internet : ↓${r.internetDown||'—'} / ↑${r.internetUp||'—'} Mbps`)
    if (r.remark) lines.push(`• Remark : ${r.remark}`)
    lines.push('')
  })
  const ups = d.ups.filter(u => u.building && (u.backupMin || u.tempC))
  if (ups.length) {
    lines.push('🔋 UPS')
    ups.forEach(u => {
      lines.push(`• ${u.building} : Backup ${u.backupMin||'—'} min`)
      if (u.tempC) lines.push(`  Temp : ${u.tempC}°C`)
      if (u.remark) lines.push(`  Remark : ${u.remark}`)
    })
    lines.push('')
  }
  const { srv } = d
  if (srv.tempIn || srv.tempOut || srv.humidity) {
    const v = parseFloat(srv.humidity); const c = !isNaN(v) ? (v>=40&&v<=60?'Comfort':v<40?'Dry':'Humid') : ''
    lines.push('🖥️ Server Room')
    if (srv.tempIn) lines.push(`• Temp In : ${srv.tempIn}°C`)
    if (srv.tempOut) lines.push(`• Temp Out : ${srv.tempOut}°C`)
    if (srv.humidity) lines.push(`• Humidity : ${srv.humidity}%${c ? ` (${c})` : ''}`)
    if (srv.remark) lines.push(`• Remark : ${srv.remark}`)
  }
  return lines.join('\n')
}

export default function TravelodgePage() {
  const { user, loading, logout } = useAuth()
  const { data, setData, loaded, saving, clearDraft } = useDraft<FormData>('travelodge', defaultData())
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

  const upd = (patch: Partial<FormData>) => setData(p => ({ ...p, ...patch }))
  const updNet = (key: string, f: keyof NetItem, v: string) =>
    setData(p => ({ ...p, nets: { ...p.nets, [key]: { ...p.nets[key], [f]: v } } }))
  const updRoom = (i: number, f: keyof RoomItem, v: string | boolean) =>
    setData(p => { const r = [...p.rooms]; (r[i] as any)[f] = v; return { ...p, rooms: r } })
  const updUps = (i: number, f: keyof UpsItem, v: string) =>
    setData(p => { const u = [...p.ups]; u[i][f] = v; return { ...p, ups: u } })

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelType:'travelodge', networkTests: LOCS.map(l => ({ location: l.key, ...data.nets[l.key] })), serverRoom: data.srv, upsChecks: data.ups, roomChecks: data.rooms })
      })
      setReportText(formatReport(data))
      setShowReport(true)
    } catch { alert('Error saving') }
    setSubmitting(false)
  }

  const handleCopy = async () => { await navigator.clipboard.writeText(reportText); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const handleClear = async () => {
    await clearDraft()
    setData(defaultData())
    setShowReport(false)
    setShowClear(false)
  }

  const hum = humidStatus(data.srv.humidity)

  return (
    <div style={{ minHeight:'100vh', background:'#F5F5F5', fontFamily:'Prompt, sans-serif' }}>
      <AppHeader username={user?.username || ''} saving={saving} showBack onLogout={logout}/>

      {/* Hotel Header */}
      <div style={{ background:'#111', borderBottom:'3px solid #C8102E', padding:'16px', position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:740, margin:'0 auto', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, background:'#C8102E', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', flexShrink:0 }}>
            <i className="bi bi-building-fill"/>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Travelodge Nimman</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>89 Chonprathan Rd, Nimmanhaemin, Chiang Mai</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:740, margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Report view */}
        {showReport && (
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
            <div style={{ background:'#111', borderBottom:'3px solid #C8102E', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:7 }}>
                <i className="bi bi-check-circle-fill" style={{ color:'#34D399' }}/> บันทึกสำเร็จ
              </span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleCopy} style={{ padding:'6px 13px', background: copied ? 'rgba(5,150,105,0.5)' : 'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:'inherit' }}>
                  <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`}/>{copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setShowClear(true)} style={{ padding:'6px 13px', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                  <i className="bi bi-trash3"/> Clear
                </button>
              </div>
            </div>
            <div style={{ padding:16 }}>
              <pre style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:13, lineHeight:1.85, background:'#F8F8F8', borderRadius:8, padding:14, border:'1px solid #E5E7EB', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{reportText}</pre>
            </div>
            <button onClick={() => setShowReport(false)} style={{ display:'flex', alignItems:'center', gap:5, margin:'0 16px 16px', padding:'8px 14px', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:7, fontSize:13, color:'#6B7280', cursor:'pointer', fontFamily:'inherit' }}>
              <i className="bi bi-arrow-left"/> แก้ไข
            </button>
          </div>
        )}

        {!showReport && (<>

          {/* NETWORK */}
          <div className={styles.section}>
            <div className={styles.secHead}>
              <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoRed}`}><i className="bi bi-speedometer2"/></div><span className={styles.secTitle}>Network Speed Test</span></div>
              <span className={styles.badge}>4 จุด</span>
            </div>
            <div className={styles.secBody}>
              <div className={styles.netGrid}>
                {LOCS.map(l => (
                  <SpeedCard key={l.key} label={l.label} icon={l.icon}
                    download={data.nets[l.key]?.download || ''} upload={data.nets[l.key]?.upload || ''} remark={data.nets[l.key]?.remark || ''}
                    onDownload={v => updNet(l.key, 'download', v)} onUpload={v => updNet(l.key, 'upload', v)} onRemark={v => updNet(l.key, 'remark', v)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* SERVER ROOM */}
          <div className={styles.section}>
            <div className={styles.secHead}>
              <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoGray}`}><i className="bi bi-server"/></div><span className={styles.secTitle}>Server Room</span></div>
            </div>
            <div className={styles.secBody}>
              <div className={styles.g3}>
                <div className={styles.fld}><label className={styles.lbl}><i className="bi bi-thermometer-half"/>Temp In (°C)</label><input type="number" step="0.1" placeholder="23.5" value={data.srv.tempIn} onChange={e => upd({ srv: { ...data.srv, tempIn: e.target.value } })}/></div>
                <div className={styles.fld}><label className={styles.lbl}><i className="bi bi-thermometer"/>Temp Out (°C)</label><input type="number" step="0.1" placeholder="23.2" value={data.srv.tempOut} onChange={e => upd({ srv: { ...data.srv, tempOut: e.target.value } })}/></div>
                <div className={styles.fld}>
                  <label className={styles.lbl}><i className="bi bi-droplet-half"/>Humidity (%)
                    {hum && <span style={{ fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:20, background:hum.bg, color:hum.color, marginLeft:4 }}>{hum.label}</span>}
                  </label>
                  <input type="number" min="0" max="100" placeholder="59" value={data.srv.humidity} onChange={e => upd({ srv: { ...data.srv, humidity: e.target.value } })}/>
                </div>
              </div>
              <div className={styles.fld} style={{ marginTop:10 }}><label className={styles.lbl}><i className="bi bi-chat-square-text"/>Remark</label><textarea placeholder="หมายเหตุ..." value={data.srv.remark} onChange={e => upd({ srv: { ...data.srv, remark: e.target.value } })}/></div>
            </div>
          </div>

          {/* UPS */}
          <div className={styles.section}>
            <div className={styles.secHead}>
              <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoAmber}`}><i className="bi bi-battery-charging"/></div><span className={styles.secTitle}>UPS Check</span></div>
              <span className={styles.badge}>{data.ups.length} รายการ</span>
            </div>
            <div className={styles.secBody}>
              {data.ups.map((u, i) => (
                <div key={i} className={styles.upsCard}>
                  <div className={styles.upsHead}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff', display:'flex', alignItems:'center', gap:6 }}>
                      <i className="bi bi-lightning-charge-fill" style={{ color:'#FACC15' }}/>UPS #{i+1}
                    </span>
                    {data.ups.length > 1 && <button className={styles.rmBtn} onClick={() => setData(p => ({ ...p, ups: p.ups.filter((_,j)=>j!==i) }))}><i className="bi bi-x"/></button>}
                  </div>
                  <div className={styles.upsBody}>
                    <div className={styles.g3}>
                      <div className={styles.fld}><label className={styles.lbl}><i className="bi bi-building"/>ตึก</label>
                        <select value={u.building} onChange={e => updUps(i,'building',e.target.value)}>{UPS_BUILDINGS.map(b=><option key={b}>{b}</option>)}</select>
                      </div>
                      <div className={styles.fld}><label className={styles.lbl}><i className="bi bi-clock-history"/>Backup (min)</label><input type="number" placeholder="12" value={u.backupMin} onChange={e=>updUps(i,'backupMin',e.target.value)}/></div>
                      <div className={styles.fld}><label className={styles.lbl}><i className="bi bi-thermometer"/>Temp (°C)</label><input type="number" step="0.1" placeholder="32" value={u.tempC} onChange={e=>updUps(i,'tempC',e.target.value)}/></div>
                    </div>
                    <div className={styles.fld}><label className={styles.lbl}><i className="bi bi-chat-square-text"/>Remark</label><input type="text" placeholder="หมายเหตุ..." value={u.remark} onChange={e=>updUps(i,'remark',e.target.value)}/></div>
                  </div>
                </div>
              ))}
              <button className={styles.addBtn} onClick={() => setData(p => ({ ...p, ups:[...p.ups,{building:'T1',backupMin:'',tempC:'',remark:''}] }))}>
                <i className="bi bi-plus-lg"/> เพิ่ม UPS
              </button>
            </div>
          </div>

          {/* ROOMS */}
          <div className={styles.section}>
            <div className={styles.secHead}>
              <div className={styles.secLeft}><div className={`${styles.ico} ${styles.icoGreen}`}><i className="bi bi-door-open"/></div><span className={styles.secTitle}>Room Check</span></div>
              <span className={styles.badge}>2 ห้อง</span>
            </div>
            <div className={styles.secBody}>
              <div className={styles.roomGrid}>
                {data.rooms.map((r, i) => (
                  <div key={i} className={styles.roomCard}>
                    <div className={styles.roomHead}>
                      <div style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}># เลขห้อง</div>
                      <input type="text" placeholder="2205" value={r.roomNumber} onChange={e=>updRoom(i,'roomNumber',e.target.value)}
                        style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:22, fontWeight:600, letterSpacing:4, textAlign:'center', color:'#fff', background:'transparent', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:7, padding:'6px', width:'100%', outline:'none' }}/>
                    </div>
                    <div className={styles.roomBody}>
                      <div style={{ display:'flex', gap:8 }}>
                        {(['tvOk','telOk'] as const).map(k => (
                          <button key={k} onClick={()=>updRoom(i,k,!r[k])} style={{ flex:1, padding:'8px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontFamily:'inherit',
                            background: r[k] ? '#D1FAE5' : '#FEE2E2', color: r[k] ? '#059669' : '#DC2626', borderColor: r[k] ? '#A7F3D0' : '#FECACA'
                          }}>
                            <i className={`bi ${k==='tvOk' ? (r[k]?'bi-tv-fill':'bi-tv') : (r[k]?'bi-telephone-fill':'bi-telephone')}`}/>
                            {k==='tvOk'?'TV':'Tel'} {r[k]?'OK':'NG'}
                          </button>
                        ))}
                      </div>
                      <SpeedCard label={`Internet ห้อง ${r.roomNumber||'—'}`} icon="bi-wifi"
                        download={r.internetDown} upload={r.internetUp} remark={r.remark}
                        onDownload={v=>updRoom(i,'internetDown',v)} onUpload={v=>updRoom(i,'internetUp',v)} onRemark={v=>updRoom(i,'remark',v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className={styles.submitBar}>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
              <i className="bi bi-send-fill"/>{submitting ? 'กำลังบันทึก...' : 'ส่ง Daily Report'}
            </button>
          </div>
        </>)}
      </div>

      {/* CLEAR MODAL */}
      {showClear && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, maxWidth:340, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ width:46, height:46, background:'#FEE2E2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, margin:'0 auto 12px', color:'#DC2626' }}>
                <i className="bi bi-trash3-fill"/>
              </div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>ล้างข้อมูลทั้งหมด?</div>
              <div style={{ fontSize:13, color:'#6B7280' }}>ข้อมูลทั้งหมดจะถูกลบออกจาก Server ด้วย</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button onClick={() => setShowClear(false)} style={{ padding:10, background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:8, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>ยกเลิก</button>
              <button onClick={handleClear} style={{ padding:10, background:'#DC2626', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>ล้างข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
