'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      backgroundColor: '#0C0C10',
      color: '#F0F0F5',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/logo-mark.svg" alt="Lumnix" width={48} height={48} priority style={{ borderRadius: 12 }} />
        </div>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#FF85B5', marginBottom: 16,
        }}>404 · Page not found</p>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800,
          letterSpacing: '-0.035em', lineHeight: 1.1,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginBottom: 16,
        }}>
          This page wandered off.
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(240,237,255,0.65)', lineHeight: 1.6, marginBottom: 32 }}>
          The link is broken or the page moved. Head back to your dashboard, or browse the homepage.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 22px', borderRadius: 10, background: 'var(--accent, #FF0066)',
            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 0 24px rgba(255,0,102,0.3)',
          }}>
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 22px', borderRadius: 10,
            background: 'transparent', color: '#9CA3AF',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
          }}>
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
