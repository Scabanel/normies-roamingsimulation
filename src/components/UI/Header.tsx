'use client'

export default function Header() {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 30,
      height: 52,
      background: 'rgba(0,0,0,0.92)',
      borderBottom: '1px solid #1f2937',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: '#fff',
          borderRadius: 4,
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 2,
          padding: 4,
        }}>
          {[1,0,0,1, 0,1,1,0, 0,1,1,0, 1,0,0,1].map((on, i) => (
            <div key={i} style={{ background: on ? '#000' : 'transparent', borderRadius: 1 }} />
          ))}
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Normies World
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 2 }}>
          Simulation
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          by{' '}
          <a
            href="https://x.com/Scabanel_"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >
            @Scabanel_
          </a>
        </span>
        <a
          href="/explanations"
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#9ca3af',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '6px 12px',
            border: '1px solid #374151',
            borderRadius: 4,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#6b7280' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#374151' }}
        >
          Know more →
        </a>
      </nav>
    </header>
  )
}
