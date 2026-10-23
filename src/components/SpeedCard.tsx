'use client'
import { useState } from 'react'
import { runSpeedTest, isAutoMeasured, measuredTime, routeWarning, type SpeedMeta, type SpeedPhase } from '@/lib/speedtest'
const F = 'Prompt,sans-serif'
const M = 'IBM Plex Mono,monospace'
interface Props { label:string; icon:string; download:string; upload:string; remark:string; meta?:SpeedMeta; onDownload:(v:string)=>void; onUpload:(v:string)=>void; onRemark:(v:string)=>void; onMeta:(m:SpeedMeta)=>void }

const pill = (bg:string, color:string):React.CSSProperties => ({ alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:bg, color })

export function SpeedCard({ label, icon, download, upload, remark, meta, onDownload, onUpload, onRemark, onMeta }: Props) {
  const [phase, setPhase] = useState<'idle'|SpeedPhase|'done'|'error'>('idle')
  const [live, setLive] = useState<number>()
  const busy = phase==='ping'||phase==='download'||phase==='upload'
  const run = async () => {
    setPhase('ping'); setLive(undefined)
    try {
      const r = await runSpeedTest((ph, v) => { setPhase(ph); setLive(v) })
      onDownload(String(r.download)); onUpload(String(r.upload)); onMeta(r); setPhase('done')
    } catch { setPhase('error') }
  }
  const auto = isAutoMeasured(download, upload, meta)
  const when = auto && meta ? measuredTime(meta) : null
  const warn = auto && meta ? routeWarning(meta) : null
  const btnBg = phase==='done' ? '#D1FAE5' : phase==='error' ? '#FEE2E2' : busy ? '#F3F4F6' : '#C8102E'
  const btnColor = phase==='done' ? '#059669' : phase==='error' ? '#DC2626' : busy ? '#6B7280' : '#fff'
  return (
    <div style={{ border:'1.5px solid #E5E7EB', borderRadius:9, overflow:'hidden', background:'#fff' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 11px', background:'#F8F8F8', borderBottom:'1px solid #E5E7EB' }}>
        <span style={{ fontSize:13, fontWeight:600, color:'#111', display:'flex', alignItems:'center', gap:6, fontFamily:F }}>
          <i className={`bi ${icon}`} style={{ color:'#C8102E', fontSize:14 }}/>{label}
        </span>
        <button onClick={run} disabled={busy} style={{ padding:'4px 10px', fontSize:12, fontWeight:600, borderRadius:5, border:'none', background:btnBg, color:btnColor, cursor:busy?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:F, whiteSpace:'nowrap' }}>
          {busy && <span style={{ width:10, height:10, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
          {phase==='ping'?'Ping...':phase==='download'?`↓ ${live ?? '...'}`:phase==='upload'?`↑ ${live ?? '...'}`:phase==='done'?'✓ Done':phase==='error'?'✕ Retry':'▶ Test'}
        </button>
      </div>
      {busy && <div style={{ height:3, background:'#E5E7EB', overflow:'hidden' }}><div style={{ height:'100%', background: phase==='upload'?'#7C3AED':'#C8102E', width:'55%', animation:'prog 1.4s ease-in-out infinite' }}/></div>}
      <div style={{ padding:'10px 11px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#1A56A0', textTransform:'uppercase', letterSpacing:'0.4px', display:'flex', alignItems:'center', gap:3 }}>
              <i className="bi bi-arrow-down-circle-fill"/>↓ DL</span>
            <input type="number" step="0.1" placeholder="Mbps" value={download} onChange={e=>onDownload(e.target.value)}
              style={{ fontFamily:M, fontSize:16, fontWeight:500, textAlign:'center', padding:'7px', border:'1.5px solid #E5E7EB', borderRadius:7, background:'#fff', width:'100%', outline:'none' }}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#6B21A8', textTransform:'uppercase', letterSpacing:'0.4px', display:'flex', alignItems:'center', gap:3 }}>
              <i className="bi bi-arrow-up-circle-fill"/>↑ UL</span>
            <input type="number" step="0.1" placeholder="Mbps" value={upload} onChange={e=>onUpload(e.target.value)}
              style={{ fontFamily:M, fontSize:16, fontWeight:500, textAlign:'center', padding:'7px', border:'1.5px solid #E5E7EB', borderRadius:7, background:'#fff', width:'100%', outline:'none' }}/>
          </div>
        </div>
        {meta && when ? (
          <div style={{ display:'flex', flexDirection:'column', gap:2, fontSize:11, lineHeight:1.5, color:'#6B7280' }}>
            {warn ? <>
              <span style={pill('#FEE2E2','#B91C1C')}><i className="bi bi-shield-exclamation"/>{warn.short} {when.label}</span>
              <span style={{ color:'#B91C1C' }}>{warn.long}</span>
            </> : (
              <span style={when.today ? pill('#D1FAE5','#059669') : pill('#FEF3C7','#B45309')}>
                <i className={`bi ${when.today?'bi-patch-check-fill':'bi-exclamation-triangle-fill'}`}/>{when.today?'วัดอัตโนมัติ':'วัดไว้เมื่อ'} {when.label}
              </span>
            )}
            <span style={{ fontFamily:M }}>ping {meta.ping} ms · jitter {meta.jitter} ms</span>
            <span>{[meta.server, meta.isp].filter(Boolean).join(' · ')}</span>
          </div>
        ) : (download||upload) ? (
          <span style={pill('#F3F4F6','#6B7280')}><i className="bi bi-pencil-fill"/>กรอกเอง</span>
        ) : null}
        <input type="text" placeholder="Remark..." value={remark} onChange={e=>onRemark(e.target.value)}
          style={{ fontSize:13, color:'#6B7280', border:'1.5px solid #E5E7EB', borderRadius:7, padding:'7px 10px', width:'100%', outline:'none' }}/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes prog{0%{transform:translateX(-120%)}100%{transform:translateX(240%)}}`}</style>
    </div>
  )
}
