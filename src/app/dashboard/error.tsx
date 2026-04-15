'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <AlertTriangle size={26} color="#EF4444" />
        </div>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginBottom: 10,
        }}>
          This page failed to load
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Something went wrong while rendering this page. The rest of the dashboard is still working.
        </p>
        {error?.digest && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, fontFamily: 'var(--font-mono, monospace)', marginBottom: 20 }}>
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Try again
          </button>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8,
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            fontSize: 13, fontWeight: 500, textDecoration: 'none',
          }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
