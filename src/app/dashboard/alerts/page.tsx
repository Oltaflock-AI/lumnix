'use client';
import { useState } from 'react';
import { Bell, Plus, AlertCircle, AlertTriangle, Info, CheckCircle2, X, Check, Toggle } from 'lucide-react';
import { PageShell } from '@/components/PageShell';

type Severity = 'critical' | 'warning' | 'info' | 'success';

const initialAlerts = [
  { id: 1, text: 'Traffic spike: +34% on /pricing page', severity: 'info' as Severity, time: '2h ago', source: 'GA4', dismissed: false },
  { id: 2, text: 'Google Ads CPC increased by 22% vs last week', severity: 'warning' as Severity, time: '5h ago', source: 'Google Ads', dismissed: false },
  { id: 3, text: 'Meta campaign "Spring" exhausted daily budget at 2PM', severity: 'critical' as Severity, time: '8h ago', source: 'Meta Ads', dismissed: false },
  { id: 4, text: 'Keyword "ai automation" moved from #8 to #3', severity: 'success' as Severity, time: '1d ago', source: 'GSC', dismissed: false },
  { id: 5, text: 'SSL certificate expires in 14 days', severity: 'warning' as Severity, time: '1d ago', source: 'Site Health', dismissed: false },
  { id: 6, text: 'Meta Ads frequency >4 on "Retargeting" — audience fatigue risk', severity: 'warning' as Severity, time: '2d ago', source: 'Meta Ads', dismissed: false },
  { id: 7, text: 'ROAS dropped below 2x on "Competitor Keywords" campaign', severity: 'critical' as Severity, time: '2d ago', source: 'Google Ads', dismissed: false },
  { id: 8, text: 'Organic CTR for /ai-receptionist improved to 6.2%', severity: 'success' as Severity, time: '3d ago', source: 'GSC', dismissed: false },
];

const initialRules = [
  { id: 1, metric: 'Organic Traffic', condition: 'drops by more than', threshold: '20%', channel: 'GA4', enabled: true },
  { id: 2, metric: 'Google Ads CPC', condition: 'exceeds', threshold: '$5.00', channel: 'Google Ads', enabled: true },
  { id: 3, metric: 'ROAS', condition: 'falls below', threshold: '2x', channel: 'Google Ads', enabled: true },
  { id: 4, metric: 'Meta Ads Frequency', condition: 'exceeds', threshold: '4', channel: 'Meta Ads', enabled: false },
  { id: 5, metric: 'Keyword Position', condition: 'improves by more than', threshold: '5 spots', channel: 'GSC', enabled: true },
];

const severityConfig: Record<Severity, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  success: { icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [rules, setRules] = useState(initialRules);
  const [filter, setFilter] = useState('All');
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ metric: '', condition: 'exceeds', threshold: '', channel: 'GA4', notify: true });

  const filters = ['All', 'Critical', 'Warning', 'Info'];

  const visibleAlerts = alerts.filter(a => {
    if (a.dismissed) return false;
    if (filter === 'All') return true;
    return a.severity === filter.toLowerCase();
  });

  function dismissAlert(id: number) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }

  function toggleRule(id: number) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function addRule() {
    if (!newRule.metric || !newRule.threshold) return;
    setRules(prev => [...prev, { id: Date.now(), ...newRule, enabled: true }]);
    setNewRule({ metric: '', condition: 'exceeds', threshold: '', channel: 'GA4', notify: true });
    setShowAddRule(false);
  }

  const inputStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '13px', outline: 'none' };

  return (
    <PageShell title="Alerts" description="Anomaly detection & threshold alerts" icon={Bell}>

      {/* Filter + Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: filter === f ? '#7c3aed' : '#27272a', color: filter === f ? 'white' : '#a1a1aa', fontSize: '13px', cursor: 'pointer', fontWeight: filter === f ? 600 : 400 }}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowAddRule(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Add Alert Rule
        </button>
      </div>

      {/* Alert Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {visibleAlerts.length === 0 && (
          <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#52525b', fontSize: '14px' }}>
            No alerts matching this filter.
          </div>
        )}
        {visibleAlerts.map(alert => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div key={alert.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={config.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#e4e4e7', fontWeight: 500 }}>{alert.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#27272a', color: '#a1a1aa' }}>{alert.source}</span>
                  <span style={{ fontSize: '11px', color: '#52525b' }}>{alert.time}</span>
                </div>
              </div>
              <button onClick={() => dismissAlert(alert.id)} style={{ padding: '4px', background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Alert Rules */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', marginBottom: '16px' }}>Alert Rules</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: showAddRule ? '16px' : '0' }}>
          {rules.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', border: '1px solid #27272a', backgroundColor: '#1c1c1f', opacity: r.enabled ? 1 : 0.5 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '14px', color: '#e4e4e7', fontWeight: 500 }}>{r.metric}</span>
                <span style={{ fontSize: '14px', color: '#71717a' }}> {r.condition} </span>
                <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 600 }}>{r.threshold}</span>
              </div>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#27272a', color: '#71717a' }}>{r.channel}</span>
              {/* Toggle */}
              <div onClick={() => toggleRule(r.id)} style={{ width: '38px', height: '22px', borderRadius: '11px', cursor: 'pointer', position: 'relative', backgroundColor: r.enabled ? '#7c3aed' : '#3f3f46', transition: 'background-color 0.2s', flexShrink: 0 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: r.enabled ? '19px' : '3px', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px dashed #3f3f46', backgroundColor: '#1c1c1f' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Metric</label>
                <input value={newRule.metric} onChange={e => setNewRule(p => ({ ...p, metric: e.target.value }))} placeholder="e.g. Traffic" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Condition</label>
                <select value={newRule.condition} onChange={e => setNewRule(p => ({ ...p, condition: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                  <option>exceeds</option>
                  <option>falls below</option>
                  <option>drops by more than</option>
                  <option>improves by more than</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Threshold</label>
                <input value={newRule.threshold} onChange={e => setNewRule(p => ({ ...p, threshold: e.target.value }))} placeholder="e.g. 20%" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Channel</label>
                <select value={newRule.channel} onChange={e => setNewRule(p => ({ ...p, channel: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                  <option>GA4</option>
                  <option>GSC</option>
                  <option>Google Ads</option>
                  <option>Meta Ads</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={addRule} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                <button onClick={() => setShowAddRule(false)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
