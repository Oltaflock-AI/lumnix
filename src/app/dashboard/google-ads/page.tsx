'use client';
import { useState } from 'react';
import { DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';

const campaigns = [
  { name: 'Brand - Oltaflock', status: 'Active', spend: 1240, clicks: 890, conversions: 42, roas: 5.8, cpc: 1.39 },
  { name: 'AI Receptionist - Law Firms', status: 'Active', spend: 2180, clicks: 640, conversions: 28, roas: 4.2, cpc: 3.41 },
  { name: 'Voice Agent - SME', status: 'Active', spend: 1560, clicks: 520, conversions: 18, roas: 3.1, cpc: 3.00 },
  { name: 'Retargeting - Website Visitors', status: 'Active', spend: 840, clicks: 1200, conversions: 34, roas: 6.4, cpc: 0.70 },
  { name: 'Competitor Keywords', status: 'Paused', spend: 620, clicks: 180, conversions: 4, roas: 1.2, cpc: 3.44 },
];

const spendData = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  spend: Math.floor(800 + Math.random() * 400),
  conversions: Math.floor(12 + Math.random() * 10),
}));

export default function GoogleAdsPage() {
  const [days, setDays] = useState(30);
  return (
    <PageShell title="Google Ads" description="Campaign performance & spend tracking" icon={DollarSign}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Spend', value: '$6,440', change: '-5.2%', up: false, color: '#f59e0b' },
          { label: 'Conversions', value: '126', change: '+18.4%', up: true, color: '#22c55e' },
          { label: 'Avg CPC', value: '$2.39', change: '-$0.12', up: true, color: '#3b82f6' },
          { label: 'ROAS', value: '4.2x', change: '+0.6x', up: true, color: '#7c3aed' },
        ].map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: kpi.up ? '#22c55e' : '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', marginBottom: '24px' }}>
        {/* Campaigns */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', marginBottom: '16px' }}>Campaigns</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Campaign', 'Status', 'Spend', 'Clicks', 'Conv', 'ROAS'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', paddingBottom: '10px', borderBottom: '1px solid #27272a' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.name} style={{ borderBottom: '1px solid #1e1e22' }}>
                  <td style={{ padding: '10px 0', fontSize: '13px', color: '#e4e4e7', fontWeight: 500, maxWidth: '200px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: c.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(113,113,122,0.1)', color: c.status === 'Active' ? '#22c55e' : '#71717a' }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#a1a1aa' }}>${c.spend.toLocaleString()}</td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#a1a1aa' }}>{c.clicks.toLocaleString()}</td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#f4f4f5', fontWeight: 600 }}>{c.conversions}</td>
                  <td style={{ padding: '10px 0', fontSize: '13px', fontWeight: 600, color: c.roas >= 4 ? '#22c55e' : c.roas >= 2 ? '#f59e0b' : '#ef4444' }}>{c.roas}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Daily Spend Chart */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', marginBottom: '16px' }}>Daily Spend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spendData}>
              <XAxis dataKey="day" stroke="#3f3f46" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#3f3f46" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} />
              <Bar dataKey="spend" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageShell>
  );
}
