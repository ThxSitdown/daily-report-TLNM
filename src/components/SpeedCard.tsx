'use client'
import { useId, useState } from 'react'
import { runSpeedTest, isAutoMeasured, measuredTime, routeWarning, type SpeedMeta, type SpeedPhase } from '@/lib/speedtest'
import { Field } from '@/components/ui'
interface Props { label:string; icon:string; download:string; upload:string; remark:string; meta?:SpeedMeta; onDownload:(v:string)=>void; onUpload:(v:string)=>void; onRemark:(v:string)=>void; onMeta:(m:SpeedMeta)=>void }

export function SpeedCard({ label, icon, download, upload, remark, meta, onDownload, onUpload, onRemark, onMeta }: Props) {
  const [phase, setPhase] = useState<'idle'|SpeedPhase|'done'|'error'>('idle')
  const [live, setLive] = useState<number>()
  const [announce, setAnnounce] = useState('')
  const remarkId = useId()
  const busy = phase==='ping'||phase==='download'||phase==='upload'
  const run = async () => {
    setPhase('ping'); setLive(undefined); setAnnounce(`เริ่มวัดความเร็ว ${label}`)
    try {
      const r = await runSpeedTest((ph, v) => { setPhase(ph); setLive(v) })
      onDownload(String(r.download)); onUpload(String(r.upload)); onMeta(r); setPhase('done')
      setAnnounce(`วัด ${label} เสร็จ ดาวน์โหลด ${r.download} อัปโหลด ${r.upload} เมกะบิตต่อวินาที`)
    } catch { setPhase('error'); setAnnounce(`วัด ${label} ไม่สำเร็จ`) }
  }
  const auto = isAutoMeasured(download, upload, meta)
  const when = auto && meta ? measuredTime(meta) : null
  const warn = auto && meta ? routeWarning(meta) : null
  const btn = busy ? 'btn-secondary' : phase==='error' ? 'btn-danger-soft' : phase==='done' ? 'btn-secondary' : 'btn-primary'
  return (
    <article className="subcard">
      <div className="subcard-header">
        <i className={`bi ${icon}`} style={{ color:'var(--accent)' }} aria-hidden="true"/>
        <h3 className="subcard-title grow">{label}</h3>
        <button type="button" onClick={run} disabled={busy} className={`btn btn-sm ${btn}`}>
          {busy ? <><i className="bi bi-arrow-repeat spin" aria-hidden="true"/><span className="mono">{phase==='ping' ? 'Ping' : `${phase==='download'?'↓':'↑'} ${live ?? '…'}`}</span></>
            : phase==='done' ? <><i className="bi bi-arrow-clockwise" aria-hidden="true"/>วัดใหม่</>
            : phase==='error' ? <><i className="bi bi-arrow-clockwise" aria-hidden="true"/>ลองใหม่</>
            : <><i className="bi bi-play-fill" aria-hidden="true"/>Test</>}
          <span className="sr-only"> {label}</span>
        </button>
      </div>
      {busy && <div className={`progress ${phase==='upload'?'upload':''}`} aria-hidden="true"><span/></div>}
      <div className="subcard-body">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Field label="Download" icon="bi-arrow-down-circle">{id => <input id={id} className="input-metric" type="number" inputMode="decimal" min="0" step="0.1" placeholder="Mbps" value={download} onChange={e=>onDownload(e.target.value)}/>}</Field>
          <Field label="Upload" icon="bi-arrow-up-circle">{id => <input id={id} className="input-metric" type="number" inputMode="decimal" min="0" step="0.1" placeholder="Mbps" value={upload} onChange={e=>onUpload(e.target.value)}/>}</Field>
        </div>

        {phase==='error' && <div className="alert alert-danger" role="alert"><i className="bi bi-exclamation-octagon" aria-hidden="true"/>วัดไม่สำเร็จ ตรวจการเชื่อมต่อแล้วกดลองใหม่</div>}
        {meta && when ? (
          <div className="stack-sm" style={{ gap:2, fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>
            {warn ? <>
              <span className="badge badge-danger" style={{ alignSelf:'flex-start' }}><i className="bi bi-shield-exclamation" aria-hidden="true"/>{warn.short} · {when.label}</span>
              <span style={{ color:'var(--danger)' }}>{warn.long}</span>
            </> : (
              <span className={`badge ${when.today ? 'badge-success' : 'badge-warning'}`} style={{ alignSelf:'flex-start' }}>
                <i className={`bi ${when.today?'bi-patch-check-fill':'bi-exclamation-triangle-fill'}`} aria-hidden="true"/>{when.today?'วัดอัตโนมัติ':'วัดไว้เมื่อ'} {when.label}
              </span>
            )}
            <span className="mono">ping {meta.ping} ms · jitter {meta.jitter} ms</span>
            <span>{[meta.server, meta.isp].filter(Boolean).join(' · ')}</span>
          </div>
        ) : (download||upload) ? (
          <span className="badge badge-neutral" style={{ alignSelf:'flex-start' }}><i className="bi bi-pencil-fill" aria-hidden="true"/>กรอกเอง</span>
        ) : null}

        <label htmlFor={remarkId} className="sr-only">หมายเหตุ {label}</label>
        <input id={remarkId} type="text" placeholder="หมายเหตุ (ถ้ามี)" value={remark} onChange={e=>onRemark(e.target.value)}/>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announce}</span>
    </article>
  )
}
