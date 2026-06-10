'use client'
import { useState } from 'react'
import styles from './page.module.css'
import { runSpeedTest } from '@/lib/speedtest'
import { LOCATION_LABELS, UPS_BUILDINGS, NetworkTestData, UpsData, RoomData, ServerRoomData } from '@/lib/types'

/* ─── logo & hero image URLs from official Travelodge Asia CDN ─── */
const LOGO_URL = 'https://travelodgehotels.asia/_next/image/?url=%2Fassets%2Fimages%2FLOGO-Travelodge-1440x406.png&w=384&q=75'
const HERO_URL = 'https://travelodgehotels.asia/api/media/file/TLNCM_Facade.png'

/* ─── Bootstrap Icons per location ─── */
const LOC_ICONS: Record<string, string> = {
  cafe6t6: 'bi-cup-hot', thelodge: 'bi-house', lobby: 'bi-building', swimgym: 'bi-dribbble'
}

/* ─── format report text ─── */
function formatReport(n: NetworkTestData[], s: ServerRoomData, u: UpsData[], r: RoomData[]): string {
  const d = new Date().toLocaleDateString('th-TH', { year:'numeric',month:'long',day:'numeric',weekday:'long' })
  const lines = [
    '📋 Daily Report',`📅 ${d}`,'🏨 Travelodge Nimman Chiang Mai',
    '─'.repeat(36),''
  ]
  const nets = n.filter(x => x.download || x.upload)
  if (nets.length) {
    lines.push('Network')
    nets.forEach(x => {
      const dl = x.download ? `↓${x.download}` : '↓—'
      const ul = x.upload   ? `↑${x.upload}`   : '↑—'
      lines.push(`• ${LOCATION_LABELS[x.location]} : ${dl} / ${ul} Mbps${x.remark ? `  (${x.remark})` : ''}`)
    })
    lines.push('')
  }
  r.filter(x => x.roomNumber).forEach(x => {
    lines.push(`Room ${x.roomNumber}`)
    lines.push(`• TV : ${x.tvOk ? 'OK' : 'NG'}`)
    lines.push(`• Tel : ${x.telOk ? 'OK' : 'NG'}`)
    if (x.internetDown || x.internetUp)
      lines.push(`• Internet : ↓${x.internetDown||'—'} / ↑${x.internetUp||'—'} Mbps`)
    if (x.remark) lines.push(`• Remark : ${x.remark}`)
    lines.push('')
  })
  const upsF = u.filter(x => x.building && (x.backupMin || x.tempC))
  if (upsF.length) {
    lines.push('UPS')
    upsF.forEach(x => {
      lines.push(`• ${x.building} : Backup ${x.backupMin||'—'} min`)
      if (x.tempC) lines.push(`  Temp : ${x.tempC}°C`)
      if (x.remark) lines.push(`  Remark : ${x.remark}`)
    })
    lines.push('')
  }
  if (s.tempIn || s.tempOut || s.humidity) {
    const h = parseFloat(s.humidity)
    const c = !isNaN(h) ? (h>=40&&h<=60?'Comfort':h<40?'Dry':'Humid') : ''
    lines.push('Server Room')
    if (s.tempIn)   lines.push(`• Temp In : ${s.tempIn}°C`)
    if (s.tempOut)  lines.push(`• Temp Out : ${s.tempOut}°C`)
    if (s.humidity) lines.push(`• Humidity : ${s.humidity}%${c ? ` (${c})` : ''}`)
    if (s.remark)   lines.push(`• Remark : ${s.remark}`)
  }
  return lines.join('\n')
}

const defNet = (): NetworkTestData[] => [
  {location:'cafe6t6', download:'', upload:'', remark:''},
  {location:'thelodge',download:'', upload:'', remark:''},
  {location:'lobby',   download:'', upload:'', remark:''},
  {location:'swimgym', download:'', upload:'', remark:''},
]
const defSrv  = (): ServerRoomData => ({tempIn:'', tempOut:'', humidity:'', remark:''})
const defUps  = (): UpsData[]      => [{building:'T1', backupMin:'', tempC:'', remark:''}]
const defRoom = (): RoomData[]     => [
  {roomNumber:'', tvOk:false, telOk:false, internetDown:'', internetUp:'', remark:''},
  {roomNumber:'', tvOk:false, telOk:false, internetDown:'', internetUp:'', remark:''},
]

