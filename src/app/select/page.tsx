'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'

const F = 'Prompt, sans-serif'
const btn = (bg: string): React.CSSProperties => ({
  width:'100%', background:'none', border:'none', padding:0, cursor:'pointer', borderRadius:14, overflow:'hidden', textAlign:'left'
})

export default function SelectPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#111', color:'#6B7280', fontFamily:F }}>กำลังโหลด...</div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#111', fontFamily:F }}>
      {/* Top bar */}
      <div style={{ background:'#000', borderBottom:'3px solid #C8102E', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#fff', display:'flex', alignItems:'center', gap:7 }}>
          <i className="bi bi-clipboard2-check" style={{ color:'#C8102E', fontSize:16 }}/> Daily Report System
        </span>
        {user?.role === 'admin' && (
          <button onClick={() => router.push('/admin')} style={{ padding:'4px 12px', background:'rgba(250,204,21,0.12)', color:'#FACC15', border:'1px solid rgba(250,204,21,0.25)', borderRadius:6, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:F }}>
            <i className="bi bi-shield-lock"/> Admin
          </button>
        )}
        <span style={{ fontSize:12, color:'#9CA3AF', display:'flex', alignItems:'center', gap:5 }}>
          <i className="bi bi-person-circle"/>{user?.username}
        </span>
        <button onClick={logout} style={{ padding:'4px 10px', background:'rgba(200,16,46,0.12)', color:'#F87171', border:'1px solid rgba(200,16,46,0.2)', borderRadius:6, fontSize:12, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:F }}>
          <i className="bi bi-box-arrow-right"/> ออก
        </button>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'40px 16px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#fff', marginBottom:8 }}>เลือกโรงแรม</h1>
          <p style={{ fontSize:14, color:'#6B7280' }}>กรุณาเลือกโรงแรมที่ต้องการทำ Daily Report</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Travelodge */}
          <button style={btn('')} onClick={() => router.push('/travelodge')}>
            <div style={{ background:'linear-gradient(135deg,#1E3A5F,#C8102E)', padding:'22px 20px 14px', position:'relative', overflow:'hidden', borderRadius:14, transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 36px rgba(0,0,0,0.5)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow=''}}>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)' }}/>
              <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:48, height:48, background:'rgba(200,16,46,0.35)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#fff', border:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}>
                  <i className="bi bi-building-fill"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Travelodge Nimman</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>Chiang Mai</div>
                </div>
                <i className="bi bi-arrow-right-circle-fill" style={{ fontSize:26, color:'rgba(255,255,255,0.6)' }}/>
              </div>
              <span style={{ position:'relative', fontSize:11, color:'rgba(255,255,255,0.6)', background:'rgba(0,0,0,0.25)', padding:'4px 10px', borderRadius:20 }}>
                413 Rooms · Cafe 6T6, The Lodge, Lobby, Swim&Gym
              </span>
            </div>
          </button>

          {/* Eastin + U Nimman */}
          <button style={btn('')} onClick={() => router.push('/eastin-u')}>
            <div style={{ background:'linear-gradient(135deg,#0D4A3A,#0891B2)', padding:'22px 20px 14px', position:'relative', overflow:'hidden', borderRadius:14, transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 36px rgba(0,0,0,0.5)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow=''}}>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)' }}/>
              <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:48, height:48, background:'rgba(8,145,178,0.35)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#fff', border:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}>
                  <i className="bi bi-buildings-fill"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Eastin Tan & U Nimman</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>Chiang Mai</div>
                </div>
                <i className="bi bi-arrow-right-circle-fill" style={{ fontSize:26, color:'rgba(255,255,255,0.6)' }}/>
              </div>
              <span style={{ position:'relative', fontSize:11, color:'rgba(255,255,255,0.6)', background:'rgba(0,0,0,0.25)', padding:'4px 10px', borderRadius:20 }}>
                2 Hotels · Eastin: 4 จุด · U Nimman: 3 จุด
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
