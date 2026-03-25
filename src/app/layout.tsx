import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Normies World',
  description: 'A 3D pixel art world where Normies live',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
