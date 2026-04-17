'use client';
import { useState, useEffect, use } from 'react';
import { BarChart3, TrendingUp, Search, DollarSign, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function SharedDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090B', color: '#fff' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090B', color: '#888', fontSize: 15 }}>
      {error}
    </div>
  );

  const accent = data?.brand_color || '#FF0066';
  const totals = data?.totals || {};
  const daily = data?.daily || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090B', color: '#FAFAFA', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          {data?.logo_url && <img src={data.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>{data?.title || 'Marketing Report'}</h1>
            <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{data?.workspace_name} · {data?.period}</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Sessions', value: totals.sessions?.toLocaleString('en-IN') || '—', icon: BarChart3 },
            { label: 'Organic Clicks', value: totals.organic_clicks?.toLocaleString('en-IN') || '—', icon: Search },
            { label: 'Ad Spend', value: totals.ad_spend ? `₹${totals.ad_spend.toFixed(0)}` : '—', icon: DollarSign },
            { label: 'ROAS', value: totals.roas ? `${totals.roas}x` : '—', icon: TrendingUp },
          ].map(kpi => (
            <div key={kpi.label} style={{ backgroundColor: '#111113', border: '1px solid #222228', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <kpi.icon size={14} color={accent} />
                <span style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: '-0.03em' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {daily.length > 0 && (
          <div style={{ backgroundColor: '#111113', border: '1px solid #222228', borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Traffic Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily.slice(-14).map((r: any) => ({ day: r.date?.slice(5), clicks: r.organic_clicks || 0, paid: r.paid_clicks || 0 }))}>
                <defs>
                  <linearGradient id="gShare" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="transparent" tick={{ fill: '#555', fontSize: 10 }} />
                <YAxis stroke="transparent" tick={{ fill: '#555', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1E', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="clicks" name="Organic" stroke={accent} fill="url(#gShare)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="paid" name="Paid" stroke="#F59E0B" fill="transparent" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: 12, color: '#555' }}>
            Powered by <a href="https://lumnix-ai.vercel.app" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Lumnix</a> · AI Marketing Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
