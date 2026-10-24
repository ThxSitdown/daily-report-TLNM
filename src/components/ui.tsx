'use client'
// ชิ้นส่วน UI กลางที่ทุกหน้าใช้ร่วมกัน (สไตล์อยู่ใน globals.css)
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'

/* ───────── Field: label ผูกกับ input ด้วย id อัตโนมัติ ───────── */
export function Field({ label, icon, extra, hint, className, children }:{ label:ReactNode; icon?:string; extra?:ReactNode; hint?:ReactNode; className?:string; children:(id:string)=>ReactNode }) {
  const id = useId()
  return (
    <div className={`field ${className || ''}`}>
      <label htmlFor={id} className="label">{icon && <i className={`bi ${icon}`} aria-hidden="true"/>}{label}{extra}</label>
      {children(id)}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

/* ───────── Section: การ์ดหัวข้อหลักของฟอร์ม ───────── */
export function Section({ title, icon, badge, tone, children, bodyClassName }:{ title:string; icon:string; badge?:ReactNode; tone?:{ bg:string; fg:string }; children:ReactNode; bodyClassName?:string }) {
  const id = useId()
  return (
    <section className="card" aria-labelledby={id}>
      <div className="card-header">
        <span className="icon-tile" style={tone ? { background: tone.bg, color: tone.fg } : undefined} aria-hidden="true"><i className={`bi ${icon}`}/></span>
        <h2 id={id} className="card-title grow">{title}</h2>
        {badge != null && <span className="badge badge-neutral">{badge}</span>}
      </div>
      <div className={`card-body ${bodyClassName || 'stack'}`}>{children}</div>
    </section>
  )
}

/* ───────── HotelHero: แถบชื่อโรงแรม + ลิงก์ประวัติ ───────── */
export function HotelHero({ name, sub, icon, historyHref }:{ name:string; sub:string; icon:string; historyHref?:string }) {
  return (
    <div className="hero">
      <div className="hero-inner">
        <span className="hero-icon" aria-hidden="true"><i className={`bi ${icon}`}/></span>
        <div className="grow">
          <h1 className="hero-title">{name}</h1>
          <p className="hero-sub">{sub}</p>
        </div>
        {historyHref && <Link href={historyHref} className="btn btn-sm btn-on-dark"><i className="bi bi-clock-history" aria-hidden="true"/>ประวัติ Report</Link>}
      </div>
    </div>
  )
}

/* ───────── ConfirmDialog: modal ยืนยัน (Esc ปิด, focus อยู่ในกล่อง, คืน focus เมื่อปิด) ───────── */
type Tone = 'danger' | 'warning' | 'primary'
const TONE: Record<Tone, { icon:string; bg:string; fg:string; btn:string }> = {
  danger:  { icon:'bi-trash3-fill',            bg:'var(--danger-bg)',  fg:'var(--danger)',  btn:'btn-danger' },
  warning: { icon:'bi-eraser-fill',            bg:'var(--warning-bg)', fg:'var(--warning)', btn:'btn-primary' },
  primary: { icon:'bi-question-circle-fill',   bg:'var(--info-bg)',    fg:'var(--info)',    btn:'btn-primary' },
}

export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel = 'ยกเลิก', tone = 'primary', busy, onConfirm, onCancel }:{
  open:boolean; title:string; body:ReactNode; confirmLabel:string; cancelLabel?:string; tone?:Tone; busy?:boolean; onConfirm:()=>void; onCancel:()=>void
}) {
  const titleId = useId(), bodyId = useId()
  const box = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    cancelRef.current?.focus() // เริ่มที่ปุ่มยกเลิก กันกดยืนยันโดยไม่ตั้งใจ
    const onKey = (e:KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      if (e.key === 'Tab' && box.current) {
        const f = Array.from(box.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus() }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null
  const t = TONE[tone]
  return (
    // คลิกพื้นหลังเพื่อปิดเป็นทางลัดของเมาส์ คีย์บอร์ดใช้ Esc หรือปุ่มยกเลิกได้เหมือนกัน
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div ref={box} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId}>
        <div className="modal-icon" style={{ background: t.bg, color: t.fg }} aria-hidden="true"><i className={`bi ${t.icon}`}/></div>
        <h2 id={titleId} className="modal-title">{title}</h2>
        <div id={bodyId} className="modal-body">{body}</div>
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={`btn ${t.btn}`} onClick={onConfirm} disabled={busy}>
            {busy && <i className="bi bi-arrow-repeat spin" aria-hidden="true"/>}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── Toast: แจ้งผลแบบไม่บล็อก ผ่าน aria-live ───────── */
type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id:number; kind:ToastKind; text:string }
const ToastCtx = createContext<(text:string, kind?:ToastKind) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }:{ children:ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const push = useCallback((text:string, kind:ToastKind = 'info') => {
    const id = ++seq.current
    setItems(p => [...p.slice(-2), { id, kind, text }])
    setTimeout(() => setItems(p => p.filter(t => t.id !== id)), kind === 'error' ? 6000 : 3500)
  }, [])
  const icon = { success:'bi-check-circle-fill', error:'bi-exclamation-octagon-fill', info:'bi-info-circle-fill' }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <i className={`bi ${icon[t.kind]}`} aria-hidden="true"/>
            <span className="grow">{t.text}</span>
            <button type="button" className="btn-icon" style={{ width:24, height:24, color:'#D1D5DB' }} aria-label="ปิดข้อความแจ้งเตือน" onClick={() => setItems(p => p.filter(x => x.id !== t.id))}><i className="bi bi-x-lg" aria-hidden="true"/></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ───────── PageLoading: สถานะโหลดเต็มหน้า ───────── */
export function PageLoading({ text = 'กำลังโหลดข้อมูล...', dark }:{ text?:string; dark?:boolean }) {
  return (
    <div role="status" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: dark ? 'var(--appbar)' : 'var(--bg)', color: dark ? '#D1D5DB' : 'var(--text-muted)' }}>
      <i className="bi bi-arrow-repeat spin" aria-hidden="true"/>{text}
    </div>
  )
}
