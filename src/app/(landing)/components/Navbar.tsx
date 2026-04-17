'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

/* Mono 2.0 logo mark — hot pink circle with inline bar-chart glyph */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <circle cx="44" cy="44" r="42" fill="#FF0066" />
      <rect x="24" y="18" width="12" height="52" rx="2" fill="white" />
      <rect x="24" y="58" width="36" height="12" rx="2" fill="white" />
      <rect x="46" y="36" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
      <rect x="46" y="43" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
      <rect x="46" y="50" width="14" height="3" rx="1.5" fill="white" opacity="0.7" />
    </svg>
  );
}

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <a href="#main-content" className="wr-skip-link">Skip to content</a>
      <nav className={`wr-nav ${scrolled ? 'wr-nav--scrolled' : 'wr-nav--top'}`} aria-label="Main navigation">
        <Link href="/" className="wr-nav-brand">
          <LogoMark size={28} />
          <span className="wr-nav-brand-text">Lumnix</span>
        </Link>

        <div className="wr-nav-right">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="wr-nav-link"
            >
              {link.label}
            </a>
          ))}
          <Link href="/auth/signup" className="wr-cta wr-cta--nav">
            Get early access
          </Link>
          <button
            className="wr-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`wr-mobile-menu ${menuOpen ? 'wr-mobile-menu--open' : ''}`} role="navigation" aria-label="Mobile navigation">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
        <Link href="/auth/signup" className="wr-cta" style={{ marginTop: 8, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
          Get early access
        </Link>
      </div>
    </>
  );
}
