"use client";
import { useState, useRef, useEffect } from "react";
import { Search, BarChart3, Target, Share2, Check, X, RefreshCw, Loader2, Upload, Users, Mail, Crown, Plus, Trash2, AlertTriangle, Copy, Clock, Link, Database, AlertCircle, Shield, Eye, EyeOff } from "lucide-react";
import { useIntegrations, connectIntegration, syncIntegration } from "@/lib/hooks";
import { useWorkspaceCtx } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { CSSProperties } from "react";

/* ─── Shared Styles Hook (theme-aware) ─── */
function useStyles() {
  const { c, theme } = useTheme();
  const inputBase: React.CSSProperties = {
    width: '100%',
    height: 40,
    padding: '0 12px',
    borderRadius: 8,
    border: `1px solid var(--border-default)`,
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 150ms, box-shadow 150ms',
    outline: 'none',
  };
  const primaryBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 40, padding: '0 20px', borderRadius: 8, border: 'none',
    background: '#7C3AED',
    color: '#FFFFFF',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 150ms, box-shadow 150ms',
  };
  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 40, padding: '0 16px', borderRadius: 8,
    border: `1px solid var(--border-default)`,
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 150ms, border-color 150ms',
  };
  const destructiveBtn: React.CSSProperties = {
    background: 'transparent', color: '#EF4444',
    border: '1px solid #FECACA',
    borderRadius: 8, height: 40, padding: '0 16px', cursor: 'pointer',
    fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'background 150ms, border-color 150ms',
  };
  const card: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 6,
  };
  return { c, inputBase, primaryBtn, ghostBtn, destructiveBtn, card, label };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  return (
    <div
      onClick={onToggle}
      style={{
        width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
        position: 'relative',
        backgroundColor: on ? c.accent : c.borderStrong,
        transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
        position: 'absolute', top: 3,
        left: on ? 21 : 3, transition: 'left 0.2s',
      }} />
    </div>
  );
}

function StatusPill({ connected, label, variant }: { connected: boolean; label?: string; variant?: 'success' | 'error' | 'warning' | 'default' }) {
  const resolvedVariant = variant || (connected ? 'success' : 'default');
  const styles: Record<string, { bg: string; color: string; dot: string }> = {
    success: { bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
    error: { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
    warning: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
    default: { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  };
  const s = styles[resolvedVariant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600,
      padding: '2px 10px', borderRadius: 20,
      backgroundColor: s.bg, color: s.color,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot }} />
      {label || (connected ? 'Connected' : 'Disconnected')}
    </span>
  );
}

const BRAND_COLORS = [
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f59e0b' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Red', value: '#ef4444' },
];

function NotificationsTab() {
  const { c, card, primaryBtn } = useStyles();
  const notifItems = [
    { id: "traffic", label: "Traffic Alerts", desc: "Get notified when traffic spikes or drops significantly" },
    { id: "ads", label: "Ad Alerts", desc: "Budget exhaustion, CPC spikes, ROAS drops" },
    { id: "weekly", label: "Weekly Digest", desc: "A weekly summary of your marketing performance" },
    { id: "monthly", label: "Monthly Report", desc: "Full monthly marketing report delivered to your inbox" },
  ];
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window === 'undefined') return { traffic: true, ads: true, weekly: true, monthly: false };
      const s = localStorage.getItem('lumnix-notif-prefs');
      if (s) return JSON.parse(s);
    } catch {}
    return { traffic: true, ads: true, weekly: true, monthly: false };
  });
  const [saved, setSaved] = useState(false);

  function save() {
    try { localStorage.setItem('lumnix-notif-prefs', JSON.stringify(toggles)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div style={{ ...card }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Notification Preferences</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Choose which alerts and reports you want to receive.</p>
        {notifItems.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 0', gap: 16,
            borderBottom: i < notifItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{item.desc}</div>
            </div>
            <Toggle on={!!toggles[item.id]} onToggle={() => setToggles(t => ({ ...t, [item.id]: !t[item.id] }))} />
          </div>
        ))}
      </div>
      <button onClick={save} style={{
        ...primaryBtn,
        backgroundColor: saved ? c.success : '#7C3AED',
      }}>
        {saved ? <><Check size={16} /> Saved!</> : "Save Preferences"}
      </button>
    </div>
  );
}

function BrandTab({ workspace, onSaved, onUpdate }: { workspace: any; onSaved?: () => void; onUpdate?: (w: any) => void }) {
  const { c, card, label, inputBase, ghostBtn, primaryBtn } = useStyles();
  const { setAccentColor } = useTheme();
  const [brandName, setBrandName] = useState(workspace?.name || '');
  const [brandColor, setBrandColor] = useState(workspace?.brand_color || '#7c3aed');
  const [logoUrl, setLogoUrl] = useState(workspace?.logo_url || '');
  const [logoPreview, setLogoPreview] = useState(workspace?.logo_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspace) {
      setBrandName(workspace.name || '');
      setBrandColor(workspace.brand_color || '#7c3aed');
      setLogoUrl(workspace.logo_url || '');
      setLogoPreview(workspace.logo_url || '');
    }
  }, [workspace?.id]);

  async function handleLogoUpload(file: File) {
    setUploading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not signed in'); setUploading(false); return; }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: brandName, brand_color: brandColor, logo_url: logoUrl }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onUpdate?.({ ...workspace, name: brandName, brand_color: brandColor, logo_url: logoUrl });
        onSaved?.();
        setAccentColor(brandColor);
      } else {
        setError('Failed to save brand settings');
      }
    } catch {
      setError('Failed to save brand settings');
    }
    setSaving(false);
  }

  return (
    <div>
      <div style={{ ...card }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Brand Identity</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Customize your brand name, logo, and colors.</p>

        {/* Brand Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Brand Name</label>
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="e.g. Acme Corp"
            style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
          />
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 8,
              backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              border: '1px solid var(--border-default)',
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700, color: brandColor }}>{brandName.substring(0, 2).toUpperCase() || 'KR'}</div>
              )}
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ ...ghostBtn, padding: '8px 16px', fontSize: 13 }}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>PNG, JPG up to 2MB</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
            </div>
          </div>
        </div>

        {/* Brand Color Presets */}
        <div>
          <label style={{ ...label, marginBottom: 10 }}>Brand Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BRAND_COLORS.map(bc => (
              <button
                key={bc.value}
                onClick={() => setBrandColor(bc.value)}
                title={bc.label}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: bc.value, border: 'none', cursor: 'pointer',
                  outline: brandColor === bc.value ? `2px solid ${c.accent}` : '2px solid transparent',
                  outlineOffset: 3, position: 'relative',
                  transition: 'outline-color 0.15s',
                }}
              >
                {brandColor === bc.value && (
                  <Check size={14} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: brandColor, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
              <input
                type="color"
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', cursor: 'pointer', opacity: 0 }}
                title="Pick custom color"
              />
            </div>
            <input
              type="text"
              value={brandColor}
              onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBrandColor(v); }}
              style={{ ...inputBase, width: 140, fontFamily: 'var(--font-mono)', fontSize: 14, padding: '0 10px' }}
              maxLength={7}
            />
            <span style={{ fontSize: 12, color: c.textMuted }}>or pick from presets above</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: 13 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          ...primaryBtn,
          backgroundColor: saved ? c.success : c.accent,
          opacity: saving ? 0.7 : 1,
          cursor: saving ? 'wait' : 'pointer',
        }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Brand Settings'}
      </button>
    </div>
  );
}

