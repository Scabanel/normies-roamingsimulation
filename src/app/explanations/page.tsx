import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Know more about this project — Normies World',
  description: 'Everything you need to know about the Normies World Simulation.',
}

export default function ExplanationsPage() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000', color: '#e5e7eb',
      fontFamily: "'Courier New', monospace",
      overflowY: 'auto',
    }}>

      {/* Sticky nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.96)',
        borderBottom: '1px solid #2a2a2a',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← BACK TO WORLD
          </Link>
          <div style={{ flex: 1 }} />
          <a href="https://normies.art" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#888', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            normies.art ↗
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ borderBottom: '1px solid #222', padding: '100px 28px 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: '#888', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 24 }}>
            Normies World Simulation
          </p>
          <h1 style={{ fontSize: 'clamp(38px, 6vw, 66px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28 }}>
            Know more about<br />
            <span style={{ color: '#555' }}>this project</span>
          </h1>
          <p style={{ fontSize: 16, color: '#bbb', maxWidth: 520, lineHeight: 1.9 }}>
            Every Normie NFT lives on a 3D globe, roaming continents, sleeping at night, flying, teleporting — all driven by real time and on-chain traits.
          </p>
        </div>
      </section>

      {/* Two column layout */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 28px' }}>

        {/* What is it */}
        <Row>
          <ColLabel>01 — Vision</ColLabel>
          <ColContent>
            <h2 style={H2}>What is Normies World?</h2>
            <p style={P}>
              Every single Normies NFT (up to #8888) is represented as a living pixel character on a 3D globe. They walk, travel, sleep, and talk — all driven by real-world time and their on-chain traits.
            </p>
            <p style={{ ...P, marginTop: 18 }}>
              The simulation runs 24/7. Find your Normie. Watch what it does. Come back tomorrow — it might be on a different continent.
            </p>
          </ColContent>
        </Row>

        <Divider />

        {/* Types grid */}
        <Row>
          <ColLabel>02 — Characters</ColLabel>
          <ColContent>
            <h2 style={H2}>Four types. One world.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, marginTop: 28, border: '1px solid #222' }}>
              {[
                { type: 'Human',  color: '#5ba3ff', dot: '#3b82f6', desc: 'Roam on foot. Occasionally fly between continents. Sleep when night falls at their location.' },
                { type: 'Alien',  color: '#c060ff', dot: '#a855f7', desc: 'Never sleep. Teleport across the globe. Gather in circles at night, then scatter at dawn.' },
                { type: 'Cat',    color: '#ff9f35', dot: '#f97316', desc: 'Follow humans around. Meow a lot. Mostly vibe.' },
                { type: 'Agent',  color: '#aaa',    dot: '#888',    desc: 'Use underground tunnels to travel secretly between cities. Always on mission.' },
              ].map(({ type, color, dot, desc }) => (
                <div key={type} style={{ padding: '24px 20px', background: '#0a0a0a', borderRight: '1px solid #222', borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{type}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.8 }}>{desc}</p>
                </div>
              ))}
            </div>
          </ColContent>
        </Row>

        <Divider />

        {/* Day/Night */}
        <Row>
          <ColLabel>03 — Day & Night</ColLabel>
          <ColContent>
            <h2 style={H2}>Real sun. Real time.</h2>
            <p style={P}>
              The simulation uses actual UTC time to calculate the sun&apos;s position on Earth right now, including seasonal tilt. Normies on the lit side are awake. Those in the dark are sleeping and invisible until sunrise.
            </p>
            <p style={{ ...P, marginTop: 18 }}>
              Aliens are the only exception — they never sleep and gather in circles on the night side of the globe.
            </p>
            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              {[
                { icon: '☀️', label: 'Day side', sub: 'Awake & roaming' },
                { icon: '🌙', label: 'Night side', sub: 'Sleeping & invisible' },
                { icon: '👾', label: 'Aliens', sub: 'Active 24/7' },
              ].map(({ icon, label, sub }) => (
                <div key={label} style={{ flex: 1, padding: '18px 16px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 4 }}>
                  <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>
                </div>
              ))}
            </div>
          </ColContent>
        </Row>

        <Divider />

        {/* THE100 */}
        <Row>
          <ColLabel>04 — Rarity</ColLabel>
          <ColContent>
            <h2 style={H2}>THE100</h2>
            <p style={P}>
              The rarest Normies — flagged THE100 — are highlighted with a gold border and dot, loaded first, and always visible in the crowd. They stand apart.
            </p>
            <div style={{ marginTop: 24, display: 'inline-block', padding: '12px 20px', border: '1px solid #d4a800', borderRadius: 4, background: 'rgba(212,168,0,0.08)' }}>
              <span style={{ fontSize: 13, color: '#ffd700', letterSpacing: '0.12em', fontWeight: 700 }}>★ THE100</span>
            </div>
          </ColContent>
        </Row>

        <Divider />

        {/* How to use */}
        <Row>
          <ColLabel>05 — Controls</ColLabel>
          <ColContent>
            <h2 style={H2}>How to explore</h2>
            <div style={{ marginTop: 20 }}>
              {([
                ['Drag',           'Rotate the globe'],
                ['Scroll',         'Zoom in & out'],
                ['Click a dot',    'Focus on a Normie — camera flies to it'],
                ['ESC',            'Release camera, explore freely'],
                ['Find my Normie', 'Enter a token ID to jump to your Normie'],
              ] as [string, string][]).map(([key, val], i) => (
                <div key={key} style={{
                  display: 'flex', gap: 0,
                  borderTop: i === 0 ? '1px solid #222' : 'none',
                  borderBottom: '1px solid #222',
                }}>
                  <div style={{ padding: '16px 20px 16px 0', fontSize: 14, fontWeight: 700, color: '#fff', minWidth: 180, flexShrink: 0 }}>{key}</div>
                  <div style={{ padding: '16px 0', fontSize: 14, color: '#bbb' }}>{val}</div>
                </div>
              ))}
            </div>
          </ColContent>
        </Row>

        <Divider />

        {/* Changelog */}
        <Row>
          <ColLabel>06 — Changelog</ColLabel>
          <ColContent>
            <h2 style={H2}>Updates</h2>
            <div style={{ marginTop: 24 }}>
              {[
                { date: 'March 2026', title: 'Alien night-gathering', desc: 'Aliens in the dark converge into circles on night continents. At dawn, they teleport to lit locations.' },
                { date: 'March 2026', title: 'UI redesign', desc: 'Fixed header, collectible NormieCard, larger pixel clock, Find My Normie panel.' },
                { date: 'March 2026', title: 'Day/Night system', desc: 'Real sun position drives visibility. Seasonal declination included. Normies sleep on the dark side.' },
                { date: 'March 2026', title: 'Travel system', desc: 'Humans fly, Aliens teleport, Agents take underground tunnels, Cats follow humans.' },
                { date: 'March 2026', title: 'Initial release', desc: '8,888 Normies placed on a live 3D globe, roaming in real time with seeded daily positions.' },
              ].map(({ date, title, desc }, i) => (
                <div key={title} style={{ display: 'flex', gap: 24, borderTop: i === 0 ? '1px solid #222' : 'none', borderBottom: '1px solid #222', padding: '22px 0' }}>
                  <div style={{ minWidth: 110, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#888', letterSpacing: '0.06em' }}>{date}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 7 }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#bbb', lineHeight: 1.8 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </ColContent>
        </Row>

        <Divider />

        {/* Contact */}
        <Row>
          <ColLabel>07 — Contact</ColLabel>
          <ColContent>
            <h2 style={H2}>Get in touch</h2>
            <p style={P}>Questions, suggestions, or just want to talk Normies?</p>
            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              <a
                href="https://x.com/Scabanel_"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  background: '#fff', color: '#000', padding: '12px 22px', borderRadius: 4,
                  letterSpacing: '0.06em',
                } as React.CSSProperties}
              >
                𝕏 @Scabanel_
              </a>
              <a
                href="https://normies.art"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: '#bbb', textDecoration: 'none',
                  border: '1px solid #333', padding: '12px 22px', borderRadius: 4,
                  letterSpacing: '0.06em',
                }}
              >
                normies.art ↗
              </a>
            </div>
          </ColContent>
        </Row>

      </div>

      <footer style={{ borderTop: '1px solid #222', padding: '40px 28px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Normies World Simulation — Built by{' '}
          <a href="https://x.com/Scabanel_" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>@Scabanel_</a>
          {' '}— Community project, not affiliated with the official Normies project
        </p>
      </footer>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 48, alignItems: 'start' }}>
      {children}
    </div>
  )
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 4, fontSize: 12, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1.6, position: 'sticky', top: 72 }}>
      {children}
    </div>
  )
}

function ColContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

function Divider() {
  return <div style={{ height: 1, background: '#222', margin: '64px 0' }} />
}

const H2: React.CSSProperties = {
  fontSize: 28, fontWeight: 800, color: '#fff',
  letterSpacing: '-0.01em', marginBottom: 18, lineHeight: 1.2,
}

const P: React.CSSProperties = {
  fontSize: 15, color: '#bbb', lineHeight: 1.9, maxWidth: 580,
}
