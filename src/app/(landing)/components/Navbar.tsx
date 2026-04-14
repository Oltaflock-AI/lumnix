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
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '8px 0', minHeight: 44 }}>
        <Image src="/lumnix-logo.png" alt="Lumnix" width={130} height={30} style={{ objectFit: 'contain' }} priority />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden md:flex">
        {['Features', 'Pricing'].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 150ms', padding: '12px 16px', minHeight: 44, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            {link}
          </a>
        ))}
        <Link href="/auth/signup" className="wr-cta" style={{ padding: '12px 24px', fontSize: 14, borderRadius: 10, minHeight: 44 }}>
          Get early access
        </Link>
      </div>
    </nav>
  );
}
