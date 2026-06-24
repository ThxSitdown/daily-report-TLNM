import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
export async function GET(req: NextRequest) {
  const s = getSession(req)
  if (!s) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  return NextResponse.json(s)
}
