"use client";
import { useState, useRef, useEffect } from "react";
import { Search, BarChart3, Target, Share2, Check, X, Plug, User, Bell, Shield, CreditCard, RefreshCw, Loader2, Palette, Upload, Users, Mail, Crown, Plus, Trash2, AlertTriangle, Copy, Clock, Link } from "lucide-react";
import { useIntegrations, connectIntegration, syncIntegration } from "@/lib/hooks";
import { useWorkspaceCtx } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import type { CSSProperties } from "react";

/* ─── Shared Styles Hook ─── */
function useStyles() {
  const { c } = useTheme();
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${c.border}`,
    backgroundColor: c.bgCard,
    color: c.text,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const primaryBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 24px', borderRadius: 8, border: 'none',
    backgroundColor: c.accent, color: '#fff',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  };
  const ghostBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 8,
    border: `1px solid ${c.borderStrong}`,
    backgroundColor: 'transparent', color: c.textSecondary,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
  };
  const destructiveBtn: React.CSSProperties = {
    background: c.dangerSubtle, color: c.danger,
    border: `1px solid ${c.dangerBorder}`,
    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
  };
  const card: React.CSSProperties = {
    backgroundColor: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: c.textSecondary, marginBottom: 6,
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

function StatusPill({ connected, label }: { connected: boolean; label?: string }) {
  const { c } = useTheme();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600,
      padding: '4px 10px', borderRadius: 20,
      backgroundColor: connected ? c.successSubtle : 'rgba(113,113,122,0.08)',
      color: connected ? c.success : c.textMuted,
      border: `1px solid ${connected ? c.successBorder : c.border}`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: connected ? c.success : c.textMuted }} />
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
    <div style={{ maxWidth: 560 }}>
      <div style={{ ...card, overflow: 'hidden', marginBottom: 20 }}>
        {notifItems.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: i < notifItems.length - 1 ? `1px solid ${c.border}` : 'none',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: c.text }}>{item.label}</div>
              <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{item.desc}</div>
            </div>
            <Toggle on={!!toggles[item.id]} onToggle={() => setToggles(t => ({ ...t, [item.id]: !t[item.id] }))} />
          </div>
        ))}
      </div>
      <button onClick={save} style={{
        ...primaryBtn,
        backgroundColor: saved ? c.success : c.accent,
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
    <div style={{ maxWidth: 560 }}>
      <div style={{ ...card, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 20 }}>Brand Identity</h3>

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
              width: 60, height: 60, borderRadius: 12,
              backgroundColor: c.bgCard, display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              border: `1px solid ${c.border}`,
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {BRAND_COLORS.map(bc => (
              <button
                key={bc.value}
                onClick={() => setBrandColor(bc.value)}
                title={bc.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
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
            <input
              type="color"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 8, padding: 0, background: 'none' }}
              title="Pick custom color"
            />
            <input
              type="text"
              value={brandColor}
              onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBrandColor(v); }}
              style={{ ...inputBase, width: 110, fontFamily: 'var(--font-mono)', fontSize: 13, padding: '8px 10px' }}
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

const tabs = [
  { id: "general", label: "General", icon: User },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "team", label: "Team", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
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
    <div style={{ maxWidth: 640 }}>
      {/* Header + Add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 4 }}>Alert Rules</h3>
          <p style={{ fontSize: 13, color: c.textSecondary, margin: 0 }}>Get notified when metrics cross your thresholds. Checked every hour.</p>
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
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={28} color={c.textMuted} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 4 }}>No alert rules yet</p>
          <p style={{ fontSize: 12, color: c.textMuted }}>Click &quot;Add Alert&quot; to create your first rule</p>
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
                border: `1px solid ${rule.is_active ? 'rgba(99,102,241,0.2)' : c.border}`,
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
    <div style={{ ...card, padding: 24, maxWidth: 500 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 20 }}>Profile Settings</h3>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Full Name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Email</label>
        <input value={email} readOnly placeholder="your@email.com" style={{ ...inputBase, padding: '12px 14px', fontSize: 14, opacity: 0.6, cursor: 'not-allowed' }} />
        <p style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>Email cannot be changed here</p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={label}>Company</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
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

function BillingTab() {
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
      price: '$0',
      period: '/mo',
      features: ['2 integrations', '30-day data retention', '2 team members', 'Basic insights'],
      current: currentPlan === 'free',
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/mo',
      features: ['4 integrations', '90-day data retention', '5 team members', 'AI insights', 'PDF reports'],
      current: currentPlan === 'starter',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '$79',
      period: '/mo',
      features: ['All integrations', '1-year data retention', '15 team members', 'AI insights + chat', 'White-label reports', 'Competitor tracking'],
      current: currentPlan === 'growth',
      popular: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: '$199',
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
            backgroundColor: currentPlan === 'free' ? 'rgba(85,85,85,0.1)' : c.accentSubtle,
            color: currentPlan === 'free' ? c.textMuted : c.accent,
            fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {plans.map(plan => (
          <div key={plan.id} style={{
            ...card,
            border: `1px solid ${plan.popular ? c.accent : plan.current ? c.successBorder : c.border}`,
            padding: 24,
            position: 'relative',
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 6, backgroundColor: c.accent, color: 'white', fontSize: 11, fontWeight: 600 }}>
                Most Popular
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: c.textMuted }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: c.textSecondary, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={13} color={c.success} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.current || plan.id === 'free' || loading === plan.id}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: plan.current ? `1px solid ${c.borderStrong}` : 'none',
                backgroundColor: plan.current ? 'transparent' : plan.popular ? c.accent : c.surfaceElevated,
                color: plan.current ? c.textMuted : plan.popular ? 'white' : c.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: plan.current || plan.id === 'free' ? 'default' : 'pointer',
                opacity: loading === plan.id ? 0.7 : 1,
              }}
            >
              {plan.current ? 'Current Plan' : plan.id === 'free' ? 'Free' : loading === plan.id ? 'Loading...' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Coupon Redemption */}
      <div style={{ ...card, padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>Have a coupon code?</h3>
        <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 16 }}>Enter your early access or promo code to unlock a plan.</p>
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

function SlackSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { c, card, label, inputBase, primaryBtn, ghostBtn } = useStyles();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/settings/slack?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => {
        setWebhookUrl(d.slack_webhook_url || '');
        setConnected(d.connected || false);
      })
      .catch(() => {});
  }, [workspaceId]);

  async function handleSave() {
    if (!workspaceId) return;
    setSaving(true);
    setError('');
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, slack_webhook_url: webhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setConnected(!!webhookUrl.trim());
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save webhook URL');
    }
    setSaving(false);
  }

  async function handleTest() {
    if (!workspaceId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/slack/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      const data = await res.json();
      setTestResult(data.success ? { ok: true, text: 'Test message sent!' } : { ok: false, text: data.error || 'Test failed' });
    } catch {
      setTestResult({ ok: false, text: 'Failed to send test message' });
    }
    setTesting(false);
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(74,21,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#4A154B"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Slack Notifications</div>
          <StatusPill connected={connected} />
        </div>
      </div>

      <div style={{ ...card, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Slack Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            style={{ ...inputBase, padding: '12px 14px', fontSize: 14 }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
          />
          <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 8, backgroundColor: `${c.accent}08`, border: `1px solid ${c.accent}20` }}>
            <p style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: c.text, display: 'block', marginBottom: 6 }}>How to get your Slack webhook URL:</strong>
              1. Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener" style={{ color: c.accent, textDecoration: 'underline' }}>api.slack.com/apps</a> → Create New App → From scratch<br/>
              2. Name it "Lumnix Alerts" → pick your workspace → Create App<br/>
              3. In Features → Incoming Webhooks → toggle Activate → Add New Webhook to Workspace<br/>
              4. Pick the channel for alerts → Allow → copy the Webhook URL and paste it above
            </p>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: 13 }}>
            {error}
          </div>
        )}

        {testResult && (
          <div style={{
            marginBottom: 12, padding: '8px 12px', borderRadius: 8,
            backgroundColor: testResult.ok ? c.successSubtle : c.dangerSubtle,
            border: `1px solid ${testResult.ok ? c.successBorder : c.dangerBorder}`,
            color: testResult.ok ? c.success : c.danger, fontSize: 13,
          }}>
            {testResult.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
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
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
          {connected && (
            <button
              onClick={handleTest}
              disabled={testing}
              style={{ ...ghostBtn, opacity: testing ? 0.7 : 1, cursor: testing ? 'wait' : 'pointer' }}
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : null}
              {testing ? 'Sending...' : 'Send Test'}
            </button>
          )}
        </div>
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
    <div style={{ ...card, marginTop: 32, borderColor: c.danger, borderWidth: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <AlertTriangle size={18} color={c.danger} />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.danger }}>Danger Zone</h3>
      </div>
      <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>
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
              color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
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

export default function SettingsPage() {
  const { c, card, inputBase, primaryBtn, ghostBtn, destructiveBtn } = useStyles();
  const { toggle } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const { workspace, loading: wsLoading, refetch: refetchWorkspace, setWorkspace } = useWorkspaceCtx();
  const { integrations, loading: intLoading, refetch } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState<string | null>(null);

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
        alert(`Sync failed: ${result.error}`);
      }
      refetch();
    } catch (err) {
      alert(`Sync error: ${err}`);
    }
    setSyncing(null);
  }

  async function handleSyncAll() {
    if (!workspace?.id) return;
    setSyncing('all');
    try {
      const res = await fetch(`/api/cron/sync?workspace_id=${workspace.id}`, {
        headers: { Authorization: 'Bearer lumnix-cron-2026' }
      });
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
    <div style={{ backgroundColor: c.bgPage, minHeight: '100vh' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: '-0.5px' }}>Settings</h1>
        <p style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>Manage integrations, brand, and preferences</p>
      </div>

      {/* Horizontal Tabs: General | Integrations | Team | Alerts | Billing */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: `1px solid ${c.border}`, overflowX: 'auto' }}>
        {[
          { id: 'general', label: 'General' },
          { id: 'brand', label: 'Brand' },
          { id: 'integrations', label: 'Integrations' },
          { id: 'team', label: 'Team' },
          { id: 'alerts', label: 'Alerts' },
          { id: 'billing', label: 'Billing' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '12px 20px', fontSize: 14,
            fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? c.text : c.textMuted,
            backgroundColor: 'transparent', border: 'none',
            borderBottom: `2px solid ${activeTab === t.id ? c.accent : 'transparent'}`,
            cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
            transition: 'color 0.15s, border-color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── General Tab ─── */}
      {activeTab === "general" && (
        <div>
          {/* Profile section */}
          <ProfileTab />

          {/* Danger Zone — Delete Account */}
          <DeleteAccountSection />
        </div>
      )}

      {/* ─── Brand Tab ─── */}
      {activeTab === "brand" && (
        <BrandTab workspace={workspace} onSaved={refetchWorkspace} onUpdate={setWorkspace} />
      )}

      {/* ─── Integrations Tab ─── */}
      {activeTab === "integrations" && (
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
                  ...primaryBtn,
                  padding: '8px 14px', fontSize: 13,
                  opacity: syncing === 'all' ? 0.7 : 1,
                  cursor: syncing === 'all' ? 'wait' : 'pointer',
                }}
              >
                <RefreshCw size={13} style={{ animation: syncing === 'all' ? 'spin 1s linear infinite' : 'none' }} />
                {syncing === 'all' ? 'Syncing...' : 'Sync All Now'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {providers.map(p => {
              const Icon = p.icon;
              const connected = isConnected(p.id);
              const int = getIntegration(p.id);
              const isSyncing = syncing === p.id;
              return (
                <div key={p.id} style={{
                  ...card,
                  border: `1px solid ${connected && isSynced(p.id) ? 'rgba(16,185,129,0.3)' : connected ? 'rgba(245,158,11,0.4)' : c.border}`,
                  padding: 24,
                }}>
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
                            label={connected ? (int?.display_name ? `Connected \u00b7 ${int.display_name}` : 'Connected') : 'Disconnected'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 16, lineHeight: 1.4 }}>{p.desc}</p>
                  {int?.last_sync_at && (
                    <p style={{ fontSize: 11, color: c.textMuted, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
                      Last synced: {new Date(int.last_sync_at).toLocaleString()}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!connected ? (
                      <button onClick={() => handleConnect(p.id)} style={{
                        flex: 1, padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', backgroundColor: c.accent, color: 'white', border: 'none',
                      }}>
                        Connect
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleSync(p.id)} disabled={isSyncing} style={{
                          flex: 1, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: isSyncing ? 'wait' : 'pointer',
                          backgroundColor: isSynced(p.id) ? 'transparent' : c.warning,
                          color: isSynced(p.id) ? c.textSecondary : 'white',
                          border: isSynced(p.id) ? `1px solid ${c.borderStrong}` : 'none',
                          opacity: isSyncing ? 0.6 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
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
                              refetch();
                            } catch {}
                          }}
                          style={{
                            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', backgroundColor: 'transparent',
                            color: c.danger, border: `1px solid ${c.danger}60`,
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = c.dangerSubtle; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <X size={13} />
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                  {p.id === 'meta_ads' && (
                    <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: '#60a5fa', lineHeight: 1.5 }}>
                      After connecting, you also need to accept the <a href="https://www.facebook.com/ads/library/api/" target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'underline' }}>Meta Ad Library Terms of Service</a> to use the Competitor Ad Spy feature.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ─── Team Tab ─── */}
      {activeTab === "team" && (
        <div style={{ maxWidth: 560 }}>
          {/* Slots indicator */}
          <div style={{
            ...card,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Crown size={16} color={c.warning} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text, textTransform: 'capitalize' }}>{workspace?.plan || 'free'} Plan</div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>{workspace?.plan === 'agency' ? 'Unlimited' : `Up to ${teamData?.maxSlots || 2}`} team members</div>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.text, fontFamily: 'var(--font-mono)' }}>
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
                  padding: '10px 18px', fontSize: 14,
                  opacity: (inviting || !inviteEmail || teamData?.canInviteMore === false) ? 0.6 : 1,
                  whiteSpace: 'nowrap',
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
                      style={{
                        ...ghostBtn,
                        padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap',
                        color: copied ? c.success : c.textSecondary,
                        borderColor: copied ? c.successBorder : c.borderStrong,
                      }}
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
                          width: 34, height: 34, borderRadius: '50%',
                          backgroundColor: c.accentSubtle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: c.accent,
                        }}>
                          {(m.user_id || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: c.text }}>
                            {m.user_id === workspace?.owner_id || m.user_id === workspace?.created_by ? 'You (Owner)' : 'Member'}
                          </div>
                          <div style={{ fontSize: 11, color: c.textMuted }}>Joined {new Date(m.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                        backgroundColor: rc.bg, color: rc.color, textTransform: 'capitalize',
                      }}>
                        {m.role}
                      </span>
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
                            style={{
                              ...ghostBtn,
                              padding: '6px 12px', fontSize: 12,
                            }}
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
                            ...destructiveBtn,
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', fontSize: 12,
                            opacity: revokingId === inv.id ? 0.6 : 1,
                            cursor: revokingId === inv.id ? 'wait' : 'pointer',
                          }}
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
      )}

      {/* ─── Alerts Tab ─── */}
      {activeTab === "alerts" && (
        <div>
          <NotificationsTab />
          <div style={{ marginTop: 32 }}>
            {workspace?.id && <AlertsTab workspaceId={workspace.id} />}
          </div>
          {/* Slack Integration */}
          <SlackSection workspaceId={workspace?.id} />
        </div>
      )}

      {/* ─── Billing Tab ─── */}
      {activeTab === "billing" && <BillingTab />}

      {/* Fallback for any unmapped tab */}
      {activeTab !== "general" && activeTab !== "integrations" && activeTab !== "team" && activeTab !== "alerts" && activeTab !== "billing" && (
        <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12, border: `1px dashed ${c.border}` }}>
          <p style={{ fontSize: 15, color: c.textMuted }}>Coming soon &mdash; {activeTab} settings</p>
        </div>
      )}
    </div>
  );
}
