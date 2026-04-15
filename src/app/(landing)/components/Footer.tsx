'use client';

import Image from 'next/image';
import Link from 'next/link';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'AI Assistant', href: '#lumi' },
      { label: 'Competitor Spy', href: '#adspy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: 'mailto:hello@oltaflock.ai' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="wr-footer">
      <div className="wr-footer-inner">
        <div className="wr-footer-grid">
          <div className="wr-footer-brand">
            <Link href="/" className="wr-nav-brand">
              <Image src="/favicon.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
              <span className="wr-nav-brand-text">Lumnix</span>
            </Link>
            <p className="wr-footer-tagline">
              Marketing intelligence for D2C brands and agencies.
            </p>
            <p className="wr-footer-by">by Oltaflock AI</p>
          </div>

          {cols.map(col => (
            <div key={col.title} className="wr-footer-col">
              <div className="wr-footer-col-title">{col.title}</div>
              {col.links.map(l => (
                <Link key={l.label} href={l.href} className="wr-footer-link">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="wr-footer-bottom">
          <span>© 2026 Oltaflock AI. All rights reserved.</span>
          <span>Made in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}
