'use client'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/collection', label: 'Collection' },
  { href: '/know-more', label: 'Know more' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 68,
      background: 'rgba(0,0,0,0.92)', borderBottom: '1px solid #1f2937',
      display: 'flex', alignItems: 'center', padding: '0 28px',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.png" alt="Normies"
          style={{ width: 36, height: 36, imageRendering: 'pixelated', borderRadius: 4 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.03em', lineHeight: 1.2 }}>
            It&apos;s a Normie World
          </span>
          <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.1em' }}>
            World live simulation
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          by{' '}
          <a href="https://x.com/Scabanel_" target="_blank" rel="noopener noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >@Scabanel_</a>
        </span>
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <a key={href} href={href} style={{
              fontSize: 12, color: active ? '#fff' : '#9ca3af',
              textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '8px 16px',
              border: `1px solid ${active ? '#6b7280' : '#374151'}`,
              borderRadius: 4, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#6b7280' }}
              onMouseLeave={e => {
                e.currentTarget.style.color = active ? '#fff' : '#9ca3af'
                e.currentTarget.style.borderColor = active ? '#6b7280' : '#374151'
              }}
            >{label} →</a>
          )
        })}
      </nav>
    </header>
  )
}
