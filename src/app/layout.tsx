import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "It's a Normie World",
  description: 'World live simulation of the Normies NFT collection',
  icons: { icon: '/favicon.png' },
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
