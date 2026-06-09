'use client'
import { useState } from 'react'
import styles from './page.module.css'
import {
  LOCATION_LABELS, UPS_BUILDINGS,
  NetworkTestData, UpsData, RoomData, ServerRoomData
} from '@/lib/types'
import { runClientSpeedTest } from '@/lib/clientSpeedTest'

/* ───────────────────────── helpers ───────────────────────── */
function formatReport(
  networkTests: NetworkTestData[],
  serverRoom: ServerRoomData,
  upsChecks: UpsData[],
  roomChecks: RoomData[]
): string {
  const today = new Date()
  const dateStr = today.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  })
  const lines: string[] = []
  lines.push(`📋 Daily Report`)
  lines.push(`📅 ${dateStr}`)
  lines.push(`🏨 Travelodge Nimman Chiang Mai`)
  lines.push(`${'─'.repeat(36)}`)
  lines.push('')

  const testedNet = networkTests.filter(n => n.download || n.upload)
  if (testedNet.length > 0) {
    lines.push('🌐 Network')
    for (const n of testedNet) {
      const dl = n.download ? `↓${n.download}` : '↓—'
      const ul = n.upload ? `↑${n.upload}` : '↑—'
      lines.push(`• ${LOCATION_LABELS[n.location]} : ${dl} / ${ul} Mbps${n.remark ? `  (${n.remark})` : ''}`)
    }
    lines.push('')
  }

  const rooms = roomChecks.filter(r => r.roomNumber)
  for (const r of rooms) {
    lines.push(`🚪 Room ${r.roomNumber}`)
    lines.push(`• TV : ${r.tvOk ? 'OK ✓' : 'NG ✗'}`)
    lines.push(`• Tel : ${r.telOk ? 'OK ✓' : 'NG ✗'}`)
    if (r.internetDown || r.internetUp) {
      lines.push(`• Internet : ↓${r.internetDown || '—'} / ↑${r.internetUp || '—'} Mbps`)
    }
    if (r.remark) lines.push(`• Remark : ${r.remark}`)
    lines.push('')
  }

  const ups = upsChecks.filter(u => u.building && (u.backupMin || u.tempC))
  if (ups.length > 0) {
    lines.push('🔋 UPS')
    for (const u of ups) {
      lines.push(`• ${u.building} : Backup ${u.backupMin || '—'} min`)
      if (u.tempC) lines.push(`  Temp : ${u.tempC}°C`)
      if (u.remark) lines.push(`  Remark : ${u.remark}`)
    }
    lines.push('')
  }

  if (serverRoom.tempIn || serverRoom.tempOut || serverRoom.humidity) {
    const h = parseFloat(serverRoom.humidity)
    const comfortLabel = !isNaN(h) ? (h >= 40 && h <= 60 ? 'Comfort' : h < 40 ? 'Dry' : 'Humid') : ''
    lines.push('🖥️ Server Room')
    if (serverRoom.tempIn) lines.push(`• Temp In : ${serverRoom.tempIn}°C`)
    if (serverRoom.tempOut) lines.push(`• Temp Out : ${serverRoom.tempOut}°C`)
    if (serverRoom.humidity) lines.push(`• Humidity : ${serverRoom.humidity}%${comfortLabel ? ` (${comfortLabel})` : ''}`)
    if (serverRoom.remark) lines.push(`• Remark : ${serverRoom.remark}`)
  }

  return lines.join('\n')
}

const defaultNetwork = (): NetworkTestData[] => [
  { location: 'cafe6t6',  download: '', upload: '', remark: '' },
  { location: 'thelodge', download: '', upload: '', remark: '' },
  { location: 'lobby',    download: '', upload: '', remark: '' },
  { location: 'swimgym',  download: '', upload: '', remark: '' },
]
const defaultServerRoom = (): ServerRoomData => ({ tempIn: '', tempOut: '', humidity: '', remark: '' })
const defaultUps = (): UpsData[] => [{ building: 'T1', backupMin: '', tempC: '', remark: '' }]
const defaultRooms = (): RoomData[] => [
  { roomNumber: '', tvOk: false, telOk: false, internetDown: '', internetUp: '', remark: '' },
  { roomNumber: '', tvOk: false, telOk: false, internetDown: '', internetUp: '', remark: '' },
]

/* ─── location dot color ─── */
const LOC_COLORS: Record<string, string> = {
  cafe6t6: '#F59E0B', thelodge: '#10B981', lobby: '#3B82F6', swimgym: '#EC4899'
}
const LOC_ICONS: Record<string, string> = {
  cafe6t6: '☕', thelodge: '🏠', lobby: '🏢', swimgym: '🏊'
}