const providers = [
  { id: "gsc", name: "Google Search Console", icon: Search, logoSlug: "googlesearchconsole", desc: "Track keyword rankings, clicks, and impressions", color: "#4285F4" },
  { id: "ga4", name: "Google Analytics 4", icon: BarChart3, logoSlug: "googleanalytics", desc: "Website traffic, sessions, and conversion data", color: "#E37400" },
  { id: "google_ads", name: "Google Ads", icon: Target, logoSlug: "googleads", desc: "Campaign performance, spend, and ROAS tracking", color: "#34A853" },
  { id: "meta_ads", name: "Meta Ads", icon: Share2, logoSlug: "meta", desc: "Facebook & Instagram ad analytics", color: "#1877F2" },
];

const ALERT_METRICS = [
  { value: 'gsc_clicks', label: 'GSC Clicks (30d total)' },
  { value: 'gsc_impressions', label: 'GSC Impressions (30d total)' },
  { value: 'gsc_avg_position', label: 'GSC Avg Position' },
  { value: 'ga4_sessions', label: 'GA4 Sessions (30d total)' },
  { value: 'ga4_users', label: 'GA4 Users (30d total)' },
  { value: 'google_ads_spend', label: 'Google Ads Spend' },
  { value: 'google_ads_clicks', label: 'Google Ads Clicks' },
  { value: 'meta_ads_spend', label: 'Meta Ads Spend' },
  { value: 'meta_ads_roas', label: 'Meta Ads ROAS' },
];

