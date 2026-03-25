'use client'

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 h-8 flex items-center px-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <div className="flex-1 pointer-events-auto">
        <span className="font-mono text-[9px] text-[#484A4B] tracking-[0.2em] uppercase">
          Normies World Simulation, by{' '}
          <a
            href="https://x.com/Scabanel_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E2E5E4] hover:text-white transition-colors"
          >
            @Scabanel_
          </a>
        </span>
      </div>
      <nav className="pointer-events-auto">
        <a
          href="/explanations"
          className="font-mono text-[9px] text-[#484A4B] hover:text-[#E2E5E4] transition-colors tracking-[0.15em] uppercase"
        >
          Explanations →
        </a>
      </nav>
    </header>
  )
}
