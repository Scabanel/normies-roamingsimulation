import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explanations — Normies World Simulation',
}

export default function ExplanationsPage() {
  return (
    <main className="min-h-screen bg-black text-[#E2E5E4]">
      {/* Header */}
      <header className="border-b border-gray-900 px-6 py-3 flex items-center">
        <Link href="/" className="font-mono text-[9px] text-[#484A4B] hover:text-[#E2E5E4] transition-colors tracking-widest uppercase">
          ← Back to the World
        </Link>
        <span className="font-mono text-[9px] text-[#484A4B] ml-auto tracking-[0.2em] uppercase">
          Normies World Simulation, by{' '}
          <a href="https://x.com/Scabanel_" target="_blank" rel="noopener noreferrer"
            className="text-[#E2E5E4] hover:text-white transition-colors">
            @Scabanel_
          </a>
        </span>
      </header>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-6 py-16 font-mono">
        <h1 className="text-lg text-[#E2E5E4] tracking-widest uppercase mb-2">
          Normies World Simulation
        </h1>
        <p className="text-[10px] text-[#484A4B] tracking-widest uppercase mb-16">
          What this is and why it exists
        </p>

        <section className="mb-12">
          <h2 className="text-[10px] text-[#E2E5E4] tracking-widest uppercase mb-6 border-b border-gray-900 pb-2">
            The Vision
          </h2>
          <div className="space-y-4 text-[11px] text-[#484A4B] leading-relaxed">
            <p>
              Every Normie NFT that has ever been minted and not burned lives here.
              They roam the Earth in real time — walking, flying, teleporting, sleeping —
              each one following the rules of its type.
            </p>
            <p>
              This is not a gallery. It is a world. One that runs 24 hours a day,
              synced to real time, on a real globe. Zoom in far enough and you will find
              your Normie. Watch what it does. Who it meets. What it says.
            </p>
            <p>
              The project exists because NFTs should feel alive. Not just owned.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[10px] text-[#E2E5E4] tracking-widest uppercase mb-6 border-b border-gray-900 pb-2">
            The Rules
          </h2>
          <div className="space-y-6 text-[11px] text-[#484A4B] leading-relaxed">
            <div>
              <div className="text-[#E2E5E4] mb-1">Humans</div>
              <p>Fly to new destinations every minute. Social and mobile. Always going somewhere.</p>
            </div>
            <div>
              <div className="text-purple-500 mb-1">Aliens</div>
              <p>Teleport anywhere on Earth every 5 minutes. Never sleep. Speak French. Observe.</p>
            </div>
            <div>
              <div className="text-orange-500 mb-1">Cats</div>
              <p>Wander slowly. Sometimes follow Humans around. Do not explain themselves.</p>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Agents</div>
              <p>Use underground tunnels between cities. Fly once per minute. Say very little.</p>
            </div>
            <div>
              <div className="text-yellow-500 mb-1">THE100</div>
              <p>The rarest of Normies. Gold bordered. Always visible. Move according to their type, but stand apart.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[10px] text-[#E2E5E4] tracking-widest uppercase mb-6 border-b border-gray-900 pb-2">
            Day & Night
          </h2>
          <div className="text-[11px] text-[#484A4B] leading-relaxed space-y-4">
            <p>
              The simulation runs on real time (CET timezone). When it is night where a Normie stands,
              it sleeps — greyed out, completely still. Aliens never sleep.
            </p>
            <p>
              The clock in the bottom-right shows the current CET time and how many Normies
              are awake versus asleep at any given moment.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[10px] text-[#E2E5E4] tracking-widest uppercase mb-6 border-b border-gray-900 pb-2">
            How to Explore
          </h2>
          <div className="space-y-2 text-[11px] text-[#484A4B]">
            <p><span className="text-[#E2E5E4]">Spin</span> — click and drag to rotate the globe</p>
            <p><span className="text-[#E2E5E4]">Zoom</span> — scroll to get closer to any region</p>
            <p><span className="text-[#E2E5E4]">Click a dot</span> — camera locks onto that Normie and follows it</p>
            <p><span className="text-[#E2E5E4]">Find my Normie</span> — type a Normie number in the bottom-left panel</p>
            <p><span className="text-[#E2E5E4]">ESC</span> — release the camera and explore freely again</p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-[10px] text-[#E2E5E4] tracking-widest uppercase mb-6 border-b border-gray-900 pb-2">
            Update History
          </h2>
          <div className="space-y-4 text-[11px] text-[#484A4B]">
            <div className="flex gap-4">
              <span className="text-gray-800 shrink-0">v1.0</span>
              <span>Initial release — 8888 Normies, 3D globe, travel behaviors, day/night cycle, collector card</span>
            </div>
          </div>
        </section>

        <footer className="border-t border-gray-900 pt-8 text-[10px] text-[#484A4B]">
          <p>
            Questions, feedback, or ideas?{' '}
            <a href="https://x.com/Scabanel_" target="_blank" rel="noopener noreferrer"
              className="text-[#E2E5E4] hover:text-white transition-colors">
              Reach out on X @Scabanel_
            </a>
          </p>
        </footer>
      </article>
    </main>
  )
}
