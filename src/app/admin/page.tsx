'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AppHeader } from '@/components/AppHeader'
import styles from './page.module.css'

interface UserRow { id: string; username: string; role: string; createdAt: string }

export default function AdminPage() {
  const { user, loading, logout } = useAuth({ requireAdmin: true })
  const [users, setUsers] = useState<UserRow[]>([])
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [adding, setAdding] = useState(false)

  const loadUsers = () =>
    fetch('/api/users').then(r => r.json()).then(d => { if (Array.isArray(d)) setUsers(d) })

  useEffect(() => { if (!loading) loadUsers() }, [loading])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true); setMsg(null)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUser, password: newPass })
    })
    const d = await res.json()
    if (!res.ok) { setMsg({ type: 'err', text: d.error }); setAdding(false); return }
    setMsg({ type: 'ok', text: `เพิ่ม "${newUser}" สำเร็จ` })
    setNewUser(''); setNewPass(''); setAdding(false)
    loadUsers()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ลบผู้ใช้ "${name}" ?`)) return
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await res.json()
    if (!res.ok) { setMsg({ type: 'err', text: d.error }); return }
    setMsg({ type: 'ok', text: `ลบ "${name}" แล้ว` })
    loadUsers()
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111', color:'#fff' }}>
      กำลังโหลด...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#111', fontFamily:'Prompt, sans-serif' }}>
      <AppHeader username={user?.username || ''} showBack onLogout={logout} />

      <div style={{ maxWidth: 600, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{
            width:40, height:40, background:'rgba(250,204,21,0.12)',
            border:'1px solid rgba(250,204,21,0.25)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20
          }}>
            <i className="bi bi-shield-lock" style={{ color:'#FACC15' }}/>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>จัดการผู้ใช้</div>
            <div style={{ fontSize:12, color:'#6B7280' }}>เฉพาะ Admin เท่านั้น</div>
          </div>
        </div>

        {/* Add User Form */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="bi bi-person-plus-fill"/> เพิ่มผู้ใช้ใหม่
          </div>
          <form onSubmit={handleAdd} className={styles.addForm}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input type="text" required placeholder="ชื่อผู้ใช้"
                  value={newUser} onChange={e => setNewUser(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input type="password" required placeholder="รหัสผ่าน"
                  value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
            </div>
            {msg && (
              <div className={msg.type === 'ok' ? styles.msgOk : styles.msgErr}>
                <i className={`bi ${msg.type === 'ok' ? 'bi-check-circle' : 'bi-exclamation-circle'}`}/> {msg.text}
              </div>
            )}
            <button type="submit" disabled={adding} className={styles.addBtn}>
              {adding ? 'กำลังเพิ่ม...' : <><i className="bi bi-plus-lg"/> เพิ่มผู้ใช้</>}
            </button>
          </form>
        </div>

        {/* User List */}
        <div className={styles.card} style={{ marginTop: 14 }}>
          <div className={styles.cardTitle}>
            <i className="bi bi-people-fill"/> ผู้ใช้ทั้งหมด ({users.length})
          </div>
          <div className={styles.userList}>
            {users.map(u => (
              <div key={u.id} className={styles.userRow}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className={styles.avatar}>
                    <i className={`bi ${u.role === 'admin' ? 'bi-shield-fill' : 'bi-person-fill'}`}/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{u.username}</div>
                    <div style={{ fontSize:11, color: u.role==='admin' ? '#FACC15' : '#6B7280' }}>
                      {u.role === 'admin' ? '⭐ Admin' : 'User'} · {new Date(u.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <button className={styles.deleteBtn} onClick={() => handleDelete(u.id, u.username)}>
                    <i className="bi bi-trash3"/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
