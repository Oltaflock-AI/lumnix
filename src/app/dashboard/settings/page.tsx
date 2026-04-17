"use client";

import { useState, useRef, useEffect } from "react";
import { Search, BarChart3, Target, Share2, Check, X, RefreshCw, Loader2, Upload, Users, Mail, Crown, Plus, Trash2, AlertTriangle, Copy, Clock, Link, Database, AlertCircle, Shield, Eye, EyeOff, CreditCard, Calendar, Receipt } from "lucide-react";
import { useIntegrations, connectIntegration, syncIntegration } from "@/lib/hooks";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useWorkspaceCtx } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { apiFetch } from "@/lib/api-fetch";
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CSSProperties } from "react";
import Image from "next/image";

/* ────────────────────────────────────────────────────────────────
   Official brand logos for Integrations tab (from public/integrations/)
   ──────────────────────────────────────────────────────────────── */
function GSCIcon() {
  return <Image src="/integrations/gsc.svg" alt="Google Search Console" width={28} height={28} />;
}
function GA4Icon() {
  return <Image src="/integrations/ga4.svg" alt="Google Analytics 4" width={28} height={28} />;
}
function GoogleAdsIcon() {
  return <Image src="/integrations/google-ads.svg" alt="Google Ads" width={28} height={28} />;
}
function MetaAdsIcon() {
  return <Image src="/integrations/meta.svg" alt="Meta Ads" width={28} height={28} />;
}

/* ────────────────────────────────────────────────────────────────
   Shared styles (kept for state-only pieces still referenced by
   child components — same names so no handler logic changes)
   ──────────────────────────────────────────────────────────────── */
function useStyles() {
  const { c, theme } = useTheme();
  const inputBase: CSSProperties = {
    width: '100%',
    height: 40,
    padding: '0 12px',
    borderRadius: 8,
    border: `1px solid var(--border)`,
    backgroundColor: 'var(--elevated)',
    color: 'var(--text)',
    fontSize: 13,
    fontFamily: "var(--font-body)",
    boxSizing: 'border-box',
    transition: 'border-color 150ms',
    outline: 'none',
  };
  const primaryBtn: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 40, padding: '0 18px', borderRadius: 8, border: 'none',
    background: 'var(--primary)',
    color: '#FFFFFF',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: "var(--font-body)",
  };
  const ghostBtn: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 40, padding: '0 16px', borderRadius: 8,
    border: `1px solid var(--border)`,
    backgroundColor: 'transparent',
    color: 'var(--text-sec)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: "var(--font-body)",
  };
  const destructiveBtn: CSSProperties = {
    background: 'transparent', color: 'var(--danger)',
    border: '1px solid var(--danger)',
    borderRadius: 8, height: 40, padding: '0 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    fontFamily: "var(--font-body)",
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  const card: CSSProperties = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  };
  const label: CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'var(--text)',
    fontFamily: "var(--font-body)",
    marginBottom: 8,
  };
  return { c, inputBase, primaryBtn, ghostBtn, destructiveBtn, card, label };
}

/* ────────────────────────────────────────────────────────────────
   Toggle switch (mono styling)
   ──────────────────────────────────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`lx-switch${on ? ' active' : ''}`}
      aria-pressed={on}
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   Status pill (used by Integrations tab)
   ──────────────────────────────────────────────────────────────── */
function StatusPill({ connected, label, variant }: { connected: boolean; label?: string; variant?: 'success' | 'error' | 'warning' | 'default' }) {
  const resolved = variant || (connected ? 'success' : 'default');
  const colors: Record<string, string> = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: 'var(--warning)',
    default: 'var(--text-muted)',
  };
  const dot = colors[resolved];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: dot, marginTop: 2,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
      {label || (connected ? 'Connected' : 'Disconnected')}
    </span>
  );
}

