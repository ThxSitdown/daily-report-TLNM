'use client'
import { useRouter } from 'next/navigation'

interface Props {
  username: string
  saving?: boolean
  showBack?: boolean
  onLogout: () => void
}

export function AppHeader({ username, saving, showBack = true, onLogout }: Props) {
  const router = useRouter()
  return (
    <div style={{
      background: '#111', borderBottom: '3px solid #C8102E',
      padding: '0 16px', height: 52,
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      {showBack && (
        <button onClick={() => router.push('/select')} style={{
          background: 'rgba(255,255,255,0.1)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
          padding: '4px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5
        }}>
          <i className="bi bi-arrow-left"/> เลือกโรงแรม
        </button>
      )}
      <span style={{ flex: 1, fontSize: 12, color: saving ? '#FACC15' : '#9CA3AF' }}>
        {saving ? '⏳ กำลังบันทึกร่าง...' : '✓ ร่างถูกบันทึกแล้ว'}
      </span>
      <span style={{ fontSize: 12, color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="bi bi-person-circle"/>{username}
      </span>
      <button onClick={onLogout} style={{
        background: 'rgba(200,16,46,0.2)', color: '#F87171',
        border: '1px solid rgba(200,16,46,0.3)', borderRadius: 6,
        padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5
      }}>
        <i className="bi bi-box-arrow-right"/> ออก
      </button>
    </div>
  )
}
