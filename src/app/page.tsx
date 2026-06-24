'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function Root() {
  const router = useRouter()
  useEffect(() => { router.replace('/select') }, [])
  return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F5F5', color:'#9CA3AF', fontFamily:'Prompt,sans-serif' }}>กำลังโหลด...</div>
}