const BRAND_COLORS = [
  { label: 'Primary', value: '#FF0066' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Yellow', value: '#F59E0B' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Red', value: '#EF4444' },
];

function NotificationsTab() {
  const notifItems = [
    { id: "traffic", label: "Traffic Alerts", desc: "Get notified when traffic changes significantly" },
    { id: "ads", label: "Ad Alerts", desc: "Notify me of ad spend anomalies and budget warnings" },
    { id: "weekly", label: "Weekly Digest", desc: "Summary of top insights and metrics every Monday" },
    { id: "monthly", label: "Monthly Report", desc: "Comprehensive monthly analytics and performance review" },
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
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">Notification Preferences</span>
      </div>
      <p className="lx-card-desc">Choose which alerts and reports you want to receive.</p>

      {notifItems.map(item => (
        <div key={item.id} className="lx-toggle-row">
          <div className="lx-toggle-info">
            <div className="lx-toggle-title">{item.label}</div>
            <div className="lx-toggle-desc">{item.desc}</div>
          </div>
          <Toggle on={!!toggles[item.id]} onToggle={() => setToggles(t => ({ ...t, [item.id]: !t[item.id] }))} />
        </div>
      ))}

      <button onClick={save} className="lx-btn-primary" style={{ marginTop: 16 }}>
        {saved ? <><Check size={14} /> Saved!</> : 'Save Preferences'}
      </button>
    </div>
  );
}

function BrandTab({ workspace, onSaved, onUpdate }: { workspace: any; onSaved?: () => void; onUpdate?: (w: any) => void }) {
  const { setAccentColor } = useTheme();
  const [brandName, setBrandName] = useState(workspace?.name || '');
  const [brandColor, setBrandColor] = useState(workspace?.brand_color || '#FF0066');
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
      setBrandColor(workspace.brand_color || '#FF0066');
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

      const res = await apiFetch('/api/upload/logo', {
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
      const res = await apiFetch('/api/workspace', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspace_id: workspace?.id, name: brandName, brand_color: brandColor, logo_url: logoUrl }),
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
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">Brand Identity</span>
      </div>
      <p className="lx-card-desc">Customize your brand name, logo, and colors.</p>

      <div className="lx-form-row" style={{ marginTop: 16 }}>
        <label className="lx-form-label">Brand Name</label>
        <input
          type="text"
          className="lx-form-input"
          value={brandName}
          onChange={e => setBrandName(e.target.value)}
          placeholder="Your brand name"
        />
      </div>

      {/* Logo */}
      <div className="lx-logo-section">
        <div className="lx-logo-current">
          <div className="lx-logo-avatar" style={{ background: logoPreview ? 'transparent' : `linear-gradient(135deg, ${brandColor}, var(--tertiary))`, overflow: 'hidden' }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{brandName.substring(0, 2).toUpperCase() || 'LX'}</span>
            )}
          </div>
          <span className="lx-logo-label">Current Logo</span>
        </div>
        <div className="lx-logo-actions">
          <button
            type="button"
            className="lx-upload-area"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ width: '100%', background: 'transparent' }}
          >
            <div className="lx-upload-text">
              {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
            </div>
            <div className="lx-upload-hint">PNG, JPG up to 2MB</div>
          </button>
          <button
            type="button"
            className="lx-btn-outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload Logo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
        </div>
      </div>

      {/* Brand Color */}
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <label className="lx-form-label" style={{ display: 'block', marginBottom: 12 }}>Brand Color</label>

        <div className="lx-color-grid">
          {BRAND_COLORS.map(bc => (
            <button
              key={bc.value}
              type="button"
              className={`lx-color-option${brandColor.toLowerCase() === bc.value.toLowerCase() ? ' selected' : ''}`}
              style={{ background: bc.value }}
              onClick={() => setBrandColor(bc.value)}
              title={bc.label}
            >
              {bc.value}
            </button>
          ))}
        </div>

        <div className="lx-color-custom">
          <span className="lx-color-hint">or pick from presets above</span>
        </div>

        <div className="lx-color-custom" style={{ marginTop: 12 }}>
          <div className="lx-color-input-wrap">
            <div className="lx-color-preview" style={{ background: brandColor, position: 'relative', overflow: 'hidden' }}>
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
              className="lx-color-input"
              value={brandColor}
              onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBrandColor(v); }}
              placeholder="#FF0066"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--danger)', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="lx-btn-primary"
        style={{ marginTop: 20, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Brand Settings'}
      </button>
    </div>
  );
}

