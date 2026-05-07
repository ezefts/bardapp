import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BardApp — El ring del bardeo',
  description: 'Duelos de puteadas en tiempo real',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="relative z-10">{children}</body>
    </html>
  )
}
