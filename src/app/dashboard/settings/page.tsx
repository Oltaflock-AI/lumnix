"use client";
import { useState, useRef, useEffect } from "react";
import { Search, BarChart3, Target, Share2, Check, X, Plug, User, Bell, Shield, CreditCard, RefreshCw, Loader2, Palette, Upload, Users, Mail, Crown } from "lucide-react";
import { useIntegrations, connectIntegration, syncIntegration } from "@/lib/hooks";
import { useWorkspaceCtx } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";

const BRAND_COLORS = [
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f59e0b' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Red', value: '#ef4444' },
];

function NotificationsTab() {
  const { c } = useTheme();
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
    <div style={{ maxWidth: "560px" }}>
      <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
        {notifItems.map((item, i) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: i < notifItems.length - 1 ? `1px solid ${c.border}` : "none" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: c.text }}>{item.label}</div>
              <div style={{ fontSize: "12px", color: c.textSecondary, marginTop: "2px" }}>{item.desc}</div>
            </div>
            <div
              onClick={() => setToggles(t => ({ ...t, [item.id]: !t[item.id] }))}
              style={{ width: "42px", height: "24px", borderRadius: "12px", cursor: "pointer", position: "relative", backgroundColor: toggles[item.id] ? "#7c3aed" : c.border, transition: "background-color 0.2s", flexShrink: 0 }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: toggles[item.id] ? "21px" : "3px", transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px", border: "none", background: saved ? "#22c55e" : "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
        {saved ? <><Check size={16} /> Saved!</> : "Save Preferences"}
      </button>
    </div>
  );
}

function BrandTab({ workspace, onSaved, onUpdate }: { workspace: any; onSaved?: () => void; onUpdate?: (w: any) => void }) {
  const { c } = useTheme();
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
        document.documentElement.style.setProperty('--accent', brandColor);
      } else {
        setError('Failed to save brand settings');
      }
    } catch {
      setError('Failed to save brand settings');
    }
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>Brand Identity</h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.textSecondary, marginBottom: '8px' }}>Brand Name</label>
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="e.g. Acme Corp"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${c.border}`, backgroundColor: c.bgInput, color: c.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.textSecondary, marginBottom: '8px' }}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: c.bgInput, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: `1px solid ${c.border}` }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: '18px', fontWeight: 700, color: brandColor }}>{brandName.substring(0, 2).toUpperCase() || 'KR'}</div>
              )}
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${c.border}`, backgroundColor: c.bgInput, color: c.textSecondary, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <div style={{ fontSize: '11px', color: c.textMuted, marginTop: '4px' }}>PNG, JPG up to 2MB</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.textSecondary, marginBottom: '10px' }}>Brand Color</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {BRAND_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setBrandColor(c.value)}
                title={c.label}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  backgroundColor: c.value, border: 'none', cursor: 'pointer',
                  outline: brandColor === c.value ? '3px solid white' : '3px solid transparent',
                  outlineOffset: '2px', position: 'relative',
                }}
              >
                {brandColor === c.value && (
                  <Check size={16} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: brandColor }} />
            <span style={{ fontSize: '13px', color: c.textSecondary }}>{brandColor}</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', border: 'none', background: saved ? '#22c55e' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
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
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "team", label: "Team", icon: Users },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
];

