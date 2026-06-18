'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => { if (r.ok) router.replace('/select') })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.replace('/select')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.logoBox}>
            <i className="bi bi-building-fill" style={{ fontSize: 32, color: '#C8102E' }}/>
          </div>
          <h1 className={styles.brand}>IT Daily Report</h1>
          <p className={styles.brandSub}>Hotel Management System</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              <i className="bi bi-person"/> ชื่อผู้ใช้
            </label>
            <input
              type="text" autoComplete="username" required
              placeholder="กรอก Username"
              value={username} onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              <i className="bi bi-lock"/> รหัสผ่าน
            </label>
            <input
              type="password" autoComplete="current-password" required
              placeholder="กรอก Password"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className={styles.error}>
              <i className="bi bi-exclamation-circle"/> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? <><span className={styles.spinner}/> กำลังเข้าสู่ระบบ...</> : <>
              <i className="bi bi-box-arrow-in-right"/> เข้าสู่ระบบ
            </>}
          </button>
        </form>

        <p className={styles.hint}>
          <i className="bi bi-info-circle"/> ติดต่อ Admin เพื่อขอรหัสผ่าน
        </p>
      </div>
    </div>
  )
}