const providers = [
  { id: "gsc", name: "Google Search Console", Logo: GSCIcon, bg: 'rgba(66,133,244,0.1)', desc: "Tracks keywords, impressions, clicks, and CTR data" },
  { id: "ga4", name: "Google Analytics 4", Logo: GA4Icon, bg: 'rgba(249,171,0,0.1)', desc: "Real-time analytics, traffic sources, and user behavior" },
  { id: "google_ads", name: "Google Ads", Logo: GoogleAdsIcon, bg: 'rgba(66,133,244,0.1)', desc: "Campaign performance, spend, and conversion tracking" },
  { id: "meta_ads", name: "Meta Ads", Logo: MetaAdsIcon, bg: 'rgba(0,129,251,0.1)', desc: "Facebook and Instagram ad performance and spend" },
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
    const res = await apiFetch(`/api/alerts?workspace_id=${workspaceId}`, {
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
    const res = await apiFetch('/api/alerts', {
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
    await apiFetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ rule_id: ruleId, is_active: !isActive }),
    });
    loadAlerts();
  }

  async function handleDelete(ruleId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await apiFetch(`/api/alerts?rule_id=${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    loadAlerts();
  }

  return (
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">Alert Rules</span>
        <button
          type="button"
          className="lx-btn-primary"
          style={{ padding: '8px 14px', fontSize: 12 }}
          onClick={() => setShowForm(f => !f)}
        >
          <Plus size={12} /> Add Alert
        </button>
      </div>
      <p className="lx-card-desc">Get notified when metrics cross your thresholds.</p>

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginTop: 16, padding: 16, background: 'var(--elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="lx-form-row" style={{ marginBottom: 0 }}>
              <label className="lx-form-label">Metric</label>
              <select className="lx-form-select" value={metric} onChange={e => setMetric(e.target.value)}>
                {ALERT_METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="lx-form-row" style={{ marginBottom: 0 }}>
              <label className="lx-form-label">Condition</label>
              <select className="lx-form-select" value={comparison} onChange={e => setComparison(e.target.value)}>
                <option value="above">Goes above</option>
                <option value="below">Drops below</option>
                <option value="equals">Equals</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="lx-form-row" style={{ marginBottom: 0 }}>
              <label className="lx-form-label">Threshold</label>
              <input type="number" className="lx-form-input" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g. 1000" required />
            </div>
            <div className="lx-form-row" style={{ marginBottom: 0 }}>
              <label className="lx-form-label">Notify Email</label>
              <input type="email" className="lx-form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} className="lx-btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create Alert'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="lx-btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : rules.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={24} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>No alert rules yet</div>
          <div style={{ fontSize: 12 }}>Click &quot;Add Alert&quot; to create your first rule</div>
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map((rule: any) => {
            const metricLabel = ALERT_METRICS.find(m => m.value === rule.metric)?.label || rule.metric;
            return (
              <div key={rule.id} style={{ padding: 14, background: 'var(--elevated)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: rule.is_active ? 1 : 0.6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{metricLabel}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {rule.comparison === 'above' ? 'Goes above' : rule.comparison === 'below' ? 'Drops below' : 'Equals'} <strong style={{ fontFamily: 'var(--font-mono)' }}>{Number(rule.threshold).toLocaleString()}</strong> → {rule.recipient_email}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle on={rule.is_active} onToggle={() => handleToggle(rule.id, rule.is_active)} />
                  <button type="button" className="lx-btn-danger" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => handleDelete(rule.id)} title="Delete rule">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Alert History</div>
          <div style={{ background: 'var(--elevated)', borderRadius: 10, overflow: 'hidden' }}>
            {history.slice(0, 15).map((h: any, i: number) => (
              <div key={h.id} style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < Math.min(history.length, 15) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>{h.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', marginLeft: 12 }}>{new Date(h.triggered_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
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
      const res = await apiFetch('/api/profile', {
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
      const res = await apiFetch('/api/profile', {
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
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">Profile Settings</span>
      </div>
      <p className="lx-card-desc">Update your personal information.</p>

      <div className="lx-form-row" style={{ marginTop: 16 }}>
        <label className="lx-form-label">Full Name</label>
        <input className="lx-form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" autoComplete="name" />
      </div>
      <div className="lx-form-row">
        <label className="lx-form-label">Email</label>
        <input className="lx-form-input" value={email} readOnly placeholder="your@email.com" autoComplete="email" style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed here</p>
      </div>
      <div className="lx-form-row">
        <label className="lx-form-label">Company</label>
        <input className="lx-form-input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" autoComplete="organization" />
      </div>

      {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className="lx-btn-primary" style={{ marginTop: 8, opacity: saving ? 0.7 : 1 }}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

export function BillingTab() {
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchSubInfo() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await apiFetch('/api/billing/subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const d = await res.json();
          setSubInfo(d);
        }
      } catch {}
      setLoading(false);
    }
    fetchSubInfo();
  }, []);

  if (loading) {
    return (
      <div className="lx-card">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="lx-card">
      <div className="lx-card-header"><span className="lx-card-title">Billing</span></div>
      <p className="lx-card-desc">Manage your subscription and billing in the Billing section.</p>
      <a href="/dashboard/billing" className="lx-btn-outline" style={{ marginTop: 12 }}>
        <CreditCard size={13} />
        Go to Billing
      </a>
    </div>
  );
}

function DeleteAccountSection() {
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
      const res = await apiFetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ confirmation: confirmText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Deletion failed'); setDeleting(false); return; }
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      setError('Something went wrong');
      setDeleting(false);
    }
  }

  return (
    <div className="lx-card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
      <div className="lx-card-header">
        <span className="lx-card-title" style={{ color: 'var(--danger)' }}>
          <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          Danger Zone
        </span>
      </div>
      <p className="lx-card-desc">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button type="button" className="lx-btn-danger" onClick={() => setShowConfirm(true)} style={{ marginTop: 12 }}>
          <Trash2 size={13} /> Delete Account
        </button>
      ) : (
        <div style={{ marginTop: 14, padding: 18, borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 10 }}>Are you absolutely sure?</p>
          <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 14 }}>
            This will permanently delete your account, all workspaces, integrations, analytics data, reports, competitors, team members, and everything else. There is no way to recover this data.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>
            Type <strong style={{ color: 'var(--danger)' }}>DELETE MY ACCOUNT</strong> to confirm:
          </p>
          <input
            className="lx-form-input"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            style={{ fontFamily: 'var(--font-mono)', marginBottom: 12 }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="lx-btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== 'DELETE MY ACCOUNT'}
              style={{ opacity: deleting || confirmText !== 'DELETE MY ACCOUNT' ? 0.5 : 1 }}
            >
              <Trash2 size={13} />
              {deleting ? 'Deleting everything…' : 'Permanently Delete Account'}
            </button>
            <button
              type="button"
              className="lx-btn-outline"
              onClick={() => { setShowConfirm(false); setConfirmText(''); setError(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteWorkspaceSection({ workspace, workspaceCount }: { workspace: any; workspaceCount: number }) {
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
      const res = await apiFetch(`/api/workspace/${workspace.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete workspace');
        setDeleting(false);
        return;
      }
      try { localStorage.removeItem('lumnix-active-workspace'); } catch {}
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setDeleting(false);
    }
  }

  return (
    <div className="lx-card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
      <div className="lx-card-header">
        <span className="lx-card-title" style={{ color: 'var(--danger)' }}>
          <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          Delete this workspace
        </span>
      </div>
      <p className="lx-card-desc">
        Permanently delete <strong>{workspace?.name || 'this workspace'}</strong> and all its data — integrations, analytics, competitors, team members, and reports. This cannot be undone.
      </p>

      {isOnlyWorkspace && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--warning)', fontSize: 12 }}>
          You can&apos;t delete your only workspace. Create another one first.
        </div>
      )}

      {!showConfirm ? (
        <button
          type="button"
          className="lx-btn-danger"
          onClick={() => setShowConfirm(true)}
          disabled={isOnlyWorkspace}
          style={{ marginTop: 12, opacity: isOnlyWorkspace ? 0.5 : 1 }}
        >
          <Trash2 size={13} /> Delete workspace
        </button>
      ) : (
        <div style={{ marginTop: 14, padding: 18, borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 10 }}>This is permanent.</p>
          <p style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>
            Type <strong style={{ color: 'var(--danger)' }}>{requiredText}</strong> to confirm:
          </p>
          <input
            className="lx-form-input"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={requiredText}
            style={{ fontFamily: 'var(--font-mono)', marginBottom: 12 }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="lx-btn-danger"
              onClick={handleDelete}
              disabled={deleting || confirmText !== requiredText}
              style={{ opacity: deleting || confirmText !== requiredText ? 0.5 : 1 }}
            >
              <Trash2 size={13} />
              {deleting ? 'Deleting…' : 'Permanently delete workspace'}
            </button>
            <button
              type="button"
              className="lx-btn-outline"
              onClick={() => { setShowConfirm(false); setConfirmText(''); setError(''); }}
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
      const res = await apiFetch('/api/workspace', {
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
      <div className="lx-card">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">Workspace Settings</span>
      </div>
      <p className="lx-card-desc">Your workspace name and ID.</p>

      <div className="lx-form-row" style={{ marginTop: 16 }}>
        <label className="lx-form-label">Workspace Name</label>
        <input
          type="text"
          className="lx-form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Workspace"
        />
      </div>

      <div className="lx-form-row">
        <label className="lx-form-label">Workspace ID</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            className="lx-form-input"
            value={workspace?.id || ''}
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'default' }}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button type="button" className="lx-btn-outline" onClick={handleCopyId}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <button
        type="button"
        className="lx-btn-primary"
        onClick={handleSave}
        disabled={saving || name.trim() === (workspace?.name || '')}
        style={{
          marginTop: 12,
          opacity: saving || name.trim() === (workspace?.name || '') ? 0.5 : 1,
          cursor: saving || name.trim() === (workspace?.name || '') ? 'default' : 'pointer',
        }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

function SecurityTab() {
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
      if (!session) {
        setResetError('Not signed in.');
        setResetSending(false);
        return;
      }
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Failed to send reset email.');
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

  const pwWrap: CSSProperties = { position: 'relative', width: '100%' };
  const eyeBtn: CSSProperties = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
  };

  if (isOAuthUser) {
    return (
      <div className="lx-card">
        <div className="lx-card-header">
          <span className="lx-card-title">
            <Shield size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6, color: 'var(--primary)' }} />
            Security
          </span>
        </div>
        <p className="lx-card-desc">Manage your account security.</p>
        <div style={{ marginTop: 12, padding: '14px 18px', borderRadius: 10, background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-sec)', margin: 0 }}>
            Your account uses Google sign-in. Password management is handled through your Google account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">Change Password</span>
      </div>
      <p className="lx-card-desc">Update your account password regularly to keep your account secure.</p>

      <form onSubmit={handleUpdatePassword} style={{ marginTop: 16 }}>
        <div className="lx-form-row">
          <label className="lx-form-label">Current Password</label>
          <div style={pwWrap}>
            <input
              type={showCurrent ? 'text' : 'password'}
              className="lx-form-input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              required
              style={{ paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={eyeBtn} tabIndex={-1} aria-label="Toggle password visibility">
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="lx-form-row">
          <label className="lx-form-label">New Password</label>
          <div style={pwWrap}>
            <input
              type={showNew ? 'text' : 'password'}
              className="lx-form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
              minLength={8}
              style={{ paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} style={eyeBtn} tabIndex={-1} aria-label="Toggle password visibility">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>Must be at least 8 characters</p>
          )}
        </div>

        <div className="lx-form-row">
          <label className="lx-form-label">Confirm Password</label>
          <div style={pwWrap}>
            <input
              type={showConfirm ? 'text' : 'password'}
              className="lx-form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              required
              style={{ paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn} tabIndex={-1} aria-label="Toggle password visibility">
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>Passwords do not match</p>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--danger)', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="lx-btn-primary"
          style={{
            opacity: (saving || !currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
            cursor: (saving || !currentPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Shield size={13} />}
          {saving ? 'Updating…' : saved ? 'Password Updated!' : 'Update Password'}
        </button>
      </form>

      {/* Forgot Password */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          <Mail size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6, color: 'var(--primary)' }} />
          Forgot Your Password?
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          If you don&apos;t remember your current password, we&apos;ll send a reset link to your email.
        </p>

        {resetError && (
          <div style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={12} /> {resetError}
          </div>
        )}

        {resetSent && (
          <div style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--success)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={12} /> Reset link sent! Check your email inbox.
          </div>
        )}

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={resetSending || resetSent}
          className="lx-btn-outline"
          style={{ opacity: (resetSending || resetSent) ? 0.5 : 1 }}
        >
          {resetSending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
          {resetSending ? 'Sending…' : resetSent ? 'Email Sent!' : 'Send Password Reset Email'}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { workspace, workspaces, loading: wsLoading, refetch: refetchWorkspace, setWorkspace } = useWorkspaceCtx();
  const { integrations, loading: intLoading, refetch } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { rows?: number; error?: string; timestamp?: string }>>({});
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);

  // Team invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean; inviteUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamData, setTeamData] = useState<{ members: any[]; invites: any[]; canInviteMore: boolean; slotsUsed: number; maxSlots: number } | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string; description?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void;
  } | null>(null);

  async function refreshTeamData() {
    if (!workspace?.id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const d = await apiFetch(`/api/team/invite?workspace_id=${workspace.id}`, {
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
    const res = await apiFetch('/api/team/invite', {
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

  function handleRevokeInvite(inviteId: string) {
    setConfirmState({
      title: 'Revoke this invitation?',
      description: "The person will no longer be able to use this invite link to join. You can send a new invite anytime.",
      confirmLabel: 'Revoke invite',
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        if (!workspace?.id) return;
        setRevokingId(inviteId);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setRevokingId(null); return; }
        const res = await apiFetch(`/api/team/invite?invite_id=${inviteId}&workspace_id=${workspace.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.success) await refreshTeamData();
        setRevokingId(null);
      },
    });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get("connected");
    if (!connectedProvider || !workspace?.id) return;
    window.history.replaceState({}, "", "/dashboard/settings");
    (async () => {
      try {
        const res = await apiFetch(`/api/integrations/list?workspace_id=${workspace.id}`);
        const d = await res.json();
        const fresh = d.integrations || [];
        const int = fresh.find((i: any) => i.provider === connectedProvider && i.status === 'connected');
        if (int) {
          setSyncing(connectedProvider);
          try {
            await syncIntegration(int.id, workspace.id, connectedProvider);
          } catch {}
          setSyncing(null);
        }
      } catch {}
      refetch();
    })();
  }, [workspace?.id]);

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
    const connected = integrations.filter(i => i.status === 'connected' && ['gsc','ga4','google_ads','meta_ads'].includes(i.provider));
    const outcomes = await Promise.all(connected.map(async (int) => {
      try {
        const result = await syncIntegration(int.id, workspace.id, int.provider);
        return { provider: int.provider, ok: !result?.error, error: result?.error };
      } catch (e: any) {
        return { provider: int.provider, ok: false, error: e?.message || 'Sync error' };
      }
    }));
    const ok = outcomes.filter(o => o.ok).length;
    const failed = outcomes.filter(o => !o.ok);
    if (failed.length === 0) {
      alert(`Sync complete: ${ok} source${ok !== 1 ? 's' : ''} updated`);
    } else {
      alert(`Synced ${ok}/${outcomes.length}. Failed: ${failed.map(f => `${f.provider} (${f.error})`).join(', ')}`);
    }
    setSyncResults(prev => {
      const next = { ...prev };
      const ts = new Date().toISOString();
      for (const o of outcomes) next[o.provider] = { error: o.ok ? undefined : o.error, timestamp: ts };
      return next;
    });
    refetch();
    setSyncing(null);
  }

  const tabs: { id: string; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'brand', label: 'Brand' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'team', label: 'Team' },
    { id: 'alerts', label: 'Alerts' },
  ];

  return (
    <div className="lx-content">
      {/* Page Header */}
      <div className="lx-page-header">
        <div>
          <h1 className="lx-page-title">Settings</h1>
          <p className="lx-page-desc">Manage integrations, brand, and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab bar — mono styled */}
        <div className="lx-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`lx-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── GENERAL ─── */}
        <TabsContent value="general">
          <WorkspaceSection workspace={workspace} loading={wsLoading} onSaved={refetchWorkspace} onUpdate={setWorkspace} />
          <ProfileTab />
          {workspace && (
            <DeleteWorkspaceSection workspace={workspace} workspaceCount={workspaces.length} />
          )}
          <DeleteAccountSection />
        </TabsContent>

        {/* ─── SECURITY ─── */}
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        {/* ─── BRAND ─── */}
        <TabsContent value="brand">
          <BrandTab workspace={workspace} onSaved={refetchWorkspace} onUpdate={setWorkspace} />
        </TabsContent>

        {/* ─── INTEGRATIONS ─── */}
        <TabsContent value="integrations">
          <div className="lx-card" style={{ marginBottom: 24 }}>
            <div className="lx-card-header">
              <div>
                <span className="lx-card-title">Connected Integrations</span>
                <p className="lx-card-desc" style={{ marginTop: 4 }}>Connect your marketing accounts to start syncing real data.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--elevated)', borderRadius: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Workspace:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '3px 8px', borderRadius: 6 }}>
                {workspace?.name || (wsLoading ? 'Loading…' : '—')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>Auto-syncs daily at 2AM UTC</span>
              <button
                type="button"
                className="lx-btn-primary"
                style={{ padding: '8px 14px', fontSize: 12, opacity: syncing === 'all' ? 0.7 : 1, cursor: syncing === 'all' ? 'not-allowed' : 'pointer' }}
                onClick={handleSyncAll}
                disabled={syncing === 'all'}
              >
                <RefreshCw size={12} style={{ animation: syncing === 'all' ? 'spin 1s linear infinite' : 'none' }} />
                {syncing === 'all' ? 'Syncing…' : 'Sync All Now'}
              </button>
            </div>
          </div>

          <div className="lx-integration-grid">
            {providers.map(p => {
              const Logo = p.Logo;
              const connected = isConnected(p.id);
              const int = getIntegration(p.id);
              const isSyncing = syncing === p.id;
              const isErrored = int?.status === 'error';
              const syncResult = syncResults[p.id];
              const lastSyncTime = int?.last_sync_at ? new Date(int.last_sync_at) : null;

              let statusNode: React.ReactNode;
              if (isErrored) {
                statusNode = <div className="lx-integration-status pending" style={{ color: 'var(--danger)' }}>Sync Error</div>;
              } else if (connected) {
                statusNode = <div className="lx-integration-status">Connected{int?.display_name ? ` · ${int.display_name}` : ''}</div>;
              } else {
                statusNode = <div className="lx-integration-status pending">Not Connected</div>;
              }

              let syncLineText = 'Click to authorize account and begin syncing data.';
              if (connected && lastSyncTime) {
                syncLineText = `Last sync: ${lastSyncTime.toLocaleString()} | Last sync ${isErrored ? 'failed' : 'succeeded ✓'}`;
              } else if (connected) {
                syncLineText = 'Connected — waiting for first sync.';
              } else if (p.id === 'google_ads') {
                syncLineText = 'Waiting for Google developer token approval. This usually takes 1-3 business days.';
              }

              return (
                <div key={p.id} className="lx-integration-card">
                  <div className="lx-integration-header">
                    <div className="lx-integration-icon" style={{ background: p.bg }}>
                      <Logo />
                    </div>
                    <div>
                      <div className="lx-integration-name">{p.name}</div>
                      {statusNode}
                    </div>
                  </div>

                  <p className="lx-integration-desc">{p.desc}</p>

                  <div className="lx-integration-sync">{syncLineText}</div>

                  {syncResult?.rows !== undefined && (
                    <div className="lx-integration-sync" style={{ marginTop: 6 }}>
                      Rows synced: {syncResult.rows.toLocaleString()}
                    </div>
                  )}
                  {syncResult?.error && (
                    <div className="lx-integration-sync" style={{ marginTop: 6, color: 'var(--danger)' }}>
                      {syncResult.error}
                    </div>
                  )}

                  <div className="lx-integration-actions">
                    {!connected ? (
                      <button type="button" className="lx-btn-primary" onClick={() => handleConnect(p.id)}>
                        Connect {p.name.split(' ').slice(-1)[0]}
                      </button>
                    ) : isErrored ? (
                      <>
                        <button type="button" className="lx-btn-primary" onClick={() => handleConnect(p.id)}>
                          <RefreshCw size={12} /> Reconnect
                        </button>
                        <button
                          type="button"
                          className="lx-btn-outline"
                          onClick={() => handleSync(p.id)}
                          disabled={isSyncing}
                          style={{ opacity: isSyncing ? 0.7 : 1 }}
                        >
                          <RefreshCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                          {isSyncing ? 'Retrying…' : 'Retry Sync'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="lx-btn-outline"
                          onClick={() => handleSync(p.id)}
                          disabled={isSyncing}
                          style={{ opacity: isSyncing ? 0.7 : 1 }}
                        >
                          <RefreshCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                          {isSyncing ? 'Syncing…' : 'Sync Now'}
                        </button>
                        <button
                          type="button"
                          className="lx-btn-danger"
                          onClick={() => { if (!int) return; setDisconnectTarget({ id: int.id, name: p.name }); }}
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disconnect Confirmation */}
          <AlertDialog open={!!disconnectTarget} onOpenChange={(open) => { if (!open) setDisconnectTarget(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect {disconnectTarget?.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the connection and stop syncing data from {disconnectTarget?.name}. Your existing data will be preserved. You can reconnect anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={async () => {
                    if (!disconnectTarget) return;
                    try {
                      await apiFetch('/api/integrations/disconnect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ integration_id: disconnectTarget.id }),
                      });
                      setSyncResults(prev => { const next = { ...prev }; delete next[disconnectTarget.id]; return next; });
                      refetch();
                    } catch {}
                    setDisconnectTarget(null);
                  }}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ─── TEAM ─── */}
        <TabsContent value="team">
          {/* Slots / Plan indicator */}
          <div className="lx-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Crown size={16} color="var(--warning)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize', fontFamily: 'var(--font-display)' }}>
                  {workspace?.plan || 'free'} Plan
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                  {workspace?.plan === 'agency' ? 'Unlimited' : `Up to ${teamData?.maxSlots || 2}`} team members
                </div>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {teamData?.slotsUsed || 0} / {teamData?.maxSlots || 2}
              <span style={{ fontSize: 12, color: 'var(--text-sec)', fontWeight: 400, marginLeft: 4 }}>used</span>
            </div>
          </div>

          {/* Invite form */}
          <div className="lx-card">
            <div className="lx-card-header">
              <span className="lx-card-title">Invite a team member</span>
            </div>
            <p className="lx-card-desc">They&apos;ll receive an email with a link to sign up and join your workspace.</p>

            <form onSubmit={handleInvite} style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="lx-form-input"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  autoComplete="email"
                  required
                  disabled={teamData?.canInviteMore === false}
                  style={{ paddingLeft: 34, opacity: teamData?.canInviteMore === false ? 0.5 : 1 }}
                />
              </div>
              <select
                className="lx-form-select"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ width: 'auto', fontWeight: 500, cursor: 'pointer' }}
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteEmail || teamData?.canInviteMore === false}
                className="lx-btn-primary"
                style={{
                  opacity: (inviting || !inviteEmail || teamData?.canInviteMore === false) ? 0.5 : 1,
                  cursor: (inviting || !inviteEmail || teamData?.canInviteMore === false) ? 'not-allowed' : 'pointer',
                }}
              >
                {inviting ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </form>

            {teamData?.canInviteMore === false && (
              <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 10 }}>Member limit reached. Upgrade to add more.</p>
            )}

            {inviteMsg && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: inviteMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${inviteMsg.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: inviteMsg.ok ? 'var(--success)' : 'var(--danger)',
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
                      className="lx-form-input"
                      value={inviteMsg.inviteUrl}
                      style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)' }}
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      className="lx-btn-outline"
                      onClick={() => { navigator.clipboard.writeText(inviteMsg.inviteUrl!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      style={{ padding: '8px 12px', fontSize: 12 }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team members */}
          {teamData?.members && teamData.members.length > 0 && (
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Team Members</span>
              </div>
              <p className="lx-card-desc">Manage who has access to your workspace and their roles.</p>

              <div style={{ marginTop: 12 }}>
                {teamData.members.map((m: any, idx: number) => {
                  const isOwner = m.role === 'owner';
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px 0',
                        borderBottom: idx < teamData.members.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, var(--primary), var(--tertiary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase',
                        }}>
                          {(m.name || m.email || '?').substring(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                            {m.name || 'Unknown'}{isOwner ? ' (You)' : ''}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isOwner ? (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 8px', borderRadius: 6 }}>
                            Admin
                          </span>
                        ) : (
                          <>
                            <select
                              className="lx-form-select"
                              value={m.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const session = (await supabase.auth.getSession()).data.session;
                                if (!session) return;
                                try {
                                  const res = await apiFetch('/api/team/member', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                                    body: JSON.stringify({ workspace_id: workspace.id, member_id: m.id, role: newRole }),
                                  });
                                  if (res.ok) refreshTeamData();
                                } catch {}
                              }}
                              style={{ width: 'auto', padding: '6px 10px', fontSize: 11 }}
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              type="button"
                              className="lx-btn-danger"
                              style={{ padding: '6px 12px', fontSize: 11 }}
                              onClick={() => {
                                setConfirmState({
                                  title: `Remove ${m.name || m.email}?`,
                                  description: "They'll immediately lose access to this workspace, including integrations, data, and shared reports. You can re-invite them later.",
                                  confirmLabel: 'Remove',
                                  danger: true,
                                  onConfirm: async () => {
                                    setConfirmState(null);
                                    const session = (await supabase.auth.getSession()).data.session;
                                    if (!session) return;
                                    try {
                                      const res = await apiFetch(`/api/team/member?member_id=${m.id}&workspace_id=${workspace.id}`, {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${session.access_token}` },
                                      });
                                      if (res.ok) refreshTeamData();
                                    } catch {}
                                  },
                                });
                              }}
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

          {/* Pending invitations */}
          {teamData?.invites && teamData.invites.filter((inv: any) => inv.status === 'pending').length > 0 && (
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Pending Invitations</span>
              </div>

              <div style={{ marginTop: 12 }}>
                {teamData.invites.filter((inv: any) => inv.status === 'pending').map((inv: any, idx: number, arr: any[]) => {
                  const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null;
                  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
                  const invUrl = inv.token && typeof window !== 'undefined' ? `${window.location.origin}/auth/signup?invite=${inv.token}` : null;
                  return (
                    <div
                      key={inv.id || inv.email}
                      style={{
                        padding: '12px 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{inv.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>Role: <strong style={{ textTransform: 'capitalize' }}>{inv.role || 'member'}</strong></span>
                          {daysLeft !== null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: daysLeft <= 1 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              <Clock size={10} /> Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {invUrl && (
                          <button
                            type="button"
                            className="lx-btn-outline"
                            style={{ padding: '6px 12px', fontSize: 11 }}
                            onClick={() => { navigator.clipboard.writeText(invUrl); }}
                          >
                            <Link size={11} /> Copy link
                          </button>
                        )}
                        <button
                          type="button"
                          className="lx-btn-danger"
                          style={{ padding: '6px 12px', fontSize: 11, opacity: revokingId === inv.id ? 0.6 : 1 }}
                          onClick={() => handleRevokeInvite(inv.id)}
                          disabled={revokingId === inv.id}
                          title="Revoke invite"
                        >
                          {revokingId === inv.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Trash2 size={11} />
                          }
                          {revokingId === inv.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── ALERTS ─── */}
        <TabsContent value="alerts">
          <NotificationsTab />
          {workspace?.id && <AlertsTab workspaceId={workspace.id} />}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title || ''}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => confirmState?.onConfirm()}
      />
    </div>
  );
}
