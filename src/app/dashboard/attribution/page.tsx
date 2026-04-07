'use client';
import { useState, useEffect } from 'react';
import { GitBranch, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { PageShell, EmptyState } from '@/components/PageShell';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useIntegrations } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';

type Model = 'first_touch' | 'last_touch' | 'linear';

interface ChannelBreakdown {
  channel: string;
  conversions: number;
  value: number;
  percentage: number;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#22c55e',
  'Direct': '#3b82f6',
  'Social': '#f43f5e',
  'Email': '#f59e0b',
  'Paid Search': '#8b5cf6',
  'Google Ads': '#ea4335',
  'Meta Ads': '#1877f2',
  'Referral': '#06b6d4',
};

export default function AttributionPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const { integrations } = useIntegrations(workspace?.id);
  const [model, setModel] = useState<Model>('last_touch');
  const [data, setData] = useState<{
    breakdown: ChannelBreakdown[];
    totalConversions: number;
    totalValue: number;
    synthesized: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const hasIntegrations = integrations.some((i: any) => i.status === 'connected');

  useEffect(() => {
    if (!workspace?.id) return;
    setLoading(true);
    fetch(`/api/data/attribution?workspace_id=${workspace.id}&model=${model}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspace?.id, model]);

  if (!hasIntegrations && !loading) {
    return (
      <PageShell title="Attribution" description="Understand which channels drive conversions" icon={GitBranch}>
        <EmptyState
          icon={GitBranch}
          title="Connect integrations first"
          description="Connect GA4, Google Ads, or Meta Ads to see cross-channel attribution data."
        />
      </PageShell>
    );
  }

  const breakdown = data?.breakdown || [];
  const hasData = breakdown.length > 0;

  const models: { value: Model; label: string; desc: string }[] = [
    { value: 'first_touch', label: 'First Touch', desc: 'Credits the first channel' },
    { value: 'last_touch', label: 'Last Touch', desc: 'Credits the last channel' },
    { value: 'linear', label: 'Linear', desc: 'Credits all channels equally' },
  ];

  return (
    <PageShell title="Attribution" description="Understand which channels drive conversions" icon={GitBranch}>
      {/* Model Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {models.map(m => (
          <button
            key={m.value}
            onClick={() => setModel(m.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${model === m.value ? c.accent : c.border}`,
              background: model === m.value ? c.accentSubtle : 'transparent',
              color: model === m.value ? c.accent : c.textSecondary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, backgroundColor: c.bgCard, borderRadius: 12, border: `1px solid ${c.border}` }} className="animate-pulse" />
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={PieChart}
          title="No attribution data yet"
          description="Sync your integrations to populate attribution data. We'll analyze traffic sources across all your connected platforms."
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', marginBottom: 10 }}>Channels</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: c.text, fontFamily: 'var(--font-mono)' }}>{breakdown.length}</div>
            </div>
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', marginBottom: 10 }}>Total Conversions</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: c.text, fontFamily: 'var(--font-mono)' }}>{data?.totalConversions?.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', marginBottom: 10 }}>Total Value</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: c.text, fontFamily: 'var(--font-mono)' }}>
                {data?.totalValue ? `$${data.totalValue.toLocaleString()}` : '$0'}
              </div>
            </div>
          </div>

          {data?.synthesized && (
            <div style={{ backgroundColor: c.accentSubtle, border: `1px solid ${c.accent}30`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: c.accent, fontWeight: 600, marginBottom: 6 }}>Attribution is synthesized from your GA4, GSC, and Ads data.</p>
              <p style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>For real user-level attribution, install the Lumnix pixel on your site:</p>
              <code style={{ display: 'block', padding: '8px 12px', borderRadius: 6, backgroundColor: c.bgPage, border: `1px solid ${c.border}`, fontSize: 11, color: c.text, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://lumnix-ai.vercel.app'}/lmnx.js" data-workspace="${workspace?.id || 'YOUR_WORKSPACE_ID'}"></script>`}
              </code>
            </div>
          )}

          {/* Channel Chart */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 16 }}>Channel Attribution ({models.find(m => m.value === model)?.label})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdown} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" tick={{ fill: c.textMuted, fontSize: 11 }} />
                <YAxis dataKey="channel" type="category" tick={{ fill: c.textSecondary, fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [
                    name === 'percentage' ? `${value}%` : value.toLocaleString(),
                    name === 'percentage' ? 'Share' : name
                  ]}
                />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[entry.channel] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Table */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  {['Channel', 'Share', 'Conversions', 'Value'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row, i) => (
                  <tr key={row.channel} style={{ borderBottom: i < breakdown.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: CHANNEL_COLORS[row.channel] || '#6b7280' }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{row.channel}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, backgroundColor: c.bgCardHover, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${row.percentage}%`, height: '100%', backgroundColor: CHANNEL_COLORS[row.channel] || '#6b7280', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{row.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: c.text, fontFamily: 'var(--font-mono)' }}>{row.conversions.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: c.text, fontFamily: 'var(--font-mono)' }}>{row.value > 0 ? `$${row.value.toLocaleString()}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  );
}
