'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
import { PageLoading } from '@/components/ui'
import { accentVars, TRAVELODGE_LOCS, EASTIN_LOCS, UNIMMAN_LOCS } from '@/lib/hotels'

const HOTEL_CARDS = [
  { key:'travelodge', href:'/travelodge', name:'Travelodge Nimman', img:'/images.png', place:'Chiang Mai · 413 ห้อง', spots:TRAVELODGE_LOCS.map(l=>l.label).join(', ') },
  { key:'eastin-u', href:'/eastin-u', name:'Eastin Tan & U Nimman', img:'/Unimman.png', place:'Chiang Mai · 2 โรงแรม', spots:`Eastin ${EASTIN_LOCS.length} จุด · U Nimman ${UNIMMAN_LOCS.length} จุด` },
]

export default function SelectPage() {
  const { user, loading, logout } = useAuth()

  if (loading) return <PageLoading text="กำลังโหลด..."/>

  return (
    <div>
      <AppHeader username={user?.username||''} showBack={false} onLogout={logout}
        actions={user?.role === 'admin' && <Link href="/admin" className="btn btn-sm btn-on-dark"><i className="bi bi-shield-lock" aria-hidden="true"/><span className="hide-xs">จัดการผู้ใช้</span><span className="sr-only"> (Admin)</span></Link>}/>
      <main id="main" className="page" style={{ maxWidth:640, paddingTop:'var(--sp-8)' }}>
        <div style={{ textAlign:'center', marginBottom:'var(--sp-4)' }}>
          <h1 style={{ fontSize:'var(--text-2xl)' }}>เลือกโรงแรม</h1>
          <p className="muted">เลือกโรงแรมที่ต้องการทำ Daily Report</p>
        </div>
        <ul className="stack" style={{ listStyle:'none' }}>
          {HOTEL_CARDS.map(h => (
            <li key={h.key} style={accentVars(h.key)}>
              <Link href={h.href} className="card card-link">
                <img src={h.img} alt="" width={56} height={56} style={{ borderRadius:'var(--radius-md)', objectFit:'cover', flexShrink:0 }}/>
                <div className="grow">
                  <h2 style={{ fontSize:'var(--text-xl)' }}>{h.name}</h2>
                  <p className="muted" style={{ fontSize:'var(--text-sm)' }}>{h.place}</p>
                  <p className="subtle" style={{ fontSize:'var(--text-xs)', marginTop:2 }}>{h.spots}</p>
                </div>
                <i className="bi bi-arrow-right-circle-fill go" aria-hidden="true"/>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
