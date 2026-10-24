'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Field } from '@/components/ui'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { fetch('/api/auth/me').then(r => { if (r.ok) router.replace('/select') }).catch(() => {}) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || 'เข้าสู่ระบบไม่สำเร็จ'); return }
      router.replace('/select')
    } catch { setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่') }
    finally { setLoading(false) }
  }

  return (
    <main id="main" className="auth">
      <div className="auth-card">
        <div style={{ textAlign:'center', marginBottom:'var(--sp-6)' }}>
          <img src="/images.png" alt="Travelodge" width={160} style={{ height:'auto', display:'block', margin:'0 auto var(--sp-3)' }}/>
          <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:700, color:'#fff' }}>IT Daily Report</h1>
          <p style={{ fontSize:'var(--text-sm)', color:'#D1D5DB', marginTop:4 }}>Hotel Management System</p>
        </div>
        <form onSubmit={submit} className="stack">
          <Field label="Username" icon="bi-person">{id => <input id={id} type="text" autoComplete="username" required placeholder="กรอก Username" value={username} onChange={e => setUsername(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined}/>}</Field>
          <Field label="Password" icon="bi-lock">{id => <input id={id} type="password" autoComplete="current-password" required placeholder="กรอก Password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined}/>}</Field>
          {error && <div id="login-error" className="alert alert-danger" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true"/>{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block" style={{ marginTop:'var(--sp-2)' }}>
            <i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-box-arrow-in-right'}`} aria-hidden="true"/>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <p className="row" style={{ justifyContent:'center', fontSize:'var(--text-xs)', color:'#D1D5DB', marginTop:'var(--sp-5)' }}>
          <i className="bi bi-info-circle" aria-hidden="true"/>ติดต่อ Admin เพื่อขอรหัสผ่าน
        </p>
      </div>
    </main>
  )
}
