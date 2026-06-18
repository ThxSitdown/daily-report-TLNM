'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import styles from './page.module.css'

export default function SelectPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111', color:'#fff' }}>
      <span>กำลังโหลด...</span>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <span className={styles.topTitle}>
          <i className="bi bi-clipboard2-check"/> Daily Report System
        </span>
        <div className={styles.topRight}>
          {user?.role === 'admin' && (
            <button className={styles.adminBtn} onClick={() => router.push('/admin')}>
              <i className="bi bi-shield-lock"/> Admin
            </button>
          )}
          <span className={styles.userChip}>
            <i className="bi bi-person-circle"/> {user?.username}
          </span>
          <button className={styles.logoutBtn} onClick={logout}>
            <i className="bi bi-box-arrow-right"/> ออก
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>เลือกโรงแรม</h1>
          <p className={styles.sub}>กรุณาเลือกโรงแรมที่ต้องการทำ Daily Report</p>
        </div>

        <div className={styles.cards}>
          {/* Travelodge */}
          <button className={styles.hotelCard} onClick={() => router.push('/travelodge')}>
            <div className={styles.cardBg} style={{ background: 'linear-gradient(135deg,#1E3A5F,#C8102E)' }}>
              <div className={styles.cardOverlay}/>
              <div className={styles.cardContent}>
                <div className={styles.hotelIcon}>
                  <i className="bi bi-building-fill"/>
                </div>
                <div>
                  <div className={styles.hotelName}>Travelodge Nimman</div>
                  <div className={styles.hotelDesc}>Chiang Mai</div>
                </div>
                <div className={styles.cardArrow}>
                  <i className="bi bi-arrow-right-circle-fill"/>
                </div>
              </div>
              <div className={styles.cardBadge}>413 Rooms · 4 Test Points</div>
            </div>
          </button>

          {/* Eastin + U Nimman */}
          <button className={styles.hotelCard} onClick={() => router.push('/eastin-u')}>
            <div className={styles.cardBg} style={{ background: 'linear-gradient(135deg,#0D4A3A,#0891B2)' }}>
              <div className={styles.cardOverlay}/>
              <div className={styles.cardContent}>
                <div className={styles.hotelIcon} style={{ background:'rgba(8,145,178,0.3)' }}>
                  <i className="bi bi-buildings-fill"/>
                </div>
                <div>
                  <div className={styles.hotelName}>Eastin Tan & U Nimman</div>
                  <div className={styles.hotelDesc}>Chiang Mai</div>
                </div>
                <div className={styles.cardArrow}>
                  <i className="bi bi-arrow-right-circle-fill"/>
                </div>
              </div>
              <div className={styles.cardBadge}>2 Hotels · 7 Test Points</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
