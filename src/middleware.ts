import { NextRequest, NextResponse } from 'next/server'

// Edge Runtime ไม่รองรับ jsonwebtoken (Node.js crypto)
// แก้: เช็คแค่ว่า cookie มีอยู่และมีรูปแบบ JWT (3 ส่วน) เท่านั้น
// การ verify จริงทำใน API routes ที่ใช้ Node.js runtime

const PUBLIC_PREFIXES = ['/login', '/api/auth/', '/api/seed', '/_next', '/favicon']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('auth_token')?.value

  // ไม่มี cookie → ไป login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // เช็ครูปแบบ JWT คร่าวๆ (header.payload.signature)
  if (token.split('.').length !== 3) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
