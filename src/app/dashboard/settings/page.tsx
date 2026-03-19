"use client";
import { useState, useRef, useEffect } from "react";
import { Search, BarChart3, Target, Share2, Check, X, Plug, User, Bell, Shield, CreditCard, RefreshCw, Loader2, Palette, Upload } from "lucide-react";
import { useWorkspace, useIntegrations, connectIntegration, syncIntegration } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";

const BRAND_COLORS = [
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f59e0b' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Red', value: '#ef4444' },
];

function NotificationsTab() {
  const notifItems = [
    { id: "traffic", label: "Traffic Alerts", desc: "Get notified when traffic spikes or drops significantly" },
    { id: "ads", label: "Ad Alerts", desc: "Budget exhaustion, CPC spikes, ROAS drops" },
    { id: "weekly", label: "Weekly Digest", desc: "A weekly summary of your marketing performance" },
    { id: "monthly", label: "Monthly Report", desc: "Full monthly marketing report delivered to your inbox" },
  ];
  const [toggles, setToggles] = useState<Record<string, boolean>>({ traffic: true, ads: true, weekly: true, monthly: false });
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: "560px" }}>
      <div style={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
        {notifItems.map((item, i) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: i < notifItems.length - 1 ? "1px solid #27272a" : "none" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#e4e4e7" }}>{item.label}</div>
              <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>{item.desc}</div>
            </div>
            <div
              onClick={() => setToggles(t => ({ ...t, [item.id]: !t[item.id] }))}
              style={{ width: "42px", height: "24px", borderRadius: "12px", cursor: "pointer", position: "relative", backgroundColor: toggles[item.id] ? "#7c3aed" : "#3f3f46", transition: "background-color 0.2s", flexShrink: 0 }}
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

function BrandTab({ workspace }: { workspace: any }) {
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const ext = file.name.split('.').pop();
      const path = `${session.user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true });
      if (!upErr) {
        const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
        setLogoUrl(data.publicUrl);
        setLogoPreview(URL.createObjectURL(file));
      }
    } catch {}
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
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', marginBottom: '20px' }}>Brand Identity</h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Brand Name</label>
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="e.g. Acme Corp"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid #3f3f46' }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#d4d4d8', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <div style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>PNG, JPG up to 2MB</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '10px' }}>Brand Color</label>
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
            <span style={{ fontSize: '13px', color: '#71717a' }}>{brandColor}</span>
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
  { id: "gsc", name: "Google Search Console", icon: Search, desc: "Track keyword rankings, clicks, and impressions", color: "#4285F4" },
  { id: "ga4", name: "Google Analytics 4", icon: BarChart3, desc: "Website traffic, sessions, and conversion data", color: "#E37400" },
  { id: "google_ads", name: "Google Ads", icon: Target, desc: "Campaign performance, spend, and ROAS tracking", color: "#34A853" },
  { id: "meta_ads", name: "Meta Ads", icon: Share2, desc: "Facebook & Instagram ad analytics", color: "#1877F2" },
];

const tabs = [
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("integrations");
  const { workspace, loading: wsLoading } = useWorkspace();
  const { integrations, loading: intLoading, refetch } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState<string | null>(null);

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
      await syncIntegration(int.id, workspace.id, providerId);
      refetch();
    } catch {}
    setSyncing(null);
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.5px" }}>Settings</h1>
        <p style={{ fontSize: "14px", color: "#71717a", marginTop: "4px" }}>Manage integrations, brand, and preferences</p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid #27272a", overflowX: "auto" }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", fontSize: "14px",
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? "#f4f4f5" : "#71717a",
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
          <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "20px" }}>
            Connect your marketing accounts to start syncing real data.
            {wsLoading && " Loading workspace..."}
            {!wsLoading && !workspace && " ⚠️ Workspace not found — try refreshing."}
            {workspace && <span style={{ color: "#10b981" }}> Workspace: {workspace.name}</span>}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {providers.map(p => {
              const Icon = p.icon;
              const connected = isConnected(p.id);
              const int = getIntegration(p.id);
              const isSyncing = syncing === p.id;
              return (
                <div key={p.id} style={{ backgroundColor: "#18181b", border: `1px solid ${connected ? "rgba(16,185,129,0.3)" : "#27272a"}`, borderRadius: "16px", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: `${p.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={22} color={p.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>{p.name}</div>
                        <div style={{ fontSize: "12px", color: connected ? "#10b981" : "#52525b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          {connected ? <><Check size={12} /> Connected{int?.display_name ? ` · ${int.display_name}` : ""}</> : <><X size={12} /> Not connected</>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#71717a", marginBottom: "16px", lineHeight: 1.4 }}>{p.desc}</p>
                  {int?.last_sync_at && (
                    <p style={{ fontSize: "11px", color: "#52525b", marginBottom: "12px" }}>
                      Last synced: {new Date(int.last_sync_at).toLocaleString()}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => connected ? null : handleConnect(p.id)} style={{
                      flex: 1, padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                      background: connected ? "transparent" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      color: connected ? "#71717a" : "white",
                      border: connected ? "1px solid #3f3f46" : "none",
                    }}>
                      {connected ? "Connected ✓" : "Connect"}
                    </button>
                    {connected && (p.id === "gsc" || p.id === "ga4") && (
                      <button onClick={() => handleSync(p.id)} disabled={isSyncing} style={{
                        padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: isSyncing ? "wait" : "pointer",
                        background: "#27272a", color: "#d4d4d8", border: "1px solid #3f3f46",
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

      {activeTab === "brand" && <BrandTab workspace={workspace} />}

      {activeTab === "profile" && (
        <div style={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", maxWidth: "500px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f4f4f5", marginBottom: "20px" }}>Profile Settings</h3>
          {["Full Name", "Email", "Company"].map(field => (
            <div key={field} style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px" }}>{field}</label>
              <input placeholder={field} style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <button style={{ padding: "10px 24px", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer" }}>Save Changes</button>
        </div>
      )}

      {activeTab === "notifications" && <NotificationsTab />}

      {activeTab !== "integrations" && activeTab !== "brand" && activeTab !== "profile" && activeTab !== "notifications" && (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", border: "1px dashed #27272a" }}>
          <p style={{ fontSize: "15px", color: "#52525b" }}>Coming soon — {activeTab} settings</p>
        </div>
      )}
    </div>
  );
}