function ProfileTab() {
  const { c } = useTheme();
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

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${c.border}`, backgroundColor: c.bgInput, color: c.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '24px', maxWidth: '500px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>Profile Settings</h3>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.textSecondary, marginBottom: '6px' }}>Full Name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.textSecondary, marginBottom: '6px' }}>Email</label>
        <input value={email} readOnly placeholder="your@email.com" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
        <p style={{ fontSize: '11px', color: c.textMuted, marginTop: '4px' }}>Email cannot be changed here</p>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.textSecondary, marginBottom: '6px' }}>Company</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" style={inputStyle} />
      </div>
      {error && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '10px 24px', borderRadius: '10px', background: saved ? '#22c55e' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : null}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { c } = useTheme();
  const [activeTab, setActiveTab] = useState("integrations");
  const { workspace, loading: wsLoading, refetch: refetchWorkspace, setWorkspace } = useWorkspaceCtx();
  const { integrations, loading: intLoading, refetch } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Team invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [teamData, setTeamData] = useState<{ invites: any[]; canInviteMore: boolean; slotsUsed: number; maxSlots: number } | null>(null);

  useEffect(() => {
    if (workspace?.id && activeTab === "team") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return;
        fetch(`/api/team/invite?workspace_id=${workspace.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).then(r => r.json()).then(d => {
          if (d.error) setTeamData({ invites: [], canInviteMore: true, slotsUsed: 0, maxSlots: 2 });
          else setTeamData(d);
        }).catch(() => setTeamData({ invites: [], canInviteMore: true, slotsUsed: 0, maxSlots: 2 }));
      });
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
      body: JSON.stringify({ email: inviteEmail, workspace_id: workspace.id }),
    });
    const data = await res.json();
    setInviteMsg({ text: data.success ? `Invite sent to ${inviteEmail}` : data.error, ok: !!data.success });
    if (data.success) {
      setInviteEmail("");
      setTeamData(prev => prev ? { ...prev, slotsUsed: prev.slotsUsed + 1, canInviteMore: prev.slotsUsed + 1 < prev.maxSlots, invites: [...prev.invites, { email: inviteEmail, status: 'pending', created_at: new Date().toISOString(), inviteUrl: data.inviteUrl }] } : prev);
      if (!data.emailSent && data.inviteUrl) {
        setInviteMsg({ text: `Email couldn't send — copy this link and share it: ${data.inviteUrl}`, ok: true });
      }
    }
    setInviting(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      refetch();
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, []);

  const isConnected = (providerId: string) => integrations.some(i => i.provider === providerId && i.status === "connected");
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
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: c.text, letterSpacing: "-0.5px" }}>Settings</h1>
        <p style={{ fontSize: "14px", color: c.textSecondary, marginTop: "4px" }}>Manage integrations, brand, and preferences</p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: `1px solid ${c.border}`, overflowX: "auto" }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", fontSize: "14px",
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? c.text : c.textSecondary,
              backgroundColor: "transparent", border: "none",
              borderBottom: `2px solid ${activeTab === t.id ? "#7c3aed" : "transparent"}`,
              cursor: "pointer", marginBottom: "-1px", whiteSpace: "nowrap",
            }}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "integrations" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: "14px", color: c.textSecondary, margin: 0 }}>
              Connect your marketing accounts to start syncing real data.
              {wsLoading && " Loading..."}
              {workspace && <span style={{ color: "#10b981" }}> · {workspace.name}</span>}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: c.textMuted }}>Auto-syncs daily at 2AM UTC</span>
              <button
                onClick={handleSyncAll}
                disabled={syncing === 'all'}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white", fontSize: 13, fontWeight: 600, cursor: syncing === 'all' ? "wait" : "pointer", opacity: syncing === 'all' ? 0.7 : 1 }}
              >
                <RefreshCw size={13} style={{ animation: syncing === 'all' ? 'spin 1s linear infinite' : 'none' }} />
                {syncing === 'all' ? 'Syncing...' : 'Sync All Now'}
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {providers.map(p => {
              const Icon = p.icon;
              const connected = isConnected(p.id);
              const int = getIntegration(p.id);
              const isSyncing = syncing === p.id;
              return (
                <div key={p.id} style={{ backgroundColor: c.bgCard, border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : c.border}`, borderRadius: "16px", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: `${p.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <img src={`https://cdn.simpleicons.org/${p.logoSlug}/${p.color.replace('#', '')}`} width={26} height={26} alt={p.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: c.text }}>{p.name}</div>
                        <div style={{ fontSize: "12px", color: connected ? "#10b981" : c.textMuted, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          {connected ? <><Check size={12} /> Connected{int?.display_name ? ` · ${int.display_name}` : ""}</> : <><X size={12} /> Not connected</>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: c.textSecondary, marginBottom: "16px", lineHeight: 1.4 }}>{p.desc}</p>
                  {int?.last_sync_at && (
                    <p style={{ fontSize: "11px", color: c.textMuted, marginBottom: "12px" }}>
                      Last synced: {new Date(int.last_sync_at).toLocaleString()}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => connected ? null : handleConnect(p.id)} style={{
                      flex: 1, padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                      background: connected ? "transparent" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      color: connected ? c.textSecondary : "white",
                      border: connected ? `1px solid ${c.border}` : "none",
                    }}>
                      {connected ? "Connected ✓" : "Connect"}
                    </button>
                    {connected && (
                      <button onClick={() => handleSync(p.id)} disabled={isSyncing} style={{
                        padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: isSyncing ? "wait" : "pointer",
                        background: c.bgInput, color: c.textSecondary, border: `1px solid ${c.border}`,
                        display: "flex", alignItems: "center", gap: "6px", opacity: isSyncing ? 0.6 : 1,
                      }}>
                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        {isSyncing ? "Syncing..." : "Sync Now"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div style={{ maxWidth: 560 }}>
          {/* Slots indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Crown size={16} color="#f59e0b" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Free Plan</div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>Up to {teamData?.maxSlots || 2} additional team members</div>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.text, fontFamily: "var(--font-display)" }}>
              {teamData?.slotsUsed || 0} / {teamData?.maxSlots || 2}
              <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: "var(--font-body)", fontWeight: 400, marginLeft: 4 }}>used</span>
            </div>
          </div>

          {/* Invite form */}
          <div style={{ padding: "20px 24px", borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>Invite a team member</h3>
            <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 16 }}>They'll receive an email with a link to sign up and join your workspace.</p>
            <form onSubmit={handleInvite} style={{ display: "flex", gap: 10 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  disabled={teamData?.canInviteMore === false}
                  style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: `1px solid ${c.border}`, backgroundColor: c.bgInput, color: c.text, fontSize: 14, outline: "none", boxSizing: "border-box", opacity: teamData?.canInviteMore === false ? 0.5 : 1 }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#7c3aed"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#334155"}
                />
              </div>
              <button
                type="submit"
                disabled={inviting || !inviteEmail || teamData?.canInviteMore === false}
                style={{ padding: "10px 18px", borderRadius: 8, border: "none", backgroundColor: "#7c3aed", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (inviting || !inviteEmail || teamData?.canInviteMore === false) ? 0.6 : 1, whiteSpace: "nowrap" }}
              >
                {inviting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={14} />}
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </form>
            {teamData?.canInviteMore === false && (
              <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 10 }}>⚠️ Member limit reached. Upgrade to add more.</p>
            )}
            {inviteMsg && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, backgroundColor: inviteMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${inviteMsg.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: inviteMsg.ok ? "#22c55e" : "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                {inviteMsg.ok ? <Check size={13} /> : <X size={13} />}
                {inviteMsg.text}
              </div>
            )}
          </div>

          {/* Pending invites */}
          {teamData?.invites && teamData.invites.length > 0 && (
            <div style={{ padding: "20px 24px", borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 16 }}>Pending Invites</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {teamData.invites.map((inv: any) => (
                  <div key={inv.id || inv.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, backgroundColor: c.bgPage, border: `1px solid ${c.borderSubtle}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: c.text }}>{inv.email}</div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>Invited {new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, backgroundColor: inv.status === "accepted" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: inv.status === "accepted" ? "#22c55e" : "#f59e0b" }}>
                      {inv.status === "accepted" ? "Joined" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "brand" && <BrandTab workspace={workspace} onSaved={refetchWorkspace} onUpdate={setWorkspace} />}

      {activeTab === "profile" && <ProfileTab />}

      {activeTab === "notifications" && <NotificationsTab />}

      {activeTab !== "integrations" && activeTab !== "brand" && activeTab !== "profile" && activeTab !== "notifications" && (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", border: `1px dashed ${c.border}` }}>
          <p style={{ fontSize: "15px", color: c.textMuted }}>Coming soon — {activeTab} settings</p>
        </div>
      )}
    </div>
  );
}

