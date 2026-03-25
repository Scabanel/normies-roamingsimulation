import Link from 'next/link'
import type { Metadata } from 'next'
import NormieWall from '@/components/UI/NormieWall'
import TweetEmbed from '@/components/UI/TweetEmbed'
import NormieCardPreview from '@/components/UI/NormieCardPreview'

const SYS_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'

export const metadata: Metadata = {
  title: "Know more — It's a Normie World",
  description: "Everything you need to know about It's a Normie World simulation.",
}

export default function KnowMorePage() {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      background: '#1A1B1C',
      color: '#e5e7eb',
      fontFamily: SYS_FONT,
    }}>
      {/* Fixed Normie wall — stays behind all content */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <NormieWall
          count={500}
          opacityScale={0.35}
          cellSize="clamp(52px, 5.5vw, 78px)"
          style={{ position: 'absolute', inset: 0 }}
        />
        {/* Dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(26,27,28,0.72)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Scrollable content — sits above the wall */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', overflowY: 'auto' }}>

        {/* Sticky nav */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#1A1B1C',
          borderBottom: '1px solid #2a2a2a',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ← BACK TO NORMIE WORLD
            </Link>
            <div style={{ flex: 1 }} />
            <a href="https://normies.art" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#888', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              normies.art ↗
            </a>
          </div>
        </header>

        {/* Hero */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '100px 28px 80px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <p style={{ fontSize: 12, color: '#888', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 24 }}>
              It&apos;s a Normie World
            </p>
            <h1 style={{ fontSize: 'clamp(38px, 6vw, 66px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28 }}>
              Know more about<br />
              <span style={{ color: '#555' }}>this project</span>
            </h1>
            <p style={{ fontSize: 16, color: '#bbb', maxWidth: 520, lineHeight: 1.9 }}>
              Every Normie NFT lives on a 3D globe, roaming continents, sleeping at night, flying, teleporting... All driven by real time and on-chain traits.
            </p>
          </div>
        </section>

        {/* Two column layout */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 28px' }}>

          <Row>
            <ColLabel>00 — Origin</ColLabel>
            <ColContent>
              <h2 style={H2}>Where it started</h2>
              <p style={P}>
                It all began with a tweet from Serc, a call to take the Normies universe to its next stage. A signal for the community to imagine what this collection could become beyond the static image.
              </p>
              <div style={{ marginTop: 28 }}>
                <TweetEmbed tweetUrl="https://x.com/serc1n/status/2036015952458928138" />
              </div>
              <p style={{ ...P, marginTop: 28 }}>
                After reading that and talking with Serc, the idea came immediately: make it interactive. Make it alive. Give each Normie a life on a planet (no Agents for now), but real behavior, real time, real narrative. Dialogues, a story told through movement, a reason to come back tomorrow.
              </p>
              <p style={{ ...P, marginTop: 18 }}>
                There&apos;s something like a &ldquo;God Mode&rdquo; feel to it you know, watching your Normie from above, following its daily journey across continents, seeing its collectible card...
              </p>
              <p style={{ ...P, marginTop: 18 }}>
                The longer vision: build coherence between the digital, AI Agents and maybe one day the physical: why not a tamagotchi-like object that reflects what your Normie is doing right now?
              </p>
            </ColContent>
          </Row>

          <Divider />

          <Row>
            <ColLabel>01 | Vision</ColLabel>
            <ColContent>
              <h2 style={H2}>What is It&apos;s a Normie World?</h2>
              <p style={P}>
                Every single Normies NFT (up to #10,000) is represented as a living pixel character on our planet Earth. They walk, travel, sleep, and talk, all driven by real-world time and their on-chain traits.
              </p>
              <p style={{ ...P, marginTop: 18 }}>
                The simulation runs 24/7. Find your Normie. Watch what it does. Come back tomorrow and it might be on a different continent, who knows? (Not me)
              </p>
            </ColContent>
          </Row>

          <Divider />

          <Row>
            <ColLabel>02 | Characters</ColLabel>
            <ColContent>
              <h2 style={H2}>Four types. Different behaviours, one world.</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, marginTop: 28, border: '1px solid #2a2a2a' }}>
                {[
                  { type: 'Human',  color: '#5ba3ff', dot: '#3b82f6', desc: 'Roam on foot. Sleep when night falls at their location. Fly in groups between continents, up to 10 group flights per day, shown as green dots with dashed routes.' },
                  { type: 'Alien',  color: '#c060ff', dot: '#a855f7', desc: 'Never sleep. Teleport across the globe. At night...something happens...They are speaking a strange dialect...' },
                  { type: 'Cat',    color: '#ff9f35', dot: '#f97316', desc: 'Follow humans around. Meow a lot. Mostly vibe.' },
                  { type: 'Agent',  color: '#ff4444', dot: '#cc1111', desc: 'Use underground tunnels to travel secretly between cities. Always on mission.' },
                ].map(({ type, color, dot, desc }) => (
                  <div key={type} style={{ padding: '24px 20px', background: 'rgba(10,10,10,0.80)', borderRight: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a' }}>
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

          <Row>
            <ColLabel>03 — Day &amp; Night</ColLabel>
            <ColContent>
              <h2 style={H2}>Real sun. Real time.</h2>
              <p style={P}>
                The simulation uses actual UTC time to calculate the sun&apos;s position on Earth right now, including seasonal tilt. Normies on the lit side are awake. Those in the dark are sleeping and invisible until sunrise...right?
              </p>
              <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                {[
                  { icon: '☀️', label: 'Day side', sub: 'Awake & roaming' },
                  { icon: '🌙', label: 'Night side', sub: 'Sleeping & invisible' },
                  { icon: '👾', label: 'Aliens', sub: 'Active 24/7 because...aliens you know' },
                ].map(({ icon, label, sub }) => (
                  <div key={label} style={{ flex: 1, padding: '18px 16px', background: 'rgba(10,10,10,0.80)', border: '1px solid #2a2a2a', borderRadius: 4 }}>
                    <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 5 }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>
                  </div>
                ))}
              </div>
            </ColContent>
          </Row>

          <Divider />

          <Row>
            <ColLabel>04 | Rarity</ColLabel>
            <ColContent>
              <h2 style={H2}>THE100 — They never sleep.</h2>
              <p style={P}>
                The rarest Normies in existence. Flagged THE100, they are surrounded by a gold luminous square aura — always burning, always visible, even in the darkest night.
              </p>
              <p style={{ ...P, marginTop: 16 }}>
                While regular Normies rest when night falls at their location, THE100 never stop. They roam through the darkness, building, scheming, outpacing everyone else. The planet never truly sleeps as long as they&apos;re on it.
              </p>
              <p style={{ ...P, marginTop: 16 }}>
                On the globe, their square gold light cuts through the dark side of the Earth. You can always find them. You can never ignore them.
              </p>
              <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-block', padding: '12px 20px', border: '1px solid #d4a800', borderRadius: 4, background: 'rgba(212,168,0,0.08)' }}>
                  <span style={{ fontSize: 13, color: '#ffd700', letterSpacing: '0.12em', fontWeight: 700 }}>★ THE100</span>
                </div>
                <span style={{ fontSize: 13, color: '#666' }}>Active 24/7 · Always awake · Square gold aura</span>
              </div>
            </ColContent>
          </Row>

          <Divider />

          <Row>
            <ColLabel>05 | Controls</ColLabel>
            <ColContent>
              <h2 style={H2}>How to explore</h2>
              <div style={{ marginTop: 20 }}>
                {([
                  ['Drag',           'Rotate the globe'],
                  ['Scroll',         'Zoom in & out'],
                  ['Click a dot',    'Focus on a Normie, camera flies to it'],
                  ['ESC',            'Release camera, explore freely'],
                  ['Find my Normie', 'Enter a token ID to jump to your Normie'],
                ] as [string, string][]).map(([key, val], i) => (
                  <div key={key} style={{
                    display: 'flex', gap: 0,
                    borderTop: i === 0 ? '1px solid #2a2a2a' : 'none',
                    borderBottom: '1px solid #2a2a2a',
                  }}>
                    <div style={{ padding: '16px 20px 16px 0', fontSize: 14, fontWeight: 700, color: '#fff', minWidth: 180, flexShrink: 0 }}>{key}</div>
                    <div style={{ padding: '16px 0', fontSize: 14, color: '#bbb' }}>{val}</div>
                  </div>
                ))}
              </div>
            </ColContent>
          </Row>

          <Divider />

          <Row>
            <ColLabel>06 | Changelog</ColLabel>
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
                  <div key={title} style={{ display: 'flex', gap: 24, borderTop: i === 0 ? '1px solid #2a2a2a' : 'none', borderBottom: '1px solid #2a2a2a', padding: '22px 0' }}>
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

          <Row>
            <ColLabel>07 | Collectibles</ColLabel>
            <ColContent>
              <h2 style={H2}>Your Normie. As a card.</h2>
              <p style={P}>
                Every Normie has a collectible card — on-chain traits, pixel portrait, type accent. Click any Normie in the collection to open it.
              </p>
              <div style={{ marginTop: 32, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                <NormieCardPreview normieId={9772} />

                <div style={{ flex: 1, minWidth: 200, paddingTop: 8 }}>
                  <p style={P}>
                    Each card shows the real on-chain traits of the Normie, its type accent color, and a link to OpenSea. From the collection page, you can also download any card as a PNG.
                  </p>
                  <p style={{ ...P, marginTop: 16 }}>
                    This is just the beginning of what a collectible can be in this universe. Physical objects, limited prints, dynamic cards that reflect the Normie&apos;s live position — all possibilities.
                  </p>
                  <div style={{ marginTop: 20 }}>
                    <a href="/collection" style={{ display: 'inline-block', fontSize: 12, color: '#9ca3af', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 18px', border: '1px solid #374151', borderRadius: 4 }}>
                      Browse the collection →
                    </a>
                  </div>
                </div>
              </div>
            </ColContent>
          </Row>

          <Divider />

          <Row>
            <ColLabel>08 | Who Am I?</ColLabel>
            <ColContent>
              <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Normie card */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://api.normies.art/normie/9772/image.png"
                    alt="Normie #9772"
                    style={{ width: 96, height: 96, imageRendering: 'pixelated', border: '1px solid #2a2a2a', borderRadius: 4, background: '#111' }}
                  />
                  <span style={{ fontSize: 11, color: '#666', letterSpacing: '0.1em', fontFamily: 'monospace' }}>#9772</span>
                </div>

                {/* Bio */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h2 style={{ ...H2, marginBottom: 8 }}>Scabanel</h2>
                  <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>
                    CMO · Content Creator · Developer
                  </p>
                  <p style={P}>
                    Tech marketing specialist and content creator for years, building in Web3 too, including with{' '}
                    <a href="https://x.com/zKorp_" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none' }}>@zKorp_</a>
                    {' '}among other clients.
                  </p>
                  <p style={{ ...P, marginTop: 14 }}>
                    My approach revolves around narrative, universe building, business vision and storytelling. That&apos;s what I love most about certain NFT projects, the ability to build a world with lore, characters, and meaning. Plus the tech side of things: I was a developer before I was anything else.
                  </p>
                  <p style={{ ...P, marginTop: 14 }}>
                    This simulation is a personal project born from that mix, part "fan" work, part experiment, part contributing on a larger scale (ego, idk)
                  </p>
                  <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href="https://x.com/Scabanel_"
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', background: '#fff', color: '#000', padding: '10px 18px', borderRadius: 4, letterSpacing: '0.06em' } as React.CSSProperties}
                    >
                      𝕏 @Scabanel_
                    </a>
                  </div>
                  <p style={{ marginTop: 14, fontSize: 12, color: '#555' }}>
                    Feel free to ping me on Discord! I probably won&apos;t see it otherwise!
                  </p>
                </div>
              </div>
            </ColContent>
          </Row>
        </div>

        {/* Footer */}
        <footer style={{ background: '#1A1B1C', borderTop: '1px solid #2a2a2a', padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            It&apos;s a Normie World · Built by{' '}
            <a href="https://x.com/Scabanel_" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>@Scabanel_</a>
          </p>
        </footer>
      </div>
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
    <div style={{ paddingTop: 4, fontSize: 12, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1.6, position: 'sticky', top: 84 }}>
      {children}
    </div>
  )
}

function ColContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '64px 0' }} />
}

const H2: React.CSSProperties = {
  fontSize: 28, fontWeight: 800, color: '#fff',
  letterSpacing: '-0.01em', marginBottom: 18, lineHeight: 1.2,
}

const P: React.CSSProperties = {
  fontSize: 15, color: '#bbb', lineHeight: 1.9, maxWidth: 580,
}