export default function HomePage() {
  const [nets,  setNets]  = useState<NetworkTestData[]>(defNet())
  const [srv,   setSrv]   = useState<ServerRoomData>(defSrv())
  const [ups,   setUps]   = useState<UpsData[]>(defUps())
  const [rooms, setRooms] = useState<RoomData[]>(defRoom())
  const [netPhase,  setNetPhase]  = useState(['idle','idle','idle','idle'])
  const [roomPhase, setRoomPhase] = useState(['idle','idle'])
  const [reportTxt, setReportTxt] = useState('')
  const [copied,    setCopied]    = useState(false)
  const [submitting,setSubmitting]= useState(false)
  const [showReport,setShowReport]= useState(false)
  const [showClear, setShowClear] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const dateStr = new Date().toLocaleDateString('th-TH', {weekday:'short', day:'numeric', month:'short'})

  const runNet = async (i: number) => {
    setNetPhase(p => { const a=[...p]; a[i]='download'; return a })
    try {
      const r = await runSpeedTest(ph => setNetPhase(p => { const a=[...p]; a[i]=ph; return a }))
      setNets(arr => { const a=[...arr]; a[i]={...a[i], download:String(r.download), upload:String(r.upload)}; return a })
      setNetPhase(p => { const a=[...p]; a[i]='done'; return a })
    } catch { setNetPhase(p => { const a=[...p]; a[i]='error'; return a }) }
  }

  const runRoomNet = async (i: number) => {
    setRoomPhase(p => { const a=[...p]; a[i]='download'; return a })
    try {
      const r = await runSpeedTest(ph => setRoomPhase(p => { const a=[...p]; a[i]=ph; return a }))
      setRooms(arr => { const a=[...arr]; a[i]={...a[i], internetDown:String(r.download), internetUp:String(r.upload)}; return a })
      setRoomPhase(p => { const a=[...p]; a[i]='done'; return a })
    } catch { setRoomPhase(p => { const a=[...p]; a[i]='error'; return a }) }
  }

  const upN = (i:number, f:keyof NetworkTestData, v:string|boolean) => setNets(a => { const b=[...a]; (b[i] as any)[f]=v; return b })
  const upU = (i:number, f:keyof UpsData, v:string)                  => setUps(a  => { const b=[...a]; b[i][f]=v;         return b })
  const upR = (i:number, f:keyof RoomData, v:string|boolean)         => setRooms(a=> { const b=[...a]; (b[i] as any)[f]=v; return b })

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/reports', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({networkTests:nets, serverRoom:srv, upsChecks:ups, roomChecks:rooms})
      })
      setReportTxt(formatReport(nets, srv, ups, rooms))
      setShowReport(true)
      window.scrollTo({top:0, behavior:'smooth'})
    } catch { alert('Error saving report') }
    setSubmitting(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportTxt)
    setCopied(true); setTimeout(()=>setCopied(false), 2000)
  }

  const handleClear = () => {
    setNets(defNet()); setSrv(defSrv()); setUps(defUps()); setRooms(defRoom())
    setNetPhase(['idle','idle','idle','idle']); setRoomPhase(['idle','idle'])
    setReportTxt(''); setShowReport(false); setShowClear(false)
    window.scrollTo({top:0, behavior:'smooth'})
  }

  const phBtn = (ph:string) => {
    if (ph==='download') return {label:'กำลัง DL...', cls:styles.testBtnLoading}
    if (ph==='upload')   return {label:'กำลัง UL...', cls:styles.testBtnLoading}
    if (ph==='done')     return {label:'Done',         cls:styles.testBtnDone}
    if (ph==='error')    return {label:'Retry',        cls:styles.testBtnError}
    return {label:'Test', cls:styles.testBtnIdle}
  }

  const h = parseFloat(srv.humidity)
  const humid = isNaN(h) ? null :
    h>=40&&h<=60 ? {label:'Comfort', cls:styles.humidComfort} :
    h<40 ? {label:'Dry', cls:styles.humidDry} : {label:'Humid', cls:styles.humidHumid}

  return (
    <div className={styles.page}>

      {/* ══ HEADER ══ */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoWrap}>
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="Travelodge"
                className={styles.logoImg}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className={styles.logoFallback}>
                <div className={styles.logoFallbackMark}>
                  <i className="bi bi-building-fill" />
                </div>
                <div className={styles.logoFallbackText}>
                  <span className={styles.logoFallbackName}>Travelodge Nimman</span>
                  <span className={styles.logoFallbackSub}>IT Daily Report</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.headerRight}>
            <span className={styles.headerDate}>
              <i className="bi bi-calendar3" style={{marginRight:5}} />
              {dateStr}
            </span>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <div className={styles.heroBanner}>
        <img src={HERO_URL} alt="Travelodge Nimman" className={styles.heroBg} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.heroTitle}>IT Daily Report</div>
            <div className={styles.heroSub}>89 Chonprathan Rd, Nimmanhaemin, Chiang Mai 50200</div>
            <div className={styles.heroBadge}>
              <i className="bi bi-shield-check" />
              Travelodge Nimman — 413 Rooms
            </div>
          </div>
        </div>
      </div>

      <main className={styles.main}>

        {/* ══ REPORT VIEW ══ */}
        {showReport && (
          <div className={styles.reportWrap}>
            <div className={styles.reportTopBar}>
              <div className={styles.reportTopLeft}>
                <div className={styles.reportSuccessIcon}>
                  <i className="bi bi-check-lg" />
                </div>
                <span className={styles.reportSuccessTitle}>บันทึก Report สำเร็จ</span>
              </div>
              <div className={styles.reportActions}>
                <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
                  <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className={styles.clearBtn} onClick={() => setShowClear(true)}>
                  <i className="bi bi-trash3" />
                  Clear
                </button>
              </div>
            </div>
            <div className={styles.reportBody}>
              <pre className={styles.reportPre}>{reportTxt}</pre>
            </div>
            <button className={styles.backBtn} onClick={() => setShowReport(false)}>
              <i className="bi bi-arrow-left" /> แก้ไข Report
            </button>
          </div>
        )}

        {/* ══ FORM ══ */}
        {!showReport && (<>

          <div className={styles.infoNote}>
            <i className="bi bi-wifi" />
            <span>Speed test วัดจาก <strong>device นี้</strong> โดยตรง — ค่าที่ได้คือความเร็ว WiFi จริงของพื้นที่</span>
          </div>

          {/* NETWORK */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionLeft}>
                <div className={`${styles.sectionIconBox} ${styles.iconRed}`}>
                  <i className="bi bi-speedometer2" />
                </div>
                <span className={styles.sectionTitle}>Network Speed Test</span>
              </div>
              <span className={styles.sectionBadge}>4 จุด</span>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.netGrid}>
                {nets.map((n,i) => {
                  const btn = phBtn(netPhase[i])
                  const busy = netPhase[i]==='download'||netPhase[i]==='upload'
                  return (
                    <div key={n.location} className={styles.netCard}>
                      <div className={styles.netCardHead}>
                        <span className={styles.netLocLabel}>
                          <i className={`bi ${LOC_ICONS[n.location]}`} />
                          {LOCATION_LABELS[n.location]}
                        </span>
                        <button onClick={()=>runNet(i)} disabled={busy}
                          className={`${styles.testBtn} ${btn.cls}`}>
                          {busy ? <span className={styles.spinner}/> : <i className="bi bi-play-fill" style={{fontSize:11}}/>}
                          {btn.label}
                        </button>
                      </div>
                      {busy && (
                        <div className={styles.progressBar}>
                          <div className={`${styles.progressFill} ${netPhase[i]==='upload'?styles.progressUpload:''}`}/>
                        </div>
                      )}
                      <div className={styles.netCardBody}>
                        <div className={styles.speedRow}>
                          <div className={styles.speedField}>
                            <span className={`${styles.miniLabel} ${styles.dlLabel}`}>
                              <i className="bi bi-arrow-down-circle-fill"/>↓ DL
                            </span>
                            <input type="number" step="0.1" placeholder="Mbps"
                              value={n.download} className={styles.speedVal}
                              onChange={e=>upN(i,'download',e.target.value)}/>
                          </div>
                          <div className={styles.speedField}>
                            <span className={`${styles.miniLabel} ${styles.ulLabel}`}>
                              <i className="bi bi-arrow-up-circle-fill"/>↑ UL
                            </span>
                            <input type="number" step="0.1" placeholder="Mbps"
                              value={n.upload} className={styles.speedVal}
                              onChange={e=>upN(i,'upload',e.target.value)}/>
                          </div>
                        </div>
                        <input type="text" placeholder="Remark..." value={n.remark}
                          className={styles.remarkSm}
                          onChange={e=>upN(i,'remark',e.target.value)}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* SERVER ROOM */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionLeft}>
                <div className={`${styles.sectionIconBox} ${styles.iconBlack}`}>
                  <i className="bi bi-server" />
                </div>
                <span className={styles.sectionTitle}>Server Room</span>
              </div>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label className={styles.label}><i className="bi bi-thermometer-half"/>Temp In (°C)</label>
                  <input type="number" step="0.1" placeholder="23.5" value={srv.tempIn}
                    onChange={e=>setSrv({...srv,tempIn:e.target.value})}/>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}><i className="bi bi-thermometer"/>Temp Out (°C)</label>
                  <input type="number" step="0.1" placeholder="23.2" value={srv.tempOut}
                    onChange={e=>setSrv({...srv,tempOut:e.target.value})}/>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    <i className="bi bi-droplet-half"/>Humidity (%)
                    {humid && <span className={`${styles.humidBadge} ${humid.cls}`}>{humid.label}</span>}
                  </label>
                  <input type="number" step="1" min="0" max="100" placeholder="59" value={srv.humidity}
                    onChange={e=>setSrv({...srv,humidity:e.target.value})}/>
                </div>
              </div>
              <div style={{marginTop:10}} className={styles.field}>
                <label className={styles.label}><i className="bi bi-chat-square-text"/>Remark</label>
                <textarea placeholder="หมายเหตุ..." value={srv.remark}
                  onChange={e=>setSrv({...srv,remark:e.target.value})}/>
              </div>
            </div>
          </div>

          {/* UPS */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionLeft}>
                <div className={`${styles.sectionIconBox} ${styles.iconAmber}`}>
                  <i className="bi bi-battery-charging" />
                </div>
                <span className={styles.sectionTitle}>UPS Check</span>
              </div>
              <span className={styles.sectionBadge}>{ups.length} รายการ</span>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.upsList}>
                {ups.map((u,i) => (
                  <div key={i} className={styles.upsCard}>
                    <div className={styles.upsCardHead}>
                      <span className={styles.upsTitle}>
                        <i className="bi bi-lightning-charge-fill"/>UPS #{i+1}
                      </span>
                      {ups.length > 1 && (
                        <button className={styles.removeBtn}
                          onClick={()=>setUps(ups.filter((_,idx)=>idx!==i))}>
                          <i className="bi bi-x"/>
                        </button>
                      )}
                    </div>
                    <div className={styles.upsCardBody}>
                      <div className={styles.grid3}>
                        <div className={styles.field}>
                          <label className={styles.label}><i className="bi bi-building"/>ตึก</label>
                          <select value={u.building} onChange={e=>upU(i,'building',e.target.value)}>
                            {UPS_BUILDINGS.map(b=><option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}><i className="bi bi-clock-history"/>Backup (min)</label>
                          <input type="number" placeholder="12" value={u.backupMin}
                            onChange={e=>upU(i,'backupMin',e.target.value)}/>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}><i className="bi bi-thermometer"/>Temp (°C)</label>
                          <input type="number" step="0.1" placeholder="32" value={u.tempC}
                            onChange={e=>upU(i,'tempC',e.target.value)}/>
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}><i className="bi bi-chat-square-text"/>Remark</label>
                        <input type="text" placeholder="หมายเหตุ..." value={u.remark}
                          onChange={e=>upU(i,'remark',e.target.value)}/>
                      </div>
                    </div>
                  </div>
                ))}
                <button className={styles.addBtn}
                  onClick={()=>setUps([...ups,{building:'T1',backupMin:'',tempC:'',remark:''}])}>
                  <i className="bi bi-plus-lg" style={{marginRight:5}}/> เพิ่ม UPS
                </button>
              </div>
            </div>
          </div>

          {/* ROOM CHECK */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionLeft}>
                <div className={`${styles.sectionIconBox} ${styles.iconGreen}`}>
                  <i className="bi bi-door-open" />
                </div>
                <span className={styles.sectionTitle}>Room Check</span>
              </div>
              <span className={styles.sectionBadge}>2 ห้อง</span>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.roomGrid}>
                {rooms.map((r,i) => {
                  const btn = phBtn(roomPhase[i])
                  const busy = roomPhase[i]==='download'||roomPhase[i]==='upload'
                  return (
                    <div key={i} className={styles.roomCard}>
                      <div className={styles.roomCardHead}>
                        <div className={styles.roomNumLabel}>
                          <i className="bi bi-hash" style={{marginRight:3}}/>เลขห้อง
                        </div>
                        <input type="text" placeholder="2205" value={r.roomNumber}
                          className={styles.roomNumInput}
                          onChange={e=>upR(i,'roomNumber',e.target.value)}/>
                      </div>
                      <div className={styles.roomCardBody}>
                        <div className={styles.toggleRow}>
                          <button className={`${styles.toggleBtn} ${r.tvOk?styles.toggleOn:styles.toggleOff}`}
                            onClick={()=>upR(i,'tvOk',!r.tvOk)}>
                            <i className={`bi ${r.tvOk?'bi-tv-fill':'bi-tv'}`}/>
                            TV {r.tvOk?'OK':'NG'}
                          </button>
                          <button className={`${styles.toggleBtn} ${r.telOk?styles.toggleOn:styles.toggleOff}`}
                            onClick={()=>upR(i,'telOk',!r.telOk)}>
                            <i className={`bi ${r.telOk?'bi-telephone-fill':'bi-telephone'}`}/>
                            Tel {r.telOk?'OK':'NG'}
                          </button>
                        </div>
                        <div className={styles.netRoomRow}>
                          <div className={styles.speedField}>
                            <span className={`${styles.miniLabel} ${styles.dlLabel}`}>
                              <i className="bi bi-arrow-down-circle-fill"/>↓ DL
                            </span>
                            <input type="number" step="0.1" placeholder="Mbps"
                              value={r.internetDown} onChange={e=>upR(i,'internetDown',e.target.value)}/>
                          </div>
                          <div className={styles.speedField}>
                            <span className={`${styles.miniLabel} ${styles.ulLabel}`}>
                              <i className="bi bi-arrow-up-circle-fill"/>↑ UL
                            </span>
                            <input type="number" step="0.1" placeholder="Mbps"
                              value={r.internetUp} onChange={e=>upR(i,'internetUp',e.target.value)}/>
                          </div>
                          <button onClick={()=>runRoomNet(i)} disabled={busy}
                            className={`${styles.testBtnSm} ${btn.cls}`}>
                            {busy ? <span className={styles.spinner}/> : <i className="bi bi-play-fill"/>}
                          </button>
                        </div>
                        {busy && (
                          <div className={styles.progressBar}>
                            <div className={`${styles.progressFill} ${roomPhase[i]==='upload'?styles.progressUpload:''}`}/>
                          </div>
                        )}
                        <div className={styles.field}>
                          <label className={styles.label}><i className="bi bi-chat-square-text"/>Remark</label>
                          <input type="text" placeholder="หมายเหตุ..." value={r.remark}
                            onChange={e=>upR(i,'remark',e.target.value)}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className={styles.submitBar}>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
              <i className="bi bi-send-fill"/>
              {submitting ? 'กำลังบันทึก...' : 'ส่ง Daily Report'}
            </button>
          </div>

        </>)}
      </main>

      {/* ══ CLEAR MODAL ══ */}
      {showClear && (
        <div className={styles.modalOverlay} onClick={()=>setShowClear(false)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalIcon}><i className="bi bi-trash3-fill"/></div>
            <div className={styles.modalTitle}>ล้างข้อมูลทั้งหมด?</div>
            <div className={styles.modalDesc}>
              ข้อมูล Network, Server Room, UPS และ Room Check ทั้งหมดจะถูกล้าง<br/>ไม่สามารถย้อนกลับได้
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.modalCancelBtn} onClick={()=>setShowClear(false)}>ยกเลิก</button>
              <button className={styles.modalConfirmBtn} onClick={handleClear}>
                <i className="bi bi-trash3" style={{marginRight:5}}/>ล้างข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
