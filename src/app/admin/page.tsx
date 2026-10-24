'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
import { ConfirmDialog, Field, PageLoading, Section } from '@/components/ui'
interface U { id:string; username:string; role:string; createdAt:string }

export default function AdminPage() {
  const { user, loading, logout } = useAuth({ requireAdmin: true })
  const [users, setUsers] = useState<U[]>([])
  const [loadErr, setLoadErr] = useState(false)
  const [nu, setNu] = useState(''); const [np, setNp] = useState('')
  const [msg, setMsg] = useState<{t:'ok'|'err';s:string}|null>(null)
  const [adding, setAdding] = useState(false)
  const [delTarget, setDelTarget] = useState<U|null>(null)
  const [deleting, setDeleting] = useState(false)
  const load = () => fetch('/api/users').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) { setUsers(d); setLoadErr(false) } else setLoadErr(true) }).catch(()=>setLoadErr(true))
  useEffect(() => { if(!loading) load() }, [loading])

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setAdding(true); setMsg(null)
    try {
      const res = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:nu,password:np})})
      const d = await res.json()
      if(!res.ok){setMsg({t:'err',s:d.error||'เพิ่มผู้ใช้ไม่สำเร็จ'});return}
      setMsg({t:'ok',s:`เพิ่ม "${nu}" สำเร็จ`}); setNu(''); setNp(''); load()
    } catch { setMsg({t:'err',s:'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง'}) }
    finally { setAdding(false) }
  }
  const del = async () => {
    if(!delTarget) return
    const { id, username:name } = delTarget
    setDeleting(true)
    try {
      const res = await fetch('/api/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
      const d = await res.json()
      if(!res.ok){setMsg({t:'err',s:d.error||'ลบไม่สำเร็จ'});return}
      setMsg({t:'ok',s:`ลบ "${name}" แล้ว`}); load()
    } catch { setMsg({t:'err',s:'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง'}) }
    finally { setDeleting(false); setDelTarget(null) }
  }

  if(loading) return <PageLoading text="กำลังโหลด..."/>

  return (
    <div>
      <AppHeader username={user?.username||''} showBack onLogout={logout}/>
      <main id="main" className="page" style={{maxWidth:600}}>
        <div className="row" style={{gap:'var(--sp-3)'}}>
          <span className="icon-tile" style={{width:40,height:40,background:'var(--warning-bg)',color:'var(--warning)'}} aria-hidden="true"><i className="bi bi-shield-lock"/></span>
          <div><h1 style={{fontSize:'var(--text-xl)'}}>จัดการผู้ใช้</h1><p className="muted" style={{fontSize:'var(--text-xs)'}}>เฉพาะ Admin</p></div>
        </div>

        {msg && <div className={`alert ${msg.t==='ok'?'alert-success':'alert-danger'}`} role={msg.t==='ok'?'status':'alert'}>
          <i className={`bi ${msg.t==='ok'?'bi-check-circle':'bi-exclamation-octagon'}`} aria-hidden="true"/>{msg.s}
        </div>}

        <Section title="เพิ่มผู้ใช้ใหม่" icon="bi-person-plus-fill">
          <form onSubmit={add} className="stack">
            <div className="grid-auto" style={{'--col':'200px'} as React.CSSProperties}>
              <Field label="Username">{id=><input id={id} type="text" required autoComplete="off" placeholder="ชื่อผู้ใช้" value={nu} onChange={e=>setNu(e.target.value)}/>}</Field>
              <Field label="Password">{id=><input id={id} type="password" required autoComplete="new-password" placeholder="รหัสผ่าน" value={np} onChange={e=>setNp(e.target.value)}/>}</Field>
            </div>
            <button type="submit" disabled={adding} className="btn btn-primary">
              <i className={`bi ${adding?'bi-arrow-repeat spin':'bi-plus-lg'}`} aria-hidden="true"/>{adding?'กำลังเพิ่ม...':'เพิ่มผู้ใช้'}
            </button>
          </form>
        </Section>

        <Section title={`ผู้ใช้ทั้งหมด (${users.length})`} icon="bi-people-fill">
          {loadErr && <div className="alert alert-danger" role="alert"><i className="bi bi-exclamation-octagon" aria-hidden="true"/><span className="grow">โหลดรายชื่อผู้ใช้ไม่สำเร็จ</span><button type="button" className="btn btn-sm btn-secondary" onClick={load}>ลองใหม่</button></div>}
          <ul className="stack-sm" style={{listStyle:'none'}}>
            {users.map(u=>(
              <li key={u.id} className="subcard row" style={{padding:'10px 12px',gap:'var(--sp-3)'}}>
                <span className="icon-tile" style={{background:'var(--surface-muted)',color:'var(--text-muted)'}} aria-hidden="true"><i className={`bi ${u.role==='admin'?'bi-shield-fill':'bi-person-fill'}`}/></span>
                <div className="grow">
                  <div style={{fontWeight:600}}>{u.username}</div>
                  <div className="row" style={{fontSize:'var(--text-xs)',gap:6}}>
                    <span className={`badge ${u.role==='admin'?'badge-warning':'badge-neutral'}`}>{u.role==='admin'?'Admin':'User'}</span>
                    <span className="muted">สร้างเมื่อ {new Date(u.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                {u.role!=='admin'&&<button type="button" onClick={()=>setDelTarget(u)} className="btn btn-icon btn-danger-soft" aria-label={`ลบผู้ใช้ ${u.username}`}><i className="bi bi-trash3" aria-hidden="true"/></button>}
              </li>
            ))}
          </ul>
        </Section>
      </main>

      <ConfirmDialog open={!!delTarget} tone="danger" title="ลบผู้ใช้?" confirmLabel="ลบผู้ใช้" busy={deleting}
        body={<>ผู้ใช้ <b>{delTarget?.username}</b> จะเข้าระบบไม่ได้อีก การลบนี้ย้อนกลับไม่ได้</>}
        onCancel={()=>setDelTarget(null)} onConfirm={del}/>
    </div>
  )
}
