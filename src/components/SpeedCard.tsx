'use client'
import { runSpeedTest } from '@/lib/speedtest'
import { useState } from 'react'
import s from './SpeedCard.module.css'

interface Props {
  label: string
  icon: string
  download: string
  upload: string
  remark: string
  onDownload: (v: string) => void
  onUpload: (v: string) => void
  onRemark: (v: string) => void
}

export function SpeedCard({ label, icon, download, upload, remark, onDownload, onUpload, onRemark }: Props) {
  const [phase, setPhase] = useState<'idle' | 'download' | 'upload' | 'done' | 'error'>('idle')

  const run = async () => {
    setPhase('download')
    try {
      const r = await runSpeedTest(ph => setPhase(ph as any))
      onDownload(String(r.download))
      onUpload(String(r.upload))
      setPhase('done')
    } catch { setPhase('error') }
  }

  const busy = phase === 'download' || phase === 'upload'

  const btnClass = phase === 'done' ? s.btnDone
    : phase === 'error' ? s.btnError
    : busy ? s.btnBusy : s.btnIdle

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.loc}><i className={`bi ${icon}`}/>{label}</span>
        <button onClick={run} disabled={busy} className={`${s.btn} ${btnClass}`}>
          {busy && <span className={s.spinner}/>}
          {phase === 'download' ? '↓ DL...'
            : phase === 'upload' ? '↑ UL...'
            : phase === 'done' ? '✓ Done'
            : phase === 'error' ? '✕ Retry'
            : '▶ Test'}
        </button>
      </div>
      {busy && <div className={s.progress}><div className={`${s.bar} ${phase === 'upload' ? s.barUp : ''}`}/></div>}
      <div className={s.body}>
        <div className={s.row2}>
          <div className={s.fld}>
            <span className={`${s.mini} ${s.dl}`}><i className="bi bi-arrow-down-circle-fill"/>↓ DL</span>
            <input type="number" step="0.1" placeholder="Mbps" value={download}
              onChange={e => onDownload(e.target.value)} className={s.mono}/>
          </div>
          <div className={s.fld}>
            <span className={`${s.mini} ${s.ul}`}><i className="bi bi-arrow-up-circle-fill"/>↑ UL</span>
            <input type="number" step="0.1" placeholder="Mbps" value={upload}
              onChange={e => onUpload(e.target.value)} className={s.mono}/>
          </div>
        </div>
        <input type="text" placeholder="Remark..." value={remark}
          onChange={e => onRemark(e.target.value)} className={s.rmk}/>
      </div>
    </div>
  )
}
