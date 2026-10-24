'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'

// saving ไม่ส่งมา = หน้าที่ไม่มีร่าง (เช่นหน้าประวัติ) จะไม่แสดงสถานะร่าง, actions = ปุ่มเพิ่มเติมก่อนชื่อผู้ใช้
interface Props { username: string; saving?: boolean; showBack?: boolean; backHref?: string; backLabel?: string; actions?: ReactNode; onLogout: () => void }
export function AppHeader({ username, saving, showBack = true, backHref = '/select', backLabel = 'เลือกโรงแรม', actions, onLogout }: Props) {
  return (
    <header className="appbar">
      <div className="appbar-inner">
        {showBack && (
          <Link href={backHref} className="btn btn-sm btn-on-dark" aria-label={`กลับไป${backLabel}`}>
            <i className="bi bi-arrow-left" aria-hidden="true"/><span className="hide-xs">{backLabel}</span>
          </Link>
        )}
        <span className={`appbar-status ${saving ? 'saving' : ''}`} role="status" aria-live="polite">
          {saving === undefined ? null : saving
            ? <><i className="bi bi-arrow-repeat spin" aria-hidden="true"/><span className="hide-xs">กำลังบันทึกร่าง...</span></>
            : <><i className="bi bi-cloud-check" aria-hidden="true"/><span className="hide-xs">บันทึกร่างแล้ว</span></>}
        </span>
        {actions}
        <span className="appbar-user"><i className="bi bi-person-circle" aria-hidden="true"/><span className="sr-only">ผู้ใช้: </span>{username}</span>
        <button type="button" onClick={onLogout} className="btn btn-sm btn-on-dark" aria-label="ออกจากระบบ">
          <i className="bi bi-box-arrow-right" aria-hidden="true"/><span className="hide-xs">ออก</span>
        </button>
      </div>
    </header>
  )
}
