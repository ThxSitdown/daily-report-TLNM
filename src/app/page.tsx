'use client'
// src/app/page.tsx
import { useState } from 'react'
import styles from './page.module.css'
import { LOCATION_LABELS, UPS_BUILDINGS, NetworkTestData, UpsData, RoomData, ServerRoomData, NetworkLocation } from '@/lib/types'

function formatReport(
  networkTests: NetworkTestData[],
  serverRoom: ServerRoomData,
  upsChecks: UpsData[],
  roomChecks: RoomData[]
): string {
  const today = new Date()
  const dateStr = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const lines: string[] = []

  lines.push(`📋 Daily Report — ${dateStr}`)
  lines.push('')

  // Network
  const testedNet = networkTests.filter(n => n.download || n.upload)
  if (testedNet.length > 0) {
    lines.push('🌐 Network')
    for (const n of testedNet) {
      const label = LOCATION_LABELS[n.location]
      lines.push(`• ${label} : ↓${n.download} / ↑${n.upload} Mbps${n.remark ? ` (${n.remark})` : ''}`)
    }
    lines.push('')
  }

  // Room Checks
  const rooms = roomChecks.filter(r => r.roomNumber)
  for (const r of rooms) {
    lines.push(`🚪 Room ${r.roomNumber}`)
    lines.push(`• TV : ${r.tvOk ? 'OK' : 'NG'}`)
    lines.push(`• Tel : ${r.telOk ? 'OK' : 'NG'}`)
    if (r.internetDown || r.internetUp) {
      lines.push(`• Internet : ↓${r.internetDown} / ↑${r.internetUp} Mbps`)
    }
    if (r.remark) lines.push(`• Remark : ${r.remark}`)
    lines.push('')
  }

  // UPS
  const ups = upsChecks.filter(u => u.building)
  if (ups.length > 0) {
    lines.push('🔋 UPS')
    for (const u of ups) {
      lines.push(`• ${u.building} : Backup ${u.backupMin} min`)
      if (u.tempC) lines.push(`  Temp : ${u.tempC}°C`)
      if (u.remark) lines.push(`  Remark : ${u.remark}`)
    }
    lines.push('')
  }

  // Server Room
  if (serverRoom.tempIn || serverRoom.tempOut || serverRoom.humidity) {
    lines.push('🖥️ Server Room')
    if (serverRoom.tempIn) lines.push(`• Temp In : ${serverRoom.tempIn}°C`)
    if (serverRoom.tempOut) lines.push(`• Temp Out : ${serverRoom.tempOut}°C`)
    if (serverRoom.humidity) {
      const hum = parseFloat(serverRoom.humidity)
      const comfort = hum >= 40 && hum <= 60 ? 'Comfort' : hum < 40 ? 'Dry' : 'Humid'
      lines.push(`• Humidity : ${serverRoom.humidity}% (${comfort})`)
    }
    if (serverRoom.remark) lines.push(`• Remark : ${serverRoom.remark}`)
  }

  return lines.join('\n')
}

