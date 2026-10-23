'use client'
import { useState } from 'react'
import Link from 'next/link'
const F = 'Prompt,sans-serif'
const M = 'IBM Plex Mono,monospace'

export function CopyButton({ text, dark = true }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const base = dark
    ? { background: copied ? 'rgba(5,150,105,0.5)' : 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
    : { background: copied ? '#D1FAE5' : '#fff', color: copied ? '#059669' : '#374151', border: '1px solid #E5E7EB' }
  return (
    <button onClick={copy} style={{ ...base, padding:'6px 13px', borderRadius:6, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, fontFamily:F }}>
      <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`}/>{copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

interface PreviewProps {
  text: string; sent: boolean; sending: boolean; headerBg: string; accent: string; historyHref: string
  onEdit: () => void; onConfirm: () => void; onNew: () => void
}

// ขั้นตอนส่ง: ดูรายงาน -> กดยืนยันการส่ง -> บันทึกลงประวัติ + ล้างฟอร์ม
export function ReportPreview({ text, sent, sending, headerBg, accent, historyHref, onEdit, onConfirm, onNew }: PreviewProps) {
  const ghost: React.CSSProperties = { display:'flex', alignItems:'center', gap:5, padding:'9px 14px', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:7, fontSize:13, color:'#4B5563', fontFamily:F, textDecoration:'none' }
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ background:headerBg, borderBottom:`3px solid ${accent}`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:7 }}>
          {sent
            ? <><i className="bi bi-check-circle-fill" style={{ color:'#34D399' }}/> ส่งรายงานแล้ว</>
            : <><i className="bi bi-eye" style={{ color:'#FACC15' }}/> ตรวจสอบก่อนส่ง</>}
        </span>
        <CopyButton text={text}/>
      </div>
      <div style={{ padding:16 }}>
        <pre style={{ fontFamily:M, fontSize:13, lineHeight:1.85, background:'#F8F8F8', borderRadius:8, padding:14, border:'1px solid #E5E7EB', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{text}</pre>
        {sent && <div style={{ marginTop:10, fontSize:12, color:'#059669', display:'flex', alignItems:'center', gap:5 }}><i className="bi bi-info-circle"/>บันทึกลงประวัติและล้างข้อมูลในฟอร์มแล้ว</div>}
      </div>
      <div style={{ display:'flex', gap:8, padding:'0 16px 16px', flexWrap:'wrap' }}>
        {sent ? <>
          <Link href={historyHref} style={ghost}><i className="bi bi-clock-history"/> ดูประวัติ</Link>
          <button onClick={onNew} style={{ ...ghost, marginLeft:'auto', background:accent, color:'#fff', border:'none', fontWeight:600 }}><i className="bi bi-plus-lg"/> เริ่มรายงานใหม่</button>
        </> : <>
          <button onClick={onEdit} disabled={sending} style={ghost}><i className="bi bi-arrow-left"/> แก้ไข</button>
          <button onClick={onConfirm} disabled={sending} style={{ ...ghost, marginLeft:'auto', background:accent, color:'#fff', border:'none', fontWeight:600, opacity:sending?0.7:1, cursor:sending?'not-allowed':'pointer' }}>
            <i className="bi bi-send-check-fill"/>{sending ? 'กำลังส่ง...' : 'ยืนยันการส่ง'}
          </button>
        </>}
      </div>
    </div>
  )
}

// ล้างเฉพาะข้อมูลที่กรอกในฟอร์ม รายงานที่ส่งแล้วไม่ถูกแตะ
export function ClearFormModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
      <div style={{ background:'#fff', borderRadius:14, padding:24, maxWidth:340, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', fontFamily:F }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ width:46, height:46, background:'#FEF3C7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, margin:'0 auto 12px', color:'#D97706' }}><i className="bi bi-eraser-fill"/></div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>ล้างข้อมูลที่กรอก?</div>
          <div style={{ fontSize:13, color:'#6B7280' }}>ช่องที่กรอกไว้ในฟอร์มนี้จะว่างทั้งหมด ส่วนรายงานที่ส่งไปแล้วยังอยู่ในประวัติเหมือนเดิม</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <button onClick={onCancel} style={{ padding:10, background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:8, fontSize:14, fontFamily:F }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ padding:10, background:'#D97706', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, fontFamily:F }}>ล้างฟอร์ม</button>
        </div>
      </div>
    </div>
  )
}

// ปุ่มท้ายฟอร์ม: ล้างฟอร์ม + ไปหน้าตรวจสอบก่อนส่ง
export function SubmitBar({ background, shadow, onClear, onPreview }: { background: string; shadow: string; onClear: () => void; onPreview: () => void }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:14, display:'flex', gap:8 }}>
      <button onClick={onClear} style={{ padding:'13px 14px', background:'#F3F4F6', color:'#6B7280', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', gap:5, fontFamily:F, whiteSpace:'nowrap' }}>
        <i className="bi bi-eraser"/> ล้างฟอร์ม
      </button>
      <button onClick={onPreview} style={{ flex:1, padding:13, background, color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:F, boxShadow:shadow }}>
        <i className="bi bi-send-fill"/> ตรวจสอบและส่ง Report
      </button>
    </div>
  )
}
