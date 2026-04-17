'use client';

import Link from 'next/link';

/* Mono 2.0 logo mark — hot pink circle */
function LogoMark({ size = 32 }: { size?: number }) {
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
              <LogoMark size={32} />
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