export default function HomePage() {
  const [networkTests, setNetworkTests] = useState<NetworkTestData[]>([
    { location: 'cafe6t6', download: '', upload: '', remark: '' },
    { location: 'thelodge', download: '', upload: '', remark: '' },
    { location: 'lobby', download: '', upload: '', remark: '' },
    { location: 'swimgym', download: '', upload: '', remark: '' },
  ])
  const [serverRoom, setServerRoom] = useState<ServerRoomData>({ tempIn: '', tempOut: '', humidity: '', remark: '' })
  const [upsChecks, setUpsChecks] = useState<UpsData[]>([
    { building: 'T1', backupMin: '', tempC: '', remark: '' }
  ])
  const [roomChecks, setRoomChecks] = useState<RoomData[]>([
    { roomNumber: '', tvOk: false, telOk: false, internetDown: '', internetUp: '', remark: '' },
    { roomNumber: '', tvOk: false, telOk: false, internetDown: '', internetUp: '', remark: '' },
  ])
  const [reportText, setReportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const runSpeedTest = async (index: number) => {
    const updated = [...networkTests]
    updated[index].testing = true
    updated[index].tested = false
    setNetworkTests([...updated])

    try {
      const res = await fetch('/api/speedtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: networkTests[index].location })
      })
      const data = await res.json()
      updated[index].download = String(data.download)
      updated[index].upload = String(data.upload)
      updated[index].testing = false
      updated[index].tested = true
      setNetworkTests([...updated])
    } catch {
      updated[index].testing = false
      setNetworkTests([...updated])
    }
  }

  const runRoomSpeedTest = async (index: number) => {
    const updated = [...roomChecks]
    updated[index].testingNet = true
    setRoomChecks([...updated])

    try {
      const res = await fetch('/api/speedtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: `room_${updated[index].roomNumber}` })
      })
      const data = await res.json()
      updated[index].internetDown = String(data.download)
      updated[index].internetUp = String(data.upload)
      updated[index].testingNet = false
      updated[index].testedNet = true
      setRoomChecks([...updated])
    } catch {
      updated[index].testingNet = false
      setRoomChecks([...updated])
    }
  }

  const updateNetwork = (i: number, field: keyof NetworkTestData, val: string | boolean) => {
    const arr = [...networkTests]
    ;(arr[i] as any)[field] = val
    setNetworkTests(arr)
  }

  const updateUps = (i: number, field: keyof UpsData, val: string) => {
    const arr = [...upsChecks]
    arr[i][field] = val
    setUpsChecks(arr)
  }

  const updateRoom = (i: number, field: keyof RoomData, val: string | boolean) => {
    const arr = [...roomChecks]
    ;(arr[i] as any)[field] = val
    setRoomChecks(arr)
  }

  const addUps = () => {
    setUpsChecks([...upsChecks, { building: 'T1', backupMin: '', tempC: '', remark: '' }])
  }

  const removeUps = (i: number) => {
    setUpsChecks(upsChecks.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkTests, serverRoom, upsChecks, roomChecks })
      })
      const text = formatReport(networkTests, serverRoom, upsChecks, roomChecks)
      setReportText(text)
      setShowReport(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      alert('Error saving report')
    }
    setSubmitting(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const humidityComfort = () => {
    const h = parseFloat(serverRoom.humidity)
    if (isNaN(h)) return null
    if (h >= 40 && h <= 60) return { label: 'Comfort ✓', color: 'var(--success)' }
    if (h < 40) return { label: 'Dry ↓', color: 'var(--warn)' }
    return { label: 'Humid ↑', color: 'var(--danger)' }
  }

  const humidityStatus = humidityComfort()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerIcon}>📋</div>
          <div>
            <h1 className={styles.title}>Daily Report</h1>
            <p className={styles.subtitle}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      <main className={styles.main}>

        {showReport && (
          <div className={styles.reportBox}>
            <div className={styles.reportHeader}>
              <span className={styles.reportTitle}>✅ Report สำเร็จ</span>
              <button onClick={handleCopy} className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre className={styles.reportText}>{reportText}</pre>
            <button className={styles.newBtn} onClick={() => setShowReport(false)}>
              ← แก้ไข
            </button>
          </div>
        )}

        {!showReport && (
          <>
            {/* ─── NETWORK SECTION ─── */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🌐</span>
                <h2 className={styles.sectionTitle}>Network Speed Test</h2>
              </div>

              <div className={styles.netGrid}>
                {networkTests.map((n, i) => (
                  <div key={n.location} className={styles.netCard}>
                    <div className={styles.netCardTop}>
                      <span className={styles.netLabel}>{LOCATION_LABELS[n.location]}</span>
                      <button
                        className={`${styles.testBtn} ${n.testing ? styles.testing : ''} ${n.tested ? styles.tested : ''}`}
                        onClick={() => runSpeedTest(i)}
                        disabled={n.testing}
                      >
                        {n.testing ? '⏳ Testing...' : n.tested ? '✓ Done' : '▶ Test'}
                      </button>
                    </div>
                    <div className={styles.speedRow}>
                      <div className={styles.speedField}>
                        <label className={styles.smallLabel}>↓ Download (Mbps)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={n.download}
                          onChange={e => updateNetwork(i, 'download', e.target.value)}
                          className={styles.speedInput}
                        />
                      </div>
                      <div className={styles.speedField}>
                        <label className={styles.smallLabel}>↑ Upload (Mbps)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={n.upload}
                          onChange={e => updateNetwork(i, 'upload', e.target.value)}
                          className={styles.speedInput}
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Remark (ถ้ามี)"
                      value={n.remark}
                      onChange={e => updateNetwork(i, 'remark', e.target.value)}
                      className={styles.remarkInput}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ─── SERVER ROOM ─── */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🖥️</span>
                <h2 className={styles.sectionTitle}>Server Room</h2>
              </div>
              <div className={styles.gridThree}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Temp In (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 23.5"
                    value={serverRoom.tempIn}
                    onChange={e => setServerRoom({ ...serverRoom, tempIn: e.target.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Temp Out (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 23.2"
                    value={serverRoom.tempOut}
                    onChange={e => setServerRoom({ ...serverRoom, tempOut: e.target.value })}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Humidity (%)
                    {humidityStatus && (
                      <span className={styles.humidTag} style={{ color: humidityStatus.color }}>
                        {humidityStatus.label}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="เช่น 59"
                    value={serverRoom.humidity}
                    onChange={e => setServerRoom({ ...serverRoom, humidity: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: 10 }}>
                <label className={styles.label}>Remark</label>
                <textarea
                  placeholder="หมายเหตุ..."
                  value={serverRoom.remark}
                  onChange={e => setServerRoom({ ...serverRoom, remark: e.target.value })}
                />
              </div>
            </section>

            {/* ─── UPS ─── */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🔋</span>
                <h2 className={styles.sectionTitle}>UPS Check</h2>
              </div>
              <div className={styles.upsList}>
                {upsChecks.map((u, i) => (
                  <div key={i} className={styles.upsCard}>
                    <div className={styles.upsTop}>
                      <span className={styles.upsNum}>UPS #{i + 1}</span>
                      {upsChecks.length > 1 && (
                        <button className={styles.removeBtn} onClick={() => removeUps(i)}>✕</button>
                      )}
                    </div>
                    <div className={styles.gridThree}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>ตึก</label>
                        <select value={u.building} onChange={e => updateUps(i, 'building', e.target.value)}>
                          {UPS_BUILDINGS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Backup (min)</label>
                        <input
                          type="number"
                          placeholder="เช่น 12"
                          value={u.backupMin}
                          onChange={e => updateUps(i, 'backupMin', e.target.value)}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Temp (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="เช่น 32"
                          value={u.tempC}
                          onChange={e => updateUps(i, 'tempC', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Remark</label>
                      <input
                        type="text"
                        placeholder="หมายเหตุ..."
                        value={u.remark}
                        onChange={e => updateUps(i, 'remark', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <button className={styles.addBtn} onClick={addUps}>
                  + เพิ่ม UPS
                </button>
              </div>
            </section>

            {/* ─── ROOM CHECKS ─── */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🚪</span>
                <h2 className={styles.sectionTitle}>Room Check</h2>
              </div>
              <div className={styles.roomList}>
                {roomChecks.map((r, i) => (
                  <div key={i} className={styles.roomCard}>
                    <div className={styles.roomHeader}>
                      <label className={styles.label}>เลขห้อง</label>
                      <input
                        type="text"
                        placeholder="เช่น 2205"
                        value={r.roomNumber}
                        onChange={e => updateRoom(i, 'roomNumber', e.target.value)}
                        className={styles.roomInput}
                      />
                    </div>

                    <div className={styles.checkRow}>
                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={r.tvOk}
                          onChange={e => updateRoom(i, 'tvOk', e.target.checked)}
                          className={styles.checkbox}
                        />
                        <span className={`${styles.checkText} ${r.tvOk ? styles.checkOk : ''}`}>
                          📺 TV {r.tvOk ? '✓ OK' : '✗ NG'}
                        </span>
                      </label>
                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={r.telOk}
                          onChange={e => updateRoom(i, 'telOk', e.target.checked)}
                          className={styles.checkbox}
                        />
                        <span className={`${styles.checkText} ${r.telOk ? styles.checkOk : ''}`}>
                          📞 Tel {r.telOk ? '✓ OK' : '✗ NG'}
                        </span>
                      </label>
                    </div>

                    <div className={styles.netRoomRow}>
                      <div className={styles.speedField}>
                        <label className={styles.smallLabel}>↓ Internet DL (Mbps)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={r.internetDown}
                          onChange={e => updateRoom(i, 'internetDown', e.target.value)}
                        />
                      </div>
                      <div className={styles.speedField}>
                        <label className={styles.smallLabel}>↑ Internet UL (Mbps)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={r.internetUp}
                          onChange={e => updateRoom(i, 'internetUp', e.target.value)}
                        />
                      </div>
                      <button
                        className={`${styles.testBtnSm} ${r.testingNet ? styles.testing : ''} ${r.testedNet ? styles.tested : ''}`}
                        onClick={() => runRoomSpeedTest(i)}
                        disabled={r.testingNet}
                      >
                        {r.testingNet ? '⏳' : r.testedNet ? '✓' : '▶'}
                      </button>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Remark</label>
                      <input
                        type="text"
                        placeholder="หมายเหตุ..."
                        value={r.remark}
                        onChange={e => updateRoom(i, 'remark', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── SUBMIT ─── */}
            <div className={styles.submitArea}>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '⏳ กำลังบันทึก...' : '📤 ส่ง Report'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
