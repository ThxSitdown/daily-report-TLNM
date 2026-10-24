'use client'
import { useEffect, useId, useState } from 'react'
import { runSpeedTest, isAutoMeasured, measuredTime, routeWarning, apSummary, AP_BANDS, AP_SIGNALS, type SpeedMeta, type SpeedPhase, type ApInfo } from '@/lib/speedtest'
import { Field } from '@/components/ui'
interface Props { label:string; icon:string; download:string; upload:string; remark:string; meta?:SpeedMeta; ap?:ApInfo; onDownload:(v:string)=>void; onUpload:(v:string)=>void; onRemark:(v:string)=>void; onMeta:(m:SpeedMeta)=>void; onAp:(a:ApInfo)=>void }

// ชื่อ AP / SSID ที่เคยกรอก จำไว้ในเครื่องให้เลือกซ้ำได้เร็ว
const loadList = (k:string):string[] => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const remember = (k:string, v?:string) => { const s = v?.trim(); if (!s) return; try { localStorage.setItem(k, JSON.stringify([s, ...loadList(k).filter(x => x !== s)].slice(0, 30))) } catch { /* ok */ } }

function ApFields({ ap, onAp }:{ ap?:ApInfo; onAp:(a:ApInfo)=>void }) {
  const id = useId()
  const [names, setNames] = useState<string[]>([])
  const [ssids, setSsids] = useState<string[]>([])
  useEffect(() => { setNames(loadList('apNames')); setSsids(loadList('apSsids')) }, [])
  const set = (k:keyof ApInfo, v:string) => onAp({ ...(ap || {}), [k]: v })
  return (
    <div className="stack-sm" style={{ padding:'4px 10px 10px' }}>
      <Field label="ชื่อ AP">{fid => <><input id={fid} className="input-sm" placeholder="เช่น AP-Lobby-01" list={`${id}-n`} value={ap?.name || ''} onChange={e=>set('name', e.target.value)} onBlur={()=>remember('apNames', ap?.name)}/><datalist id={`${id}-n`}>{names.map(n => <option key={n} value={n}/>)}</datalist></>}</Field>
      <Field label="SSID (ชื่อ Wi‑Fi)">{fid => <><input id={fid} className="input-sm" placeholder="เช่น Travelodge-Guest" list={`${id}-s`} value={ap?.ssid || ''} onChange={e=>set('ssid', e.target.value)} onBlur={()=>remember('apSsids', ap?.ssid)}/><datalist id={`${id}-s`}>{ssids.map(n => <option key={n} value={n}/>)}</datalist></>}</Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <Field label="ย่านความถี่">{fid => <select id={fid} className="input-sm" value={ap?.band || ''} onChange={e=>set('band', e.target.value)}><option value="">ไม่ระบุ</option>{AP_BANDS.map(b => <option key={b}>{b}</option>)}</select>}</Field>
        <Field label="สัญญาณ">{fid => <select id={fid} className="input-sm" value={ap?.signal || ''} onChange={e=>set('signal', e.target.value)}><option value="">ไม่ระบุ</option>{AP_SIGNALS.map(s => <option key={s}>{s}</option>)}</select>}</Field>
      </div>
      <Field label="BSSID / MAC ของ AP" hint="ถ้ามี เช่นจาก netsh wlan show interfaces">{fid => <input id={fid} className="input-sm mono" placeholder="aa:bb:cc:dd:ee:ff" value={ap?.bssid || ''} onChange={e=>set('bssid', e.target.value)}/>}</Field>
    </div>
  )
}

export function SpeedCard({ label, icon, download, upload, remark, meta, ap, onDownload, onUpload, onRemark, onMeta, onAp }: Props) {
  const [phase, setPhase] = useState<'idle'|SpeedPhase|'done'|'error'>('idle')
  const [live, setLive] = useState<number>()
  const [apOpen, setApOpen] = useState(false)
  const [announce, setAnnounce] = useState('')
  const apPanel = useId(), remarkId = useId()
  const busy = phase==='ping'||phase==='download'||phase==='upload'
  const run = async () => {
    setPhase('ping'); setLive(undefined); setAnnounce(`เริ่มวัดความเร็ว ${label}`)
    try {
      const r = await runSpeedTest((ph, v) => { setPhase(ph); setLive(v) })
      onDownload(String(r.download)); onUpload(String(r.upload)); onMeta(r); setPhase('done')
      setAnnounce(`วัด ${label} เสร็จ ดาวน์โหลด ${r.download} อัปโหลด ${r.upload} เมกะบิตต่อวินาที`)
      if (!ap?.name) setApOpen(true) // เตือนให้กรอก AP ที่เกาะตอนวัด
    } catch { setPhase('error'); setAnnounce(`วัด ${label} ไม่สำเร็จ`) }
  }
  const auto = isAutoMeasured(download, upload, meta)
  const when = auto && meta ? measuredTime(meta) : null
  const warn = auto && meta ? routeWarning(meta) : null
  const apText = apSummary(ap)
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

        <div style={{ border:'1px dashed var(--border-strong)', borderRadius:'var(--radius-md)' }}>
          <button type="button" className="disclosure" aria-expanded={apOpen} aria-controls={apPanel} onClick={()=>setApOpen(o=>!o)}>
            <i className="bi bi-router" aria-hidden="true"/>
            <span className="grow" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: apText ? 'var(--text)' : undefined }}>{apText || 'AP ที่เกาะตอน Test'}</span>
            <i className={`bi bi-chevron-${apOpen?'up':'down'}`} aria-hidden="true"/>
          </button>
          <div id={apPanel} hidden={!apOpen}>{apOpen && <ApFields ap={ap} onAp={onAp}/>}</div>
        </div>

        <label htmlFor={remarkId} className="sr-only">หมายเหตุ {label}</label>
        <input id={remarkId} type="text" placeholder="หมายเหตุ (ถ้ามี)" value={remark} onChange={e=>onRemark(e.target.value)}/>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announce}</span>
    </article>
  )
}
