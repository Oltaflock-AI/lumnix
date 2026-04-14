'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '10px 0', minHeight: 44 }}>
          <Image src="/favicon.png" alt="Lumnix" width={24} height={24} style={{ borderRadius: 6 }} />
          <Image src="/lumnix-logo.png" alt="Lumnix" width={90} height={20} style={{ objectFit: 'contain', opacity: 0.6 }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }].map(link => (
            <Link key={link.label} href={link.href} style={{
              fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 150ms',
              padding: '12px 14px', minHeight: 44, display: 'flex', alignItems: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
              {link.label}
            </Link>
          ))}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', padding: '0 8px' }}>
            © 2026 Oltaflock AI
          </span>
        </div>
      </div>
    </footer>
  );
}
