import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui'
export const metadata: Metadata = { title: 'IT Daily Report', description: 'Hotel IT Daily Report System' }
// ไม่ล็อก maximum-scale เพื่อให้ผู้ใช้ซูมได้ (WCAG 1.4.4) — ปัญหา iOS ซูมช่องกรอกแก้ด้วยตัวอักษร 16px ใน globals.css
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111111' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#main" className="skip-link">ข้ามไปเนื้อหาหลัก</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
