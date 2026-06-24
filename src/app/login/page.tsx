'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { fetch('/api/auth/me').then(r => { if (r.ok) router.replace('/select') }) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password }) })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error); return }
    router.replace('/select')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      backgroundImage:'radial-gradient(circle at 20% 50%, rgba(200,16,46,0.08) 0%, transparent 60%)' }}>
      <div style={{ background:'#1C1C1C', border:'1px solid #2A2A2A', borderRadius:16, padding:'40px 32px', width:'100%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, background:'rgba(200,16,46,0.12)', border:'2px solid rgba(200,16,46,0.3)', borderRadius:16, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14, fontSize:32 }}>
            <i className="bi bi-building-fill" style={{ color:'#C8102E' }}/>
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', fontFamily:'Prompt,sans-serif' }}>IT Daily Report</h1>
          <p style={{ fontSize:13, color:'#6B7280', marginTop:4, fontFamily:'Prompt,sans-serif' }}>Hotel Management System</p>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:5, fontFamily:'Prompt,sans-serif' }}>
              <i className="bi bi-person"/> Username
            </label>
            <input type="text" autoComplete="username" required placeholder="กรอก Username"
              value={username} onChange={e => setUsername(e.target.value)}
              style={{ background:'#111', borderColor:'#2A2A2A', color:'#fff' }}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:5, fontFamily:'Prompt,sans-serif' }}>
              <i className="bi bi-lock"/> Password
            </label>
            <input type="password" autoComplete="current-password" required placeholder="กรอก Password"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ background:'#111', borderColor:'#2A2A2A', color:'#fff' }}/>
          </div>
          {error && (
            <div style={{ background:'rgba(200,16,46,0.12)', border:'1px solid rgba(200,16,46,0.3)', color:'#F87171', padding:'10px 12px', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', gap:6, fontFamily:'Prompt,sans-serif' }}>
              <i className="bi bi-exclamation-circle"/> {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ marginTop:6, padding:13, background:'#C8102E', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor: loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'Prompt,sans-serif' }}>
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : <><i className="bi bi-box-arrow-in-right"/> เข้าสู่ระบบ</>}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:12, color:'#4B5563', marginTop:20, display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontFamily:'Prompt,sans-serif' }}>
          <i className="bi bi-info-circle"/> ติดต่อ Admin เพื่อขอรหัสผ่าน
        </p>
      </div>
    </div>
  )
}
