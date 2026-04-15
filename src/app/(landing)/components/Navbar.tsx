'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

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
          <Image src="/favicon.png" alt="" width={28} height={28} style={{ borderRadius: 7 }} priority />
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
