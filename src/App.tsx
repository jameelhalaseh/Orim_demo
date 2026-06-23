import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

// Placeholder background video — swap for an Orim brand video or a static image.
const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4'

type NavLink = { label: string; active?: boolean; dropdown?: boolean }

const navLinks: NavLink[] = [
  { label: 'Home', active: true },
  { label: 'Shop', dropdown: true },
  { label: 'Gifts' },
  { label: 'Our Story' },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900">
      {/* Looping background video (placeholder) */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        src={BG_VIDEO}
      />
      {/* Readability overlay so light text stays legible over the video */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5 text-white font-medium text-base">
          <img src="/orim-logo.png" alt="Orim logo" className="w-9 h-9 rounded-full" />
          <span>Orim</span>
        </div>

        {/* Center nav pill (desktop) */}
        <div className="liquid-glass hidden md:flex items-center gap-1 rounded-xl px-2 py-2">
          {navLinks.map((link) => (
            <button
              key={link.label}
              className={`flex items-center gap-0.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                link.active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
              {link.dropdown && <ChevronDown size={13} className="mt-px" />}
            </button>
          ))}
        </div>

        {/* CTAs (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <button className="liquid-glass text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/5 transition-colors">
            Log in
          </button>
          <button className="bg-[#C53735] text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[#AE2F2D] transition-colors">
            Shop now
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="liquid-glass md:hidden text-white p-2 rounded-lg"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-[72px] left-4 right-4 z-30 md:hidden liquid-glass rounded-2xl p-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              {link.label}
              {link.dropdown && <ChevronDown size={14} />}
            </button>
          ))}
          <div className="flex gap-2 mt-2 pt-3 border-t border-white/10">
            <button className="flex-1 liquid-glass text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/5 transition-colors">
              Log in
            </button>
            <button className="flex-1 bg-[#C53735] text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[#AE2F2D] transition-colors">
              Shop now
            </button>
          </div>
        </div>
      )}

      {/* Hero content */}
      <div className="absolute bottom-0 left-0 z-20 px-6 sm:px-12 pb-10 sm:pb-16 max-w-2xl">
        <span className="inline-block liquid-glass text-white/85 text-xs font-medium tracking-wide uppercase mb-4 px-3 py-1 rounded-full">
          Christian gifts &middot; Amman &amp; Beirut
        </span>
        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight mb-4">
          Encouraging gifts for the people you love.
        </h1>
        <p className="text-white/70 text-sm leading-relaxed mb-7 max-w-md">
          Faith-inspired books, keepsakes, and gifts &mdash; thoughtfully made and delivered
          across Amman and Beirut. Order today, with free delivery.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="bg-[#C53735] text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-[#AE2F2D] transition-colors">
            Shop gifts
          </button>
          <button className="liquid-glass text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/5 transition-colors">
            Our story
          </button>
        </div>
      </div>
    </div>
  )
}
