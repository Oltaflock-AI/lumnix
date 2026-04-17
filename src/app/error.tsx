'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      backgroundColor: '#0C0C10', color: '#F0F0F5',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Image src="/logo-mark.svg" alt="Lumnix" width={40} height={40} priority style={{ borderRadius: 10, opacity: 0.6 }} />
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <AlertTriangle size={26} color="#EF4444" />
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.15,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginBottom: 14,
        }}>
          Something broke on our end.
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(240,237,255,0.65)', lineHeight: 1.6, marginBottom: 28 }}>
          We've logged the error. Try reloading the page, or head back to your dashboard.
        </p>
        {error?.digest && (
          <p style={{ fontSize: 11, color: 'rgba(240,237,255,0.35)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 24 }}>
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 22px', borderRadius: 10,
            background: 'var(--accent, #FF0066)', color: '#fff',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 0 24px rgba(255,0,102,0.3)',
          }}>
            <RefreshCw size={15} /> Try again
          </button>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 22px', borderRadius: 10,
            background: 'transparent', color: '#9CA3AF',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
          }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
