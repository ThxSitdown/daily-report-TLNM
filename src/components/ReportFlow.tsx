'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ConfirmDialog, useToast } from '@/components/ui'

export function CopyButton({ text, label = 'Copy', onDark = true }: { text: string; label?: string; onDark?: boolean }) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { toast('คัดลอกไม่สำเร็จ ลองเลือกข้อความแล้วกดคัดลอกเอง', 'error') }
  }
  return (
    <button type="button" onClick={copy} className={`btn btn-sm ${onDark ? 'btn-on-dark' : 'btn-secondary'}`} aria-live="polite">
      <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} aria-hidden="true"/>{copied ? 'คัดลอกแล้ว' : label}
    </button>
  )
}

interface PreviewProps {
  text: string; sent: boolean; sending: boolean; historyHref: string
  onEdit: () => void; onConfirm: () => void; onNew: () => void
}

// ขั้นตอนส่ง: ดูรายงาน -> กดยืนยันการส่ง -> บันทึกลงประวัติ + ล้างฟอร์ม
export function ReportPreview({ text, sent, sending, historyHref, onEdit, onConfirm, onNew }: PreviewProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [sent]) // ย้าย focus มาที่หัวข้อเมื่อเปลี่ยนขั้นตอน ให้ screen reader รู้ว่าหน้าเปลี่ยน
  return (
    <section className="card" aria-labelledby="report-preview-title">
      <div className="hero" style={{ borderRadius:'var(--radius-lg) var(--radius-lg) 0 0' }}>
        <div className="row" style={{ padding:'12px 16px' }}>
          <h2 id="report-preview-title" ref={heading} tabIndex={-1} className="grow row" style={{ fontSize:'var(--text-lg)', color:'#fff', outline:'none' }}>
            {sent
              ? <><i className="bi bi-check-circle-fill" style={{ color:'#6EE7B7' }} aria-hidden="true"/>ส่งรายงานแล้ว</>
              : <><i className="bi bi-eye" style={{ color:'#FDE68A' }} aria-hidden="true"/>ตรวจสอบก่อนส่ง</>}
          </h2>
          <CopyButton text={text}/>
        </div>
      </div>
      <div className="card-body stack">
        {!sent && <p className="muted" style={{ fontSize:'var(--text-sm)' }}>ตรวจข้อความด้านล่าง ถ้าถูกต้องกด <b>ยืนยันการส่ง</b> เพื่อบันทึกลงประวัติ</p>}
        <pre className="report-text">{text}</pre>
        {sent && <div className="alert alert-success" role="status"><i className="bi bi-check-circle" aria-hidden="true"/>บันทึกลงประวัติและล้างข้อมูลในฟอร์มแล้ว</div>}
        <div className="row" style={{ flexWrap:'wrap', justifyContent:'space-between' }}>
          {sent ? <>
            <Link href={historyHref} className="btn btn-secondary"><i className="bi bi-clock-history" aria-hidden="true"/>ดูประวัติ</Link>
            <button type="button" onClick={onNew} className="btn btn-primary"><i className="bi bi-plus-lg" aria-hidden="true"/>เริ่มรายงานใหม่</button>
          </> : <>
            <button type="button" onClick={onEdit} disabled={sending} className="btn btn-secondary"><i className="bi bi-arrow-left" aria-hidden="true"/>แก้ไข</button>
            <button type="button" onClick={onConfirm} disabled={sending} className="btn btn-primary">
              <i className={`bi ${sending ? 'bi-arrow-repeat spin' : 'bi-send-check-fill'}`} aria-hidden="true"/>{sending ? 'กำลังส่ง...' : 'ยืนยันการส่ง'}
            </button>
          </>}
        </div>
      </div>
    </section>
  )
}

// ล้างเฉพาะข้อมูลที่กรอกในฟอร์ม รายงานที่ส่งแล้วไม่ถูกแตะ
export function ClearFormModal({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ConfirmDialog open={open} tone="warning" title="ล้างข้อมูลที่กรอก?" confirmLabel="ล้างฟอร์ม" onCancel={onCancel} onConfirm={onConfirm}
      body="ช่องที่กรอกไว้ในฟอร์มนี้จะว่างทั้งหมด ส่วนรายงานที่ส่งไปแล้วยังอยู่ในประวัติเหมือนเดิม"/>
  )
}

// แถบปุ่มท้ายฟอร์ม ติดขอบล่างจอ: ล้างฟอร์ม + ไปหน้าตรวจสอบก่อนส่ง
export function SubmitBar({ onClear, onPreview }: { onClear: () => void; onPreview: () => void }) {
  return (
    <div className="action-bar">
      <button type="button" onClick={onClear} className="btn btn-secondary"><i className="bi bi-eraser" aria-hidden="true"/>ล้างฟอร์ม</button>
      <button type="button" onClick={onPreview} className="btn btn-primary grow"><i className="bi bi-send-fill" aria-hidden="true"/>ตรวจสอบและส่ง Report</button>
    </div>
  )
}
