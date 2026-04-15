'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`wr-nav ${scrolled ? 'wr-nav--scrolled' : 'wr-nav--top'}`}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '8px 0', minHeight: 44 }}>
        <Image src="/favicon.png" alt="Lumnix" width={28} height={28} style={{ borderRadius: 7 }} priority />
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>Lumnix</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Desktop only nav links */}
        {['Features', 'Pricing'].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="wr-nav-link"
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 150ms', padding: '12px 16px', minHeight: 44, alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            {link}
          </a>
        ))}
        <Link href="/auth/signup" className="wr-cta" style={{ padding: '10px 20px', fontSize: 13, borderRadius: 10, minHeight: 44, whiteSpace: 'nowrap' }}>
          Get early access
        </Link>
      </div>
    </nav>
  );
}
