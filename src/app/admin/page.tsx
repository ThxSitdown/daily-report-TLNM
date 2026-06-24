'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
const F = 'Prompt,sans-serif'
interface U { id:string; username:string; role:string; createdAt:string }

export default function AdminPage() {
  const { user, loading, logout } = useAuth({ requireAdmin: true })
  const [users, setUsers] = useState<U[]>([])
  const [nu, setNu] = useState(''); const [np, setNp] = useState('')
  const [msg, setMsg] = useState<{t:'ok'|'err';s:string}|null>(null)
  const [adding, setAdding] = useState(false)
  const load = () => fetch('/api/users').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setUsers(d) })
  useEffect(() => { if(!loading) load() }, [loading])

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setAdding(true); setMsg(null)
    const res = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:nu,password:np})})
    const d = await res.json(); setAdding(false)
    if(!res.ok){setMsg({t:'err',s:d.error});return}
    setMsg({t:'ok',s:`เพิ่ม "${nu}" สำเร็จ`}); setNu(''); setNp(''); load()
  }
  const del = async (id:string,name:string) => {
    if(!confirm(`ลบผู้ใช้ "${name}"?`)) return
    const res = await fetch('/api/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    const d = await res.json()
    if(!res.ok){setMsg({t:'err',s:d.error});return}
    setMsg({t:'ok',s:`ลบ "${name}" แล้ว`}); load()
  }

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111',color:'#6B7280',fontFamily:F}}>กำลังโหลด...</div>

  const card = {background:'#1C1C1C',border:'1px solid #2A2A2A',borderRadius:12,padding:18}
  return (
    <div style={{minHeight:'100vh',background:'#111',fontFamily:F}}>
      <AppHeader username={user?.username||''} showBack onLogout={logout}/>
      <div style={{maxWidth:560,margin:'0 auto',padding:'24px 16px',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:40,height:40,background:'rgba(250,204,21,0.1)',border:'1px solid rgba(250,204,21,0.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
            <i className="bi bi-shield-lock" style={{color:'#FACC15'}}/>
          </div>
          <div><div style={{fontSize:18,fontWeight:700,color:'#fff'}}>จัดการผู้ใช้</div><div style={{fontSize:12,color:'#6B7280'}}>Admin เท่านั้น</div></div>
        </div>

        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,color:'#E5E7EB',marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
            <i className="bi bi-person-plus-fill" style={{color:'#FACC15'}}/> เพิ่มผู้ใช้ใหม่
          </div>
          <form onSubmit={add} style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:11,fontWeight:600,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.4px'}}>Username</label>
                <input type="text" required placeholder="ชื่อผู้ใช้" value={nu} onChange={e=>setNu(e.target.value)} style={{background:'#111',borderColor:'#333',color:'#fff'}}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:11,fontWeight:600,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.4px'}}>Password</label>
                <input type="password" required placeholder="รหัสผ่าน" value={np} onChange={e=>setNp(e.target.value)} style={{background:'#111',borderColor:'#333',color:'#fff'}}/>
              </div>
            </div>
            {msg && <div style={{padding:'8px 12px',borderRadius:7,fontSize:13,display:'flex',alignItems:'center',gap:6,background:msg.t==='ok'?'rgba(5,150,105,0.12)':'rgba(200,16,46,0.12)',border:`1px solid ${msg.t==='ok'?'rgba(5,150,105,0.3)':'rgba(200,16,46,0.3)'}`,color:msg.t==='ok'?'#34D399':'#F87171'}}>
              <i className={`bi ${msg.t==='ok'?'bi-check-circle':'bi-exclamation-circle'}`}/>{msg.s}
            </div>}
            <button type="submit" disabled={adding} style={{padding:10,background:'#C8102E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:adding?'not-allowed':'pointer',opacity:adding?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:F}}>
              <i className="bi bi-plus-lg"/> {adding?'กำลังเพิ่ม...':'เพิ่มผู้ใช้'}
            </button>
          </form>
        </div>

        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,color:'#E5E7EB',marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
            <i className="bi bi-people-fill" style={{color:'#FACC15'}}/> ผู้ใช้ทั้งหมด ({users.length})
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {users.map(u=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'#242424',border:'1px solid #333',borderRadius:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,background:'#2D2D2D',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:'#9CA3AF'}}>
                    <i className={`bi ${u.role==='admin'?'bi-shield-fill':'bi-person-fill'}`}/>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:'#fff'}}>{u.username}</div>
                    <div style={{fontSize:11,color:u.role==='admin'?'#FACC15':'#6B7280'}}>
                      {u.role==='admin'?'⭐ Admin':'User'} · {new Date(u.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
                {u.role!=='admin'&&<button onClick={()=>del(u.id,u.username)} style={{width:28,height:28,background:'rgba(200,16,46,0.1)',color:'#F87171',border:'1px solid rgba(200,16,46,0.2)',borderRadius:6,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontFamily:F}}>
                  <i className="bi bi-trash3"/>
                </button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