/* ═══════════════════════ COMPONENT ═══════════════════════ */
export default function HomePage() {
  const [networkTests, setNetworkTests] = useState<NetworkTestData[]>(defaultNetwork())
  const [serverRoom, setServerRoom] = useState<ServerRoomData>(defaultServerRoom())
  const [upsChecks, setUpsChecks] = useState<UpsData[]>(defaultUps())
  const [roomChecks, setRoomChecks] = useState<RoomData[]>(defaultRooms())
  const [reportText, setReportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)

  const today = new Date()
  const dateDisplay = today.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })

  /* ── speed test ── */
  const runSpeedTest = async (index: number) => {
    const updated = [...networkTests]
    updated[index] = { ...updated[index], testing: true, tested: false }
    setNetworkTests(updated)

    try {
      const result = await runClientSpeedTest()

      updated[index] = {
        ...updated[index],
        download: result.download,
        upload: result.upload,
        testing: false,
        tested: true,
      }
    } catch (error) {
      console.error(error)

      updated[index] = {
        ...updated[index],
        testing: false,
        tested: false,
      }

      alert('Speed Test Failed')
    }

    setNetworkTests([...updated])
  }

const runRoomSpeedTest = async (index: number) => {
  const updated = [...roomChecks]

  updated[index] = {
    ...updated[index],
    testingNet: true,
    testedNet: false,
  }

  setRoomChecks(updated)

  try {
    const result = await runClientSpeedTest()

    updated[index] = {
      ...updated[index],
      internetDown: result.download,
      internetUp: result.upload,
      testingNet: false,
      testedNet: true,
    }
  } catch (error) {
    console.error(error)

    updated[index] = {
      ...updated[index],
      testingNet: false,
      testedNet: false,
    }

    alert('Speed Test Failed')
  }

  setRoomChecks([...updated])
}

  /* ── update helpers ── */
  const updateNet = (i: number, f: keyof NetworkTestData, v: string | boolean) =>
    setNetworkTests(arr => { const a = [...arr]; (a[i] as any)[f] = v; return a })
  const updateUps = (i: number, f: keyof UpsData, v: string) =>
    setUpsChecks(arr => { const a = [...arr]; a[i][f] = v; return a })
  const updateRoom = (i: number, f: keyof RoomData, v: string | boolean) =>
    setRoomChecks(arr => { const a = [...arr]; (a[i] as any)[f] = v; return a })

  /* ── submit ── */
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkTests, serverRoom, upsChecks, roomChecks })
      })
      setReportText(formatReport(networkTests, serverRoom, upsChecks, roomChecks))
      setShowReport(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { alert('Error saving report') }
    setSubmitting(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setNetworkTests(defaultNetwork())
    setServerRoom(defaultServerRoom())
    setUpsChecks(defaultUps())
    setRoomChecks(defaultRooms())
    setReportText('')
    setShowReport(false)
    setShowClearModal(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── humidity ── */
  const h = parseFloat(serverRoom.humidity)
  const humidStatus = isNaN(h) ? null :
    h >= 40 && h <= 60 ? { label: 'Comfort', cls: styles.humidComfort } :
    h < 40 ? { label: 'Dry', cls: styles.humidDry } :
    { label: 'Humid', cls: styles.humidHumid }

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className={styles.page}>

      {/* ─ HEADER ─ */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.hotelLogo}>
            <div className={styles.logoMark}>🏨</div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>Travelodge Nimman</span>
              <span className={styles.logoSub}>IT Daily Report System</span>
            </div>
          </div>
          <span className={styles.headerDate}>{dateDisplay}</span>
        </div>
      </header>

      {/* ─ BANNER ─ */}
      <div className={styles.hotelBanner}>
        <div className={styles.bannerCard}>
          <div className={styles.bannerLeft}>
            <div className={styles.bannerTitle}>Daily Report</div>
            <div className={styles.bannerSub}>89 Chonprathan Road, Nimmanhaemin, Chiang Mai</div>
          </div>
          <div className={styles.bannerBadge}>
            <div className={styles.bannerBadgeNum}>413</div>
            <div className={styles.bannerBadgeLabel}>ROOMS</div>
          </div>
        </div>
      </div>

      <main className={styles.main}>

        {/* ════ REPORT OUTPUT ════ */}
        {showReport && (
          <div className={styles.reportWrap}>
            <div className={styles.reportTopBar}>
              <div className={styles.reportTopLeft}>
                <div className={styles.reportSuccessIcon}>✓</div>
                <span className={styles.reportSuccessTitle}>บันทึก Report สำเร็จ</span>
              </div>
              <div className={styles.reportActions}>
                <button
                  className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
                <button className={styles.clearBtn} onClick={() => setShowClearModal(true)}>
                  🗑 Clear
                </button>
              </div>
            </div>
            <div className={styles.reportBody}>
              <pre className={styles.reportPre}>{reportText}</pre>
            </div>
            <button className={styles.backBtn} onClick={() => setShowReport(false)}>
              ← แก้ไข Report
            </button>
          </div>
        )}

        {/* ════ FORM ════ */}
        {!showReport && (<>

        {/* ── NETWORK ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionLeft}>
              <div className={`${styles.sectionIcon} ${styles.iconBlue}`}>🌐</div>
              <span className={styles.sectionTitle}>Network Speed Test</span>
            </div>
            <span className={styles.sectionBadge}>4 จุด</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.netGrid}>
              {networkTests.map((n, i) => (
                <div key={n.location} className={styles.netCard}>
                  <div className={styles.netCardHead}>
                    <span className={styles.netLocLabel}>
                      <span>{LOC_ICONS[n.location]}</span>
                      {LOCATION_LABELS[n.location]}
                    </span>
                    <button
                      onClick={() => runSpeedTest(i)}
                      disabled={n.testing}
                      className={`${styles.testBtn} ${
                        n.testing ? styles.testBtnLoading :
                        n.tested ? styles.testBtnDone : styles.testBtnIdle}`}
                    >
                      {n.testing ? <><span className={styles.spinner}/> กำลังเทส</> :
                       n.tested ? '✓ Done' : '▶ Test'}
                    </button>
                  </div>
                  <div className={styles.netCardBody}>
                    <div className={styles.speedRow}>
                      <div className={styles.speedField}>
                        <span className={`${styles.miniLabel} ${styles.dlLabel}`}>↓ Download</span>
                        <input type="number" step="0.1" placeholder="Mbps"
                          value={n.download} className={styles.speedVal}
                          onChange={e => updateNet(i, 'download', e.target.value)} />
                      </div>
                      <div className={styles.speedField}>
                        <span className={`${styles.miniLabel} ${styles.ulLabel}`}>↑ Upload</span>
                        <input type="number" step="0.1" placeholder="Mbps"
                          value={n.upload} className={styles.speedVal}
                          onChange={e => updateNet(i, 'upload', e.target.value)} />
                      </div>
                    </div>
                    <input type="text" placeholder="Remark..."
                      value={n.remark} className={styles.remarkSm}
                      onChange={e => updateNet(i, 'remark', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SERVER ROOM ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionLeft}>
              <div className={`${styles.sectionIcon} ${styles.iconTeal}`}>🖥️</div>
              <span className={styles.sectionTitle}>Server Room</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>Temp In (°C)</label>
                <input type="number" step="0.1" placeholder="23.5"
                  value={serverRoom.tempIn}
                  onChange={e => setServerRoom({ ...serverRoom, tempIn: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Temp Out (°C)</label>
                <input type="number" step="0.1" placeholder="23.2"
                  value={serverRoom.tempOut}
                  onChange={e => setServerRoom({ ...serverRoom, tempOut: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Humidity (%)
                  {humidStatus && (
                    <span className={`${styles.humidBadge} ${humidStatus.cls}`}>
                      {humidStatus.label}
                    </span>
                  )}
                </label>
                <input type="number" step="1" min="0" max="100" placeholder="59"
                  value={serverRoom.humidity}
                  onChange={e => setServerRoom({ ...serverRoom, humidity: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 10 }} className={styles.field}>
              <label className={styles.label}>Remark</label>
              <textarea placeholder="หมายเหตุ..."
                value={serverRoom.remark}
                onChange={e => setServerRoom({ ...serverRoom, remark: e.target.value })} />
            </div>
          </div>
        </div>

        {/* ── UPS ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionLeft}>
              <div className={`${styles.sectionIcon} ${styles.iconYellow}`}>🔋</div>
              <span className={styles.sectionTitle}>UPS Check</span>
            </div>
            <span className={styles.sectionBadge}>{upsChecks.length} รายการ</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.upsList}>
              {upsChecks.map((u, i) => (
                <div key={i} className={styles.upsCard}>
                  <div className={styles.upsCardHead}>
                    <span className={styles.upsTitle}>⚡ UPS #{i + 1}</span>
                    {upsChecks.length > 1 && (
                      <button className={styles.removeBtn} onClick={() =>
                        setUpsChecks(upsChecks.filter((_, idx) => idx !== i))
                      }>✕</button>
                    )}
                  </div>
                  <div className={styles.upsCardBody}>
                    <div className={styles.grid3}>
                      <div className={styles.field}>
                        <label className={styles.label}>ตึก</label>
                        <select value={u.building} onChange={e => updateUps(i, 'building', e.target.value)}>
                          {UPS_BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Backup (min)</label>
                        <input type="number" placeholder="12"
                          value={u.backupMin} onChange={e => updateUps(i, 'backupMin', e.target.value)} />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Temp (°C)</label>
                        <input type="number" step="0.1" placeholder="32"
                          value={u.tempC} onChange={e => updateUps(i, 'tempC', e.target.value)} />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Remark</label>
                      <input type="text" placeholder="หมายเหตุ..."
                        value={u.remark} onChange={e => updateUps(i, 'remark', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button className={styles.addBtn} onClick={() =>
                setUpsChecks([...upsChecks, { building: 'T1', backupMin: '', tempC: '', remark: '' }])
              }>
                + เพิ่ม UPS
              </button>
            </div>
          </div>
        </div>

        {/* ── ROOM CHECK ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionLeft}>
              <div className={`${styles.sectionIcon} ${styles.iconPurple}`}>🚪</div>
              <span className={styles.sectionTitle}>Room Check</span>
            </div>
            <span className={styles.sectionBadge}>2 ห้อง</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.roomGrid}>
              {roomChecks.map((r, i) => (
                <div key={i} className={styles.roomCard}>
                  <div className={styles.roomCardHead}>
                    <div className={styles.roomNumLabel}>เลขห้อง</div>
                    <input type="text" placeholder="2205"
                      value={r.roomNumber} className={styles.roomNumInput}
                      onChange={e => updateRoom(i, 'roomNumber', e.target.value)} />
                  </div>
                  <div className={styles.roomCardBody}>
                    <div className={styles.toggleRow}>
                      <button
                        className={`${styles.toggleBtn} ${r.tvOk ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => updateRoom(i, 'tvOk', !r.tvOk)}
                      >
                        📺 TV {r.tvOk ? '✓' : '✗'}
                      </button>
                      <button
                        className={`${styles.toggleBtn} ${r.telOk ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => updateRoom(i, 'telOk', !r.telOk)}
                      >
                        📞 Tel {r.telOk ? '✓' : '✗'}
                      </button>
                    </div>

                    <div className={styles.netRoomRow}>
                      <div className={styles.speedField}>
                        <span className={`${styles.miniLabel} ${styles.dlLabel}`}>↓ Internet DL</span>
                        <input type="number" step="0.1" placeholder="Mbps"
                          value={r.internetDown}
                          onChange={e => updateRoom(i, 'internetDown', e.target.value)} />
                      </div>
                      <div className={styles.speedField}>
                        <span className={`${styles.miniLabel} ${styles.ulLabel}`}>↑ Internet UL</span>
                        <input type="number" step="0.1" placeholder="Mbps"
                          value={r.internetUp}
                          onChange={e => updateRoom(i, 'internetUp', e.target.value)} />
                      </div>
                      <button
                        onClick={() => runRoomSpeedTest(i)}
                        disabled={r.testingNet}
                        className={`${styles.testBtnSm} ${
                          r.testingNet ? styles.testBtnLoading :
                          r.testedNet ? styles.testBtnDone : styles.testBtnIdle}`}
                      >
                        {r.testingNet ? <span className={styles.spinner}/> :
                         r.testedNet ? '✓' : '▶'}
                      </button>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Remark</label>
                      <input type="text" placeholder="หมายเหตุ..."
                        value={r.remark}
                        onChange={e => updateRoom(i, 'remark', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <div className={styles.submitBar}>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? '⏳ กำลังบันทึก...' : '📤 ส่ง Daily Report'}
          </button>
        </div>

        </>)}

      </main>

      {/* ════ CLEAR MODAL ════ */}
      {showClearModal && (
        <div className={styles.modalOverlay} onClick={() => setShowClearModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <div className={styles.modalTitle}>ล้างข้อมูลทั้งหมด?</div>
            <div className={styles.modalDesc}>
              ข้อมูล Network, Server Room, UPS และ Room Check ทั้งหมดจะถูกล้าง<br/>
              ไม่สามารถย้อนกลับได้
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.modalCancelBtn} onClick={() => setShowClearModal(false)}>
                ยกเลิก
              </button>
              <button className={styles.modalConfirmBtn} onClick={handleClear}>
                ล้างข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