function AlertsTab({ workspaceId }: { workspaceId: string }) {
  const { c, card, label, inputBase, primaryBtn, ghostBtn, destructiveBtn } = useStyles();
  const [rules, setRules] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [metric, setMetric] = useState('ga4_sessions');
  const [comparison, setComparison] = useState('below');
  const [threshold, setThreshold] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadAlerts() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/alerts?workspace_id=${workspaceId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setRules(data.rules || []);
    setHistory(data.history || []);
    setLoading(false);
  }

  useEffect(() => { if (workspaceId) loadAlerts(); }, [workspaceId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!threshold || !email) return;
    setSaving(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ workspace_id: workspaceId, metric, threshold: Number(threshold), comparison, recipient_email: email }),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setThreshold('');
      loadAlerts();
    } else {
      setError(data.error || 'Failed to create alert');
    }
    setSaving(false);
  }

  async function handleToggle(ruleId: string, isActive: boolean) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ rule_id: ruleId, is_active: !isActive }),
    });
    loadAlerts();
  }

  async function handleDelete(ruleId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/alerts?rule_id=${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    loadAlerts();
  }

  return (
    <div>
      {/* Header + Add button */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Alert Rules</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Get notified when metrics cross your thresholds.</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{ ...primaryBtn, padding: '8px 14px', fontSize: 13 }}
        >
          <Plus size={14} /> Add Alert
        </button>
      </div>

      {/* Add alert form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ ...card, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={label}>Metric</label>
              <select value={metric} onChange={e => setMetric(e.target.value)} style={inputBase}>
                {ALERT_METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Condition</label>
              <select value={comparison} onChange={e => setComparison(e.target.value)} style={inputBase}>
                <option value="above">Goes above</option>
                <option value="below">Drops below</option>
                <option value="equals">Equals</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={label}>Threshold</label>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g. 1000" required style={inputBase}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
              />
            </div>
            <div>
              <label style={label}>Notify Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={inputBase}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
              />
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: c.danger, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{ ...primaryBtn, padding: '10px 20px', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Alert'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={ghostBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Rules list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={20} color={c.accent} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : rules.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AlertTriangle size={32} color="var(--text-muted)" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>No alert rules yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Click &quot;Add Alert&quot; to create your first rule</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {rules.map((rule: any) => {
            const metricLabel = ALERT_METRICS.find(m => m.value === rule.metric)?.label || rule.metric;
            return (
              <div key={rule.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 12,
                backgroundColor: c.bgCard,
                border: `1px solid ${rule.is_active ? 'rgba(124,58,237,0.2)' : c.border}`,
                opacity: rule.is_active ? 1 : 0.6,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 4 }}>{metricLabel}</div>
                  <div style={{ fontSize: 12, color: c.textSecondary }}>
                    {rule.comparison === 'above' ? 'Goes above' : rule.comparison === 'below' ? 'Drops below' : 'Equals'} <strong style={{ fontFamily: 'var(--font-mono)' }}>{Number(rule.threshold).toLocaleString()}</strong> &rarr; {rule.recipient_email}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle on={rule.is_active} onToggle={() => handleToggle(rule.id, rule.is_active)} />
                  <button onClick={() => handleDelete(rule.id)} style={{ ...destructiveBtn, padding: 6, display: 'flex' }} title="Delete rule">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert history */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 12 }}>Alert History</h3>
          <div style={{ ...card, overflow: 'hidden' }}>
            {history.slice(0, 15).map((h: any, i: number) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: i < Math.min(history.length, 15) - 1 ? `1px solid ${c.border}` : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: c.text }}>{h.message}</div>
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, whiteSpace: 'nowrap', marginLeft: 12, fontFamily: 'var(--font-mono)' }}>
                  {new Date(h.triggered_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const { c, card, label, inputBase, primaryBtn } = useStyles();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setEmail(session.user.email || '');
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.profile?.full_name || session.user.user_metadata?.full_name || '');
        setCompany(data.profile?.company || session.user.user_metadata?.company || '');
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ full_name: fullName, company }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('Failed to save profile');
      }
    } catch {
      setError('Failed to save profile');
    }
    setSaving(false);
  }

  return (
    <div style={{ ...card }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Profile Settings</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Update your personal information.</p>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Full Name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" autoComplete="name" style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Email</label>
        <input value={email} readOnly placeholder="your@email.com" autoComplete="email" style={{ ...inputBase, backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Email cannot be changed here</p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={label}>Company</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" autoComplete="organization" style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
        />
      </div>
      {error && <p style={{ fontSize: 13, color: c.danger, marginBottom: 12 }}>{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          ...primaryBtn,
          backgroundColor: saved ? c.success : c.accent,
          opacity: saving ? 0.7 : 1,
          cursor: saving ? 'wait' : 'pointer',
        }}
      >
        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : null}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

export function BillingTab() {
  const { c, card, inputBase, primaryBtn } = useStyles();
  const { workspace, refetch: refetchWorkspace } = useWorkspaceCtx();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ ok: boolean; text: string } | null>(null);

  const currentPlan = workspace?.plan || 'free';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '/mo',
      features: ['2 integrations', '30-day data retention', '2 team members', 'Basic insights'],
      current: currentPlan === 'free',
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '₹2,499',
      period: '/mo',
      features: ['4 integrations', '90-day data retention', '5 team members', 'AI insights', 'PDF reports'],
      current: currentPlan === 'starter',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '₹6,499',
      period: '/mo',
      features: ['All integrations', '1-year data retention', '15 team members', 'AI insights + chat', 'White-label reports', 'Competitor tracking'],
      current: currentPlan === 'growth',
      popular: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: '₹16,499',
      period: '/mo',
      features: ['Unlimited integrations', 'Unlimited data retention', 'Unlimited team members', 'Everything in Growth', 'Multi-workspace', 'Priority support', 'API access'],
      current: currentPlan === 'agency',
    },
  ];

  async function handleRedeem() {
    if (!couponCode.trim() || !workspace?.id) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRedeemResult({ ok: false, text: 'Not signed in' }); setRedeeming(false); return; }
      const res = await fetch('/api/billing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: couponCode.trim(), workspace_id: workspace.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRedeemResult({ ok: true, text: data.message });
        setCouponCode('');
        refetchWorkspace();
      } else {
        setRedeemResult({ ok: false, text: data.error || 'Redemption failed' });
      }
    } catch (e: any) {
      setRedeemResult({ ok: false, text: e.message || 'Something went wrong' });
    }
    setRedeeming(false);
  }

  async function handleUpgrade(planId: string) {
    if (planId === 'free' || planId === currentPlan) return;
    setLoading(planId);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not signed in'); setLoading(null); return; }
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: planId, workspace_id: workspace?.id }),
      });
      const data = await res.json();
      if (data.error === 'billing_not_configured') {
        setError('Billing is not configured yet. Add STRIPE_SECRET_KEY to enable payments.');
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout');
    }
    setLoading(null);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            backgroundColor: 'rgba(124,58,237,0.1)',
            color: '#7C3AED',
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {currentPlan} plan
          </div>
        </div>
        <p style={{ fontSize: 13, color: c.textSecondary }}>
          {currentPlan === 'free' ? 'Upgrade to unlock more integrations, longer data retention, and AI features.' : `You're on the ${currentPlan} plan.`}
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{
            backgroundColor: 'var(--bg-card)',
            border: plan.popular ? '2px solid #7C3AED' : '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 20,
            paddingTop: plan.popular ? 28 : 20,
            position: 'relative',
            minWidth: 0,
            width: '100%',
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 12px', borderRadius: 20, backgroundColor: '#7C3AED', color: 'white', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                Most Popular
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", verticalAlign: 'middle' }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 18px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  <Check size={12} color="#10B981" style={{ flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.current || plan.id === 'free' || loading === plan.id}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: plan.current ? 'none' : plan.id === 'free' ? '1px solid var(--border-default)' : 'none',
                backgroundColor: plan.current ? 'var(--bg-card-secondary)' : (plan.id === 'free' ? 'transparent' : '#7C3AED'),
                color: plan.current ? 'var(--text-muted)' : (plan.id === 'free' ? 'var(--text-muted)' : '#FFFFFF'),
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: plan.current || plan.id === 'free' ? 'not-allowed' : 'pointer',
                opacity: loading === plan.id ? 0.7 : 1,
                transition: 'background-color 150ms',
              }}
              onMouseEnter={e => { if (!plan.current && plan.id !== 'free') e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { if (!plan.current && plan.id !== 'free') e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              {plan.current ? 'Current Plan' : plan.id === 'free' ? 'Free' : loading === plan.id ? 'Loading...' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Coupon Redemption */}
      <div style={{ ...card, marginTop: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Have a coupon code?</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Enter your early access or promo code to unlock a plan.</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <input
            type="text"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            placeholder="e.g. EARLYACCESS"
            style={{ ...inputBase, flex: 1, padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
            onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming || !couponCode.trim()}
            style={{
              ...primaryBtn,
              padding: '12px 24px',
              opacity: (redeeming || !couponCode.trim()) ? 0.6 : 1,
              cursor: (redeeming || !couponCode.trim()) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {redeeming ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {redeeming ? 'Redeeming...' : 'Redeem'}
          </button>
        </div>
        {redeemResult && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            backgroundColor: redeemResult.ok ? c.successSubtle : c.dangerSubtle,
            border: `1px solid ${redeemResult.ok ? c.successBorder : c.dangerBorder}`,
            color: redeemResult.ok ? c.success : c.danger,
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {redeemResult.ok ? <Check size={13} /> : <X size={13} />}
            {redeemResult.text}
          </div>
        )}
      </div>
    </div>
  );
}


function DeleteAccountSection() {
  const { c, card, destructiveBtn } = useStyles();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type DELETE MY ACCOUNT exactly to confirm');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ confirmation: confirmText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Deletion failed'); setDeleting(false); return; }
      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      setError('Something went wrong');
      setDeleting(false);
    }
  }

  return (
    <div style={{ ...card, marginTop: 40, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 12, padding: '24px 28px', backgroundColor: 'rgba(239,68,68,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={16} color="#ef4444" />
        </div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ef4444' }}>Danger Zone</h3>
      </div>
      <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{ ...destructiveBtn, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Trash2 size={14} /> Delete Account
        </button>
      ) : (
        <div style={{ padding: 20, borderRadius: 10, backgroundColor: c.dangerSubtle, border: `1px solid ${c.danger}` }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: c.danger, marginBottom: 12 }}>
            Are you absolutely sure?
          </p>
          <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>
            This will permanently delete your account, all workspaces, integrations, analytics data, reports, competitors, team members, and everything else. There is no way to recover this data.
          </p>
          <p style={{ fontSize: 13, color: c.text, marginBottom: 8 }}>
            Type <strong style={{ color: c.danger }}>DELETE MY ACCOUNT</strong> to confirm:
          </p>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: `1px solid ${c.danger}`, backgroundColor: c.bgPage,
              color: c.text, fontSize: 14, boxSizing: 'border-box' as const,
              marginBottom: 12,
              fontFamily: 'var(--font-mono)',
            }}
          />
          {error && <p style={{ fontSize: 13, color: c.danger, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== 'DELETE MY ACCOUNT'}
              style={{
                ...destructiveBtn,
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: deleting || confirmText !== 'DELETE MY ACCOUNT' ? 0.5 : 1,
                cursor: deleting || confirmText !== 'DELETE MY ACCOUNT' ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting everything...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText(''); setError(''); }}
              style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteWorkspaceSection({ workspace, workspaceCount }: {
  workspace: any;
  workspaceCount: number;
}) {
  const { c, card, destructiveBtn } = useStyles();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isOnlyWorkspace = workspaceCount <= 1;
  const requiredText = workspace?.name || '';

  async function handleDelete() {
    if (!workspace?.id) return;
    if (confirmText !== requiredText) {
      setError(`Please type "${requiredText}" exactly to confirm`);
      return;
    }
    setDeleting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not signed in'); setDeleting(false); return; }
      const res = await fetch(`/api/workspace/${workspace.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete workspace');
        setDeleting(false);
        return;
      }
      // Clear stale workspace from localStorage and hard-reload to /dashboard.
      // A hard navigation guarantees a clean WorkspaceProvider re-mount with
      // the user's remaining workspaces — React state reset, no stale context.
      try { localStorage.removeItem('lumnix-active-workspace'); } catch {}
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setDeleting(false);
    }
  }

  return (
    <div style={{ ...card, marginTop: 32, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 12, padding: '24px 28px', backgroundColor: 'rgba(239,68,68,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={16} color="#ef4444" />
        </div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ef4444', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Delete this workspace</h3>
      </div>
      <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
        Permanently delete <strong>{workspace?.name || 'this workspace'}</strong> and all its data — integrations, analytics, competitors, team members, and reports. This cannot be undone.
      </p>

      {isOnlyWorkspace && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          backgroundColor: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#F59E0B', fontSize: 13,
        }}>
          You can't delete your only workspace. Create another one first.
        </div>
      )}

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isOnlyWorkspace}
          style={{
            ...destructiveBtn,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: isOnlyWorkspace ? 0.5 : 1,
            cursor: isOnlyWorkspace ? 'not-allowed' : 'pointer',
          }}
        >
          <Trash2 size={14} /> Delete workspace
        </button>
      ) : (
        <div style={{ padding: 20, borderRadius: 10, backgroundColor: c.dangerSubtle, border: `1px solid ${c.danger}` }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: c.danger, marginBottom: 12 }}>
            This is permanent.
          </p>
          <p style={{ fontSize: 13, color: c.text, marginBottom: 8 }}>
            Type <strong style={{ color: c.danger }}>{requiredText}</strong> to confirm:
          </p>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={requiredText}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: `1px solid ${c.danger}`, backgroundColor: c.bgPage,
              color: c.text, fontSize: 14, boxSizing: 'border-box' as const,
              marginBottom: 12,
              fontFamily: 'var(--font-mono)',
            }}
          />
          {error && <p style={{ fontSize: 13, color: c.danger, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== requiredText}
              style={{
                ...destructiveBtn,
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: deleting || confirmText !== requiredText ? 0.5 : 1,
                cursor: deleting || confirmText !== requiredText ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Permanently delete workspace'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText(''); setError(''); }}
              style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceSection({ workspace, loading, onSaved, onUpdate }: { workspace: any; loading: boolean; onSaved?: () => void; onUpdate?: (w: any) => void }) {
  const { c, card, label, inputBase, primaryBtn, ghostBtn } = useStyles();
  const [name, setName] = useState(workspace?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspace?.name) setName(workspace.name);
  }, [workspace?.name]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onUpdate?.({ ...workspace, name: name.trim() });
        onSaved?.();
      } else {
        setError('Failed to save workspace name');
      }
    } catch {
      setError('Failed to save workspace name');
    }
    setSaving(false);
  }

  function handleCopyId() {
    if (!workspace?.id) return;
    navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ ...card }}>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div style={{ ...card }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Workspace</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Your workspace name and ID.</p>

      <div style={{ marginBottom: 16 }}>
        <label style={label}>Workspace Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Workspace"
          style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={label}>Workspace ID</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            value={workspace?.id || ''}
            style={{
              ...inputBase, flex: 1, fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)', cursor: 'default',
              backgroundColor: 'var(--bg-card-secondary)',
            }}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopyId}
            style={{
              ...ghostBtn,
              padding: '0 12px',
              fontSize: 13,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || name.trim() === (workspace?.name || '')}
        style={{
          ...primaryBtn,
          backgroundColor: saved ? '#22C55E' : '#7C3AED',
          opacity: saving || name.trim() === (workspace?.name || '') ? 0.5 : 1,
          cursor: saving || name.trim() === (workspace?.name || '') ? 'default' : 'pointer',
        }}
      >
        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : null}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Workspace Name'}
      </button>
    </div>
  );
}

/* ─── Security Tab ─── */
function SecurityTab() {
  const { c, card, label, inputBase, primaryBtn } = useStyles();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    async function checkProvider() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const provider = session.user.app_metadata?.provider;
      if (provider && provider !== 'email') {
        setIsOAuthUser(true);
      }
    }
    checkProvider();
  }, []);

  async function handleResetPassword() {
    setResetError('');
    setResetSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) {
        setResetError('Unable to find your email address.');
        setResetSending(false);
        return;
      }
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      });
      if (resetErr) {
        setResetError(resetErr.message);
      } else {
        setResetSent(true);
        setTimeout(() => setResetSent(false), 5000);
      }
    } catch {
      setResetError('Failed to send reset email. Please try again.');
    }
    setResetSending(false);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Failed to update password. Please try again.');
    }
    setSaving(false);
  }

  const passwordInputWrapper: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const eyeBtn: React.CSSProperties = {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  };

  if (isOAuthUser) {
    return (
      <div style={{ ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={18} color={c.accent} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>Security</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Manage your account security.</p>
        <div style={{
          padding: '16px 20px', borderRadius: 8,
          backgroundColor: 'var(--bg-page)',
          border: '1px solid var(--border-default)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Your account uses Google sign-in. Password management is handled through your Google account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Shield size={18} color={c.accent} />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>Change Password</h3>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Update your password to keep your account secure.</p>

      <form onSubmit={handleUpdatePassword}>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Current Password</label>
          <div style={passwordInputWrapper}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              required
              style={{ ...inputBase, padding: '12px 40px 12px 14px', fontSize: 14 }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={eyeBtn} tabIndex={-1}>
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>New Password</label>
          <div style={passwordInputWrapper}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              style={{ ...inputBase, padding: '12px 40px 12px 14px', fontSize: 14 }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} style={eyeBtn} tabIndex={-1}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p style={{ fontSize: 12, color: c.danger, marginTop: 4 }}>Must be at least 8 characters</p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={label}>Confirm New Password</label>
          <div style={passwordInputWrapper}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
              style={{ ...inputBase, padding: '12px 40px 12px 14px', fontSize: 14 }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn} tabIndex={-1}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p style={{ fontSize: 12, color: c.danger, marginTop: 4 }}>Passwords do not match</p>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#EF4444', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          style={{
            ...primaryBtn,
            backgroundColor: saved ? '#22C55E' : '#7C3AED',
            opacity: (saving || !currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
            cursor: (saving || !currentPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : <Shield size={16} />}
          {saving ? 'Updating...' : saved ? 'Password Updated!' : 'Update Password'}
        </button>
      </form>

      {/* Forgot Password Section */}
      <div style={{
        marginTop: 24, paddingTop: 20,
        borderTop: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Mail size={16} color={c.accent} />
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>Forgot Your Password?</h4>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>
          If you don&apos;t remember your current password, we&apos;ll send a reset link to your email.
        </p>

        {resetError && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 12,
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#EF4444', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertCircle size={14} />
            {resetError}
          </div>
        )}

        {resetSent && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 12,
            backgroundColor: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.15)',
            color: '#22C55E', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Check size={14} />
            Reset link sent! Check your email inbox.
          </div>
        )}

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={resetSending || resetSent}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            backgroundColor: 'transparent',
            border: `1px solid ${c.accent}`,
            color: c.accent,
            cursor: (resetSending || resetSent) ? 'not-allowed' : 'pointer',
            opacity: (resetSending || resetSent) ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          {resetSending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
          {resetSending ? 'Sending...' : resetSent ? 'Email Sent!' : 'Send Password Reset Email'}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { c, card, inputBase, primaryBtn, ghostBtn, destructiveBtn } = useStyles();
  const { toggle, theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState("general");
  const { workspace, workspaces, loading: wsLoading, refetch: refetchWorkspace, setWorkspace } = useWorkspaceCtx();
  const { integrations, loading: intLoading, refetch } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { rows?: number; error?: string; timestamp?: string }>>({});

  // Team invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean; inviteUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamData, setTeamData] = useState<{ members: any[]; invites: any[]; canInviteMore: boolean; slotsUsed: number; maxSlots: number } | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function refreshTeamData() {
    if (!workspace?.id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const d = await fetch(`/api/team/invite?workspace_id=${workspace.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    }).then(r => r.json()).catch(() => null);
    if (d && !d.error) setTeamData(d);
    else setTeamData({ members: [], invites: [], canInviteMore: true, slotsUsed: 0, maxSlots: 2 });
  }

  useEffect(() => {
    if (workspace?.id && activeTab === "team") {
      refreshTeamData();
    }
  }, [workspace?.id, activeTab]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !workspace?.id) return;
    setInviting(true);
    setInviteMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ email: inviteEmail, workspace_id: workspace.id, role: inviteRole }),
    });
    const data = await res.json();
    if (data.success) {
      const savedEmail = inviteEmail;
      setInviteEmail("");
      setCopied(false);
      await refreshTeamData();
      if (data.emailSent) {
        setInviteMsg({ text: `Invite sent to ${savedEmail}`, ok: true });
      } else {
        setInviteMsg({ text: `Email couldn't be sent — share this link manually:`, ok: true, inviteUrl: data.inviteUrl });
      }
    } else {
      setInviteMsg({ text: data.error, ok: false });
    }
    setInviting(false);
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!window.confirm('Revoke this invitation?')) return;
    if (!workspace?.id) return;
    setRevokingId(inviteId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setRevokingId(null); return; }
    const res = await fetch(`/api/team/invite?invite_id=${inviteId}&workspace_id=${workspace.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (data.success) {
      await refreshTeamData();
    }
    setRevokingId(null);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      refetch();
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, []);

  const isConnected = (providerId: string) => integrations.some(i => i.provider === providerId && i.status === "connected");
  const isSynced = (providerId: string) => {
    const int = integrations.find(i => i.provider === providerId && i.status === "connected");
    if (!int) return false;
    return !!(int.last_sync_at || int.oauth_meta);
  };
  const getIntegration = (providerId: string) => integrations.find(i => i.provider === providerId);

  async function handleConnect(providerId: string) {
    if (!workspace?.id) {
      alert('Workspace not loaded yet. Please wait a moment and try again.');
      return;
    }
    await connectIntegration(providerId, workspace.id);
  }

  async function handleSync(providerId: string) {
    const int = getIntegration(providerId);
    if (!int || !workspace?.id) return;
    setSyncing(providerId);
    try {
      const result = await syncIntegration(int.id, workspace.id, providerId);
      if (result?.error) {
        setSyncResults(prev => ({ ...prev, [providerId]: { error: result.error, timestamp: new Date().toISOString() } }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [providerId]: {
            rows: result?.rows_synced ?? undefined,
            error: undefined,
            timestamp: new Date().toISOString(),
          },
        }));
      }
      refetch();
    } catch (err: any) {
      setSyncResults(prev => ({ ...prev, [providerId]: { error: err?.message || 'Sync failed', timestamp: new Date().toISOString() } }));
    }
    setSyncing(null);
  }

  async function handleSyncAll() {
    if (!workspace?.id) return;
    setSyncing('all');
    try {
      const res = await fetch(`/api/cron/sync?workspace_id=${workspace.id}`);
      const result = await res.json();
      if (result.success) {
        const synced = result.results.filter((r: any) => r.status === 'synced');
        alert(`Auto-sync complete: ${synced.length} source${synced.length !== 1 ? 's' : ''} updated`);
      } else {
        alert(`Sync failed: ${result.error}`);
      }
      refetch();
    } catch (err) {
      alert(`Sync error: ${err}`);
    }
    setSyncing(null);
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Settings</h1>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 28 }}>Manage integrations, brand, and preferences</p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 4,
          gap: 2,
          marginBottom: 28,
        }}>
          {(['general', 'security', 'brand', 'integrations', 'team', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: 'none',
                background: activeTab === tab ? '#7C3AED' : 'transparent',
                color: activeTab === tab ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'background 150ms, color 150ms',
              }}
              onMouseEnter={e => { if (activeTab !== tab) { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              onMouseLeave={e => { if (activeTab !== tab) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── General Tab ─── */}
        <TabsContent value="general">
          <div>
            {/* Workspace section */}
            <WorkspaceSection workspace={workspace} loading={wsLoading} onSaved={refetchWorkspace} onUpdate={setWorkspace} />

            {/* Profile section */}
            <div style={{ marginTop: 32 }}>
              <ProfileTab />
            </div>

            {/* Delete this workspace */}
            {workspace && (
              <DeleteWorkspaceSection
                workspace={workspace}
                workspaceCount={workspaces.length}
              />
            )}

            {/* Danger Zone — Delete Account */}
            <DeleteAccountSection />
          </div>
        </TabsContent>

        {/* ─── Security Tab ─── */}
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        {/* ─── Brand Tab ─── */}
        <TabsContent value="brand">
          <BrandTab workspace={workspace} onSaved={refetchWorkspace} onUpdate={setWorkspace} />
        </TabsContent>

        {/* ─── Integrations Tab ─── */}
        <TabsContent value="integrations">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: 14, color: c.textSecondary, margin: 0 }}>
                Connect your marketing accounts to start syncing real data.
                {wsLoading && " Loading..."}
                {workspace && <span style={{ color: c.success }}> &middot; {workspace.name}</span>}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: c.textMuted }}>Auto-syncs daily at 2AM UTC</span>
                <button
                  onClick={handleSyncAll}
                  disabled={syncing === 'all'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    height: 36, padding: '0 16px', borderRadius: 8, border: 'none',
                    background: '#7C3AED', color: '#FFFFFF',
                    fontSize: 13, fontWeight: 600, cursor: syncing === 'all' ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: syncing === 'all' ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (syncing !== 'all') e.currentTarget.style.background = '#6D28D9'; }}
                  onMouseLeave={e => { if (syncing !== 'all') e.currentTarget.style.background = '#7C3AED'; }}
                >
                  <RefreshCw size={13} style={{ animation: syncing === 'all' ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing === 'all' ? 'Syncing...' : 'Sync All Now'}
                </button>
              </div>
            </div>
            <div className="integration-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {providers.map(p => {
                const Icon = p.icon;
                const connected = isConnected(p.id);
                const int = getIntegration(p.id);
                const isSyncing = syncing === p.id;
                const isErrored = int?.status === 'error';
                const syncResult = syncResults[p.id];
                const lastSyncTime = int?.last_sync_at ? new Date(int.last_sync_at) : null;
                const syncAge = lastSyncTime ? Date.now() - lastSyncTime.getTime() : null;
                const isStale = syncAge ? syncAge > 24 * 60 * 60 * 1000 : false;

                const borderColor = isErrored
                  ? 'rgba(239,68,68,0.4)'
                  : connected && isSynced(p.id)
                    ? 'rgba(16,185,129,0.3)'
                    : connected
                      ? 'rgba(245,158,11,0.4)'
                      : c.border;

                return (
                  <div key={p.id} style={{
                    ...card,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    padding: 20,
                  }}>
                    {/* Header: icon + name + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${p.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <img src={`https://cdn.simpleicons.org/${p.logoSlug}/${p.color.replace('#', '')}`} width={26} height={26} alt={p.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{p.name}</div>
                          <div style={{ marginTop: 4 }}>
                            <StatusPill
                              connected={connected}
                              variant={isErrored ? 'error' : connected ? 'success' : 'default'}
                              label={
                                isErrored ? 'Sync Error'
                                : connected ? (int?.display_name ? `Connected \u00b7 ${int.display_name}` : 'Connected')
                                : 'Disconnected'
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 12, lineHeight: 1.4 }}>{p.desc}</p>

                    {/* Sync details block — shown when connected */}
                    {connected && (
                      <div style={{
                        padding: '10px 12px', borderRadius: 8, marginBottom: 14,
                        backgroundColor: isErrored ? 'rgba(239,68,68,0.05)' : 'var(--bg-page)',
                        border: `1px solid ${isErrored ? 'rgba(239,68,68,0.15)' : 'var(--border-default)'}`,
                      }}>
                        {/* Last sync timestamp */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: lastSyncTime ? 6 : 0 }}>
                          <Clock size={11} color={c.textMuted} />
                          <span style={{ fontSize: 12, color: c.textSecondary }}>
                            {lastSyncTime
                              ? <>Last sync: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{lastSyncTime.toLocaleString()}</span>
                                {isStale && <span style={{ color: '#F59E0B', marginLeft: 6, fontWeight: 600 }}>(stale)</span>}
                              </>
                              : 'Never synced'
                            }
                          </span>
                        </div>

                        {/* Sync status from last sync attempt */}
                        {lastSyncTime && !isErrored && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: syncResult?.rows !== undefined ? 6 : 0 }}>
                            <Check size={11} color="#22C55E" />
                            <span style={{ fontSize: 12, color: '#166534', fontWeight: 500 }}>Last sync succeeded</span>
                          </div>
                        )}

                        {/* Row count — from latest manual sync result */}
                        {syncResult?.rows !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Database size={11} color={c.textMuted} />
                            <span style={{ fontSize: 12, color: c.textSecondary }}>
                              Rows synced: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: c.text }}>{syncResult.rows.toLocaleString()}</span>
                            </span>
                          </div>
                        )}

                        {/* Error message (from sync result or status) */}
                        {(isErrored || syncResult?.error) && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                            <AlertCircle size={12} color="#EF4444" style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#EF4444', lineHeight: 1.4 }}>
                              {syncResult?.error || 'Sync failed. Re-authenticate or try syncing again.'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%', marginTop: 12 }}>
                      {!connected ? (
                        <button
                          onClick={() => handleConnect(p.id)}
                          style={{
                            width: '100%', height: 44, borderRadius: 8, border: 'none',
                            backgroundColor: '#7C3AED', color: 'white',
                            fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                            cursor: 'pointer', transition: 'background-color 150ms',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6D28D9')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                        >
                          Connect
                        </button>
                      ) : isErrored ? (
                        <>
                          <button
                            style={{
                              flex: 1, height: 40, borderRadius: 8, border: 'none',
                              backgroundColor: '#7C3AED', color: '#FFFFFF',
                              fontSize: 14, fontWeight: 600, cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif",
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                            onClick={() => handleConnect(p.id)}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6D28D9')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                          >
                            <RefreshCw size={13} />
                            Reconnect
                          </button>
                          <button
                            style={{
                              height: 40, padding: '0 16px', borderRadius: 8,
                              border: '1px solid var(--border-default)',
                              backgroundColor: 'transparent', color: 'var(--text-secondary)',
                              fontSize: 14, fontWeight: 500, cursor: isSyncing ? 'not-allowed' : 'pointer',
                              fontFamily: "'DM Sans', sans-serif",
                              display: 'flex', alignItems: 'center', gap: 6,
                              opacity: isSyncing ? 0.7 : 1,
                            }}
                            onClick={() => handleSync(p.id)}
                            disabled={isSyncing}
                          >
                            <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncing ? 'Retrying...' : 'Retry Sync'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSync(p.id)}
                            disabled={isSyncing}
                            style={{
                              flex: 1, height: 40, borderRadius: 8,
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'}`,
                              backgroundColor: 'transparent',
                              color: isDark ? '#CBD5E1' : '#374151',
                              fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                              cursor: isSyncing ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              transition: 'background-color 150ms',
                              opacity: isSyncing ? 0.7 : 1,
                            }}
                            onMouseEnter={e => { if (!isSyncing) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB'; }}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <RefreshCw size={16} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!int || !confirm(`Disconnect ${p.name}? You can reconnect anytime.`)) return;
                              try {
                                await fetch('/api/integrations/disconnect', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ integration_id: int.id }),
                                });
                                setSyncResults(prev => { const next = { ...prev }; delete next[p.id]; return next; });
                                refetch();
                              } catch {}
                            }}
                            style={{
                              height: 40, padding: '0 16px', borderRadius: 8,
                              border: '1px solid #FCA5A5',
                              backgroundColor: 'transparent',
                              color: '#EF4444',
                              fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                              transition: 'background-color 150ms, border-color 150ms',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                          >
                            <X size={16} />
                            Disconnect
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </TabsContent>

        {/* ─── Team Tab ─── */}
        <TabsContent value="team">
          <div>
            {/* Slots indicator */}
            <div style={{
              ...card,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Crown size={16} color={c.warning} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text, textTransform: 'capitalize' }}>{workspace?.plan || 'free'} Plan</div>
                  <div style={{ fontSize: 12, color: c.textSecondary }}>{workspace?.plan === 'agency' ? 'Unlimited' : `Up to ${teamData?.maxSlots || 2}`} team members</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.text, fontFamily: 'var(--font-display)' }}>
                {teamData?.slotsUsed || 0} / {teamData?.maxSlots || 2}
                <span style={{ fontSize: 12, color: c.textSecondary, fontWeight: 400, marginLeft: 4 }}>used</span>
              </div>
            </div>

            {/* Invite form */}
            <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>Invite a team member</h3>
              <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 16 }}>They&#39;ll receive an email with a link to sign up and join your workspace.</p>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    autoComplete="email"
                    required
                    disabled={teamData?.canInviteMore === false}
                    style={{
                      ...inputBase,
                      padding: '10px 14px 10px 36px',
                      opacity: teamData?.canInviteMore === false ? 0.5 : 1,
                    }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{ ...inputBase, width: 'auto', padding: '10px 12px', fontWeight: 500, cursor: 'pointer' }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail || teamData?.canInviteMore === false}
                  style={{
                    ...primaryBtn,
                    opacity: (inviting || !inviteEmail || teamData?.canInviteMore === false) ? 0.5 : 1,
                    cursor: (inviting || !inviteEmail || teamData?.canInviteMore === false) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {inviting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </form>
              {teamData?.canInviteMore === false && (
                <p style={{ fontSize: 12, color: c.warning, marginTop: 10 }}>Member limit reached. Upgrade to add more.</p>
              )}
              {inviteMsg && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  backgroundColor: inviteMsg.ok ? c.successSubtle : c.dangerSubtle,
                  border: `1px solid ${inviteMsg.ok ? c.successBorder : c.dangerBorder}`,
                  color: inviteMsg.ok ? c.success : c.danger,
                  fontSize: 13,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {inviteMsg.ok ? <Check size={13} /> : <X size={13} />}
                    {inviteMsg.text}
                  </div>
                  {inviteMsg.inviteUrl && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        readOnly
                        value={inviteMsg.inviteUrl}
                        style={{
                          ...inputBase,
                          flex: 1,
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          color: c.textSecondary,
                        }}
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(inviteMsg.inviteUrl!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        style={{ ...ghostBtn, height: 32, padding: '0 12px', fontSize: 13 }}
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active members — avatar + name + role badge rows */}
            {teamData?.members && teamData.members.length > 0 && (
              <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 16 }}>Team Members</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teamData.members.map((m: any) => {
                    const isOwner = m.role === 'owner';
                    const roleColors: Record<string, { bg: string; color: string }> = {
                      owner: { bg: c.warningSubtle, color: c.warning },
                      admin: { bg: c.accentSubtle, color: c.accent },
                      member: { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6' },
                      viewer: { bg: 'rgba(85,85,85,0.08)', color: c.textMuted },
                    };
                    const rc = roleColors[m.role] || roleColors.member;
                    return (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 8,
                        backgroundColor: c.surfaceElevated, border: `1px solid ${c.border}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            backgroundColor: '#7C3AED',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 600, color: '#FFFFFF', textTransform: 'uppercase',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                            {(m.name || m.email || '?').substring(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>
                              {m.name || 'Unknown'}{isOwner ? ' (You)' : ''}
                            </div>
                            <div style={{ fontSize: 12, color: c.textMuted }}>{m.email}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isOwner ? (
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                              backgroundColor: '#FEF3C7', color: '#92400E',
                              fontFamily: "'DM Sans', sans-serif",
                            }}>
                              Owner
                            </span>
                          ) : (
                            <>
                              <select
                                value={m.role}
                                onChange={async (e) => {
                                  const newRole = e.target.value;
                                  const session = (await supabase.auth.getSession()).data.session;
                                  if (!session) return;
                                  try {
                                    const res = await fetch('/api/team/member', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                                      body: JSON.stringify({ workspace_id: workspace.id, member_id: m.id, role: newRole }),
                                    });
                                    if (res.ok) refreshTeamData();
                                  } catch {}
                                }}
                                style={{
                                  height: 32, fontSize: 13, fontWeight: 500, padding: '0 10px', borderRadius: 8,
                                  backgroundColor: 'transparent', color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-default)',
                                  fontFamily: "'DM Sans', sans-serif",
                                  cursor: 'pointer', appearance: 'auto',
                                }}
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Remove ${m.name || m.email} from this workspace?`)) return;
                                  const session = (await supabase.auth.getSession()).data.session;
                                  if (!session) return;
                                  try {
                                    const res = await fetch(`/api/team/member?member_id=${m.id}&workspace_id=${workspace.id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${session.access_token}` },
                                    });
                                    if (res.ok) refreshTeamData();
                                  } catch {}
                                }}
                                style={{
                                  height: 32, padding: '0 12px', borderRadius: 8,
                                  background: 'transparent', color: '#EF4444',
                                  border: '1px solid #FECACA',
                                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                  fontFamily: "'DM Sans', sans-serif",
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#EF4444'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#FECACA'; }}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending invites */}
            {teamData?.invites && teamData.invites.filter((inv: any) => inv.status === 'pending').length > 0 && (
              <div style={{ ...card, padding: '20px 24px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 16 }}>Pending Invites</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teamData.invites.filter((inv: any) => inv.status === 'pending').map((inv: any) => {
                    const roleColors: Record<string, { bg: string; color: string }> = {
                      admin: { bg: c.accentSubtle, color: c.accent },
                      member: { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6' },
                      viewer: { bg: 'rgba(85,85,85,0.08)', color: c.textMuted },
                    };
                    const rc = roleColors[inv.role] || roleColors.member;
                    const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null;
                    const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
                    const invUrl = inv.token ? `${window.location.origin}/auth/signup?invite=${inv.token}` : null;
                    return (
                      <div key={inv.id || inv.email} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 8,
                        backgroundColor: c.surfaceElevated, border: `1px solid ${c.border}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            backgroundColor: c.accentSubtle,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: c.accent,
                          }}>
                            {inv.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: c.text }}>{inv.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                backgroundColor: rc.bg, color: rc.color, textTransform: 'capitalize',
                              }}>
                                {inv.role || 'member'}
                              </span>
                              {daysLeft !== null && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: daysLeft <= 1 ? c.danger : c.textMuted }}>
                                  <Clock size={10} />
                                  Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {invUrl && (
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(invUrl); }}
                              style={{ ...ghostBtn, height: 32, padding: '0 12px', fontSize: 13 }}
                            >
                              <Link size={12} />
                              Copy link
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id)}
                            disabled={revokingId === inv.id}
                            title="Revoke invite"
                            style={{
                              height: 32, padding: '0 12px', borderRadius: 8,
                              background: 'transparent', color: '#EF4444',
                              border: '1px solid #FECACA',
                              fontSize: 13, fontWeight: 500, cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif",
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              opacity: revokingId === inv.id ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#FECACA'; }}
                          >
                            {revokingId === inv.id
                              ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                              : <Trash2 size={12} />
                            }
                            {revokingId === inv.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Alerts Tab ─── */}
        <TabsContent value="alerts">
          <div>
            <NotificationsTab />
            <div style={{ marginTop: 32 }}>
              {workspace?.id && <AlertsTab workspaceId={workspace.id} />}
            </div>
          </div>
        </TabsContent>

      </Tabs>
      </div>
    </div>
  );
}
