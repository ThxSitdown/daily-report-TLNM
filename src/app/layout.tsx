import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IT Daily Report — Travelodge Nimman',
  description: 'IT Daily Report System — Travelodge Nimman Chiang Mai',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
