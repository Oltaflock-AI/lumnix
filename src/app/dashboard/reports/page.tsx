'use client';
import { useState } from 'react';
import { FileText, Plus, Download, Calendar, Mail, X, Check, Clock } from 'lucide-react';
import { PageShell } from '@/components/PageShell';

const reportTypes = ['Weekly Summary', 'SEO Report', 'Ad Performance', 'Full Marketing Report'];

const mockReports = [
  { id: 1, name: 'Weekly Performance Digest', type: 'Weekly Summary', date: 'Mar 17, 2026', status: 'ready', size: '2.4 MB' },
  { id: 2, name: 'SEO Report — March 2026', type: 'SEO Report', date: 'Mar 1, 2026', status: 'ready', size: '1.8 MB' },
  { id: 3, name: 'Ad Performance — Week 10', type: 'Ad Performance', date: 'Mar 10, 2026', status: 'ready', size: '1.2 MB' },
  { id: 4, name: 'Full Marketing Report Q1', type: 'Full Marketing Report', date: 'Mar 18, 2026', status: 'generating', size: null },
];

const scheduleOptions = [
  { id: 'weekly', label: 'Weekly Digest', desc: 'Every Monday morning' },
  { id: 'monthly', label: 'Monthly Summary', desc: 'First of each month' },
  { id: 'ads', label: 'Ad Performance', desc: 'Every 2 weeks' },
];

export default function ReportsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState(reportTypes[0]);
  const [reportName, setReportName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scheduleToggles, setScheduleToggles] = useState<Record<string, boolean>>({ weekly: true, monthly: false, ads: false });
  const [scheduleEmail, setScheduleEmail] = useState('khush@oltaflock.ai');
  const [savedSchedule, setSavedSchedule] = useState(false);

  function handleGenerate() {
    if (!reportName.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setShowCreate(false); setReportName(''); }, 2000);
    }, 1800);
  }

  function handleDownload(name: string) {
    alert(`Downloading "${name}" — Supabase connection required for real downloads.`);
  }

  return (
    <PageShell title="Reports" description="Scheduled & on-demand marketing reports" icon={FileText}>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => setShowCreate(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Generate Report
        </button>
      </div>

      {/* Generate Panel */}
      {showCreate && (
        <div style={{ backgroundColor: '#18181b', border: '1px solid #7c3aed', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Generate New Report</h3>
            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Report Name</label>
              <input
                value={reportName}
                onChange={e => setReportName(e.target.value)}
                placeholder="e.g. March SEO Summary"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Report Type</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}
              >
                {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: 'transparent', color: '#a1a1aa', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleGenerate} disabled={!reportName.trim() || generating} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: success ? '#22c55e' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: generating ? 'wait' : 'pointer', opacity: !reportName.trim() ? 0.5 : 1 }}>
              {success ? <><Check size={16} /> Done!</> : generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* Report List */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Generated Reports</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a' }}>
              {['Report', 'Type', 'Date', 'Size', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', padding: '10px 16px', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockReports.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} color="#a78bfa" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#e4e4e7' }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#71717a' }}>{r.type}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#71717a' }}>{r.date}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#71717a' }}>{r.size || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  {r.status === 'ready' ? (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Ready</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}><Clock size={11} /> Generating</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleDownload(r.name)} disabled={r.status !== 'ready'} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '12px', cursor: r.status === 'ready' ? 'pointer' : 'not-allowed', opacity: r.status === 'ready' ? 1 : 0.4 }}>
                      <Download size={12} /> PDF
                    </button>
                    <button style={{ padding: '6px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', cursor: 'pointer', display: 'flex' }}>
                      <Mail size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Section */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Scheduled Reports</h2>
            <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>Automatically generate and email reports on a schedule</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              value={scheduleEmail}
              onChange={e => setScheduleEmail(e.target.value)}
              placeholder="Delivery email"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '13px', outline: 'none', width: '220px' }}
            />
            <button onClick={() => { setSavedSchedule(true); setTimeout(() => setSavedSchedule(false), 2000); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', background: savedSchedule ? '#22c55e' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {savedSchedule ? <><Check size={13} /> Saved</> : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {scheduleOptions.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#1c1c1f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} color="#a78bfa" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#e4e4e7' }}>{s.label}</div>
                  <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>{s.desc}</div>
                </div>
              </div>
              {/* Toggle */}
              <div
                onClick={() => setScheduleToggles(t => ({ ...t, [s.id]: !t[s.id] }))}
                style={{
                  width: '42px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative',
                  backgroundColor: scheduleToggles[s.id] ? '#7c3aed' : '#3f3f46',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white',
                  position: 'absolute', top: '3px',
                  left: scheduleToggles[s.id] ? '21px' : '3px',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
