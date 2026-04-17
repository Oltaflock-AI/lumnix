import { useState } from "react";

/**
 * LUMNIX UI REHAUL — Interactive Showcase
 * Shows the new design system across Dashboard, Meta Ads, SEO, and Settings
 */

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  // Canvas
  bgPage: "#F7F6FE",
  bgCard: "#FFFFFF",
  bgCardSecondary: "#F0EEF9",
  bgCardHover: "#F4F2FF",

  // Borders (purple-tinted)
  border: "#E4E2F4",
  borderSubtle: "#EEECF8",

  // Brand
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  primaryHover: "#6D28D9",
  primaryLight: "#EDE9FF",
  primaryUltra: "#F4F2FF",

  // Text (purple-tinted dark)
  textPrimary: "#18163A",
  textSecondary: "#4A4770",
  textMuted: "#7C7AAA",

  // Semantic
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  info: "#0891B2",

  // Shadows
  shadowCard: "0 2px 12px rgba(91,33,182,0.06)",
  shadowHover: "0 4px 24px rgba(91,33,182,0.10)",
  shadowDropdown: "0 8px 32px rgba(91,33,182,0.12)",
};

const font = {
  display: "'Plus Jakarta Sans', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
};

// ─── Global Shell ─────────────────────────────────────────────────────────────
const pages = ["Dashboard", "Analytics", "SEO", "Google Ads", "Meta Ads", "AI Assistant", "Settings"];
const sections = {
  Dashboard: "ANALYTICS",
  Analytics: "ANALYTICS",
  SEO: "ANALYTICS",
  "Google Ads": "ADVERTISING",
  "Meta Ads": "ADVERTISING",
  "AI Assistant": "INTELLIGENCE",
  Settings: null,
};
const sectionColors = {
  ANALYTICS: T.primary,
  ADVERTISING: T.info,
  INTELLIGENCE: T.success,
};

function Sidebar({ active, setActive }) {
  const navGroups = [
    { section: "ANALYTICS", items: ["Dashboard", "Analytics", "SEO"] },
    { section: "ADVERTISING", items: ["Google Ads", "Meta Ads"] },
    { section: "INTELLIGENCE", items: ["AI Assistant", "Competitors"] },
  ];

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: T.bgCard,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Purple gradient left accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(to bottom, #7C3AED 0%, #0891B2 50%, #059669 100%)",
          opacity: 0.6,
        }}
      />

      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            background: T.primaryDark,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font.display,
            fontSize: 15,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          L
        </div>
        <span style={{ fontFamily: font.display, fontSize: 16, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.01em" }}>
          Lumnix
        </span>
      </div>

      {/* Workspace */}
      <div style={{ padding: "10px 14px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, letterSpacing: "0.07em", color: T.textMuted, textTransform: "uppercase", marginBottom: 3, fontFamily: font.body }}>
          Workspace
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, fontFamily: font.display }}>
          Oltaflock AI
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {navGroups.map((group) => (
          <div key={group.section}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "10px 8px 4px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: T.textMuted,
                textTransform: "uppercase",
                fontFamily: font.body,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: sectionColors[group.section],
                  flexShrink: 0,
                }}
              />
              {group.section}
            </div>
            {group.items.map((item) => {
              const isActive = active === item;
              return (
                <div
                  key={item}
                  onClick={() => setActive(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "0 10px",
                    height: 44,
                    borderRadius: 8,
                    marginBottom: 2,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? T.primaryDark : T.textSecondary,
                    background: isActive
                      ? "linear-gradient(to right, rgba(124,58,237,0.12), rgba(124,58,237,0.04))"
                      : "transparent",
                    borderLeft: isActive ? `3px solid ${T.primary}` : "3px solid transparent",
                    transition: "all 150ms ease",
                    fontFamily: font.body,
                  }}
                >
                  <NavIcon name={item} active={isActive} />
                  {item}
                  {item === "Competitors" && (
                    <span
                      style={{
                        marginLeft: "auto",
                        background: T.primary,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 10,
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 8 }}>
          {["Reports", "Alerts", "Settings"].map((item) => {
            const isActive = active === item;
            return (
              <div
                key={item}
                onClick={() => setActive(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "0 10px",
                  height: 44,
                  borderRadius: 8,
                  marginBottom: 2,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? T.primaryDark : T.textSecondary,
                  background: isActive ? "linear-gradient(to right, rgba(124,58,237,0.12), rgba(124,58,237,0.04))" : "transparent",
                  borderLeft: isActive ? `3px solid ${T.primary}` : "3px solid transparent",
                  fontFamily: font.body,
                }}
              >
                <NavIcon name={item} active={isActive} />
                {item}
                {item === "Alerts" && (
                  <span style={{ marginLeft: "auto", background: T.primary, color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10 }}>
                    7
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: T.textMuted,
            }}
          >
            🌙
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, cursor: "pointer", fontFamily: font.body, display: "flex", alignItems: "center", gap: 4 }}>
            💬 Feedback
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 14px" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: T.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: T.primaryDark,
              fontFamily: font.display,
            }}
          >
            KH
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, fontFamily: font.body }}>
            Oltaflock AI
          </span>
          <div style={{ marginLeft: "auto", color: T.textMuted, cursor: "pointer", fontSize: 14 }}>→</div>
        </div>
      </div>
    </div>
  );
}

function NavIcon({ name, active }) {
  const color = active ? T.primaryDark : T.textMuted;
  const icons = {
    Dashboard: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    Analytics: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
    SEO: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    "Google Ads": <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    "Meta Ads": <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"/></svg>,
    "AI Assistant": <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Competitors: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    Reports: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>,
    Alerts: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>,
    Settings: <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  };
  return icons[name] || <svg width="15" height="15" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accentColor, trend, icon, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "18px 18px 16px",
        boxShadow: hovered ? T.shadowHover : T.shadowCard,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 200ms ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: "14px 14px 0 0",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          {icon}
        </div>
        {trend && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: trend.up ? T.success : T.danger,
              background: trend.up ? T.successBg : T.dangerBg,
              padding: "3px 8px",
              borderRadius: 20,
              fontFamily: font.body,
            }}
          >
            {trend.up ? "▲" : "▼"} {trend.value}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: font.body }}>
        {label}
      </div>
      <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 800, color: accentColor === T.border ? T.textMuted : T.textPrimary, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6, fontFamily: font.body }}>
        {sub}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    active:       { bg: T.successBg, text: "#065F46", border: "#A7F3D0", icon: "●", label: "Active" },
    paused:       { bg: T.warningBg, text: "#92400E", border: "#FDE68A", icon: "⏸", label: "Paused" },
    error:        { bg: T.dangerBg, text: "#991B1B", border: "#FECACA", icon: "✕", label: "Error" },
    connected:    { bg: T.successBg, text: "#065F46", border: "#A7F3D0", icon: "●", label: "Connected" },
    disconnected: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0", icon: "○", label: "Disconnected" },
  }[status] || { bg: "#F8FAFC", text: "#94A3B8", border: "#E2E8F0", icon: "○", label: status };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: config.text,
        background: config.bg,
        border: `1px solid ${config.border}`,
        padding: "3px 9px",
        borderRadius: 20,
        fontFamily: font.body,
      }}
    >
      {config.icon} {config.label}
    </div>
  );
}

// ─── Page Views ───────────────────────────────────────────────────────────────
function DashboardPage() {
  const metrics = [
    { label: "Sessions", value: "9,511", sub: "8,957 users", accentColor: T.primary, icon: "📈", trend: { up: false, value: "−25%" } },
    { label: "Organic Clicks", value: "214", sub: "820 impressions", accentColor: T.success, icon: "🔍", trend: { up: true, value: "+8%" } },
    { label: "Ad Spend", value: "₹8,159", sub: "Last 30 days", accentColor: T.warning, icon: "💸", trend: null },
    { label: "ROAS", value: "—", sub: "No revenue data", accentColor: T.border, icon: "🎯", trend: null },
  ];

  const anomalies = [
    { dot: T.danger, title: "GA4 data collection interrupted", desc: "No sessions recorded in last 6 hours", src: "GA4", srcColor: T.warning, srcBg: T.warningBg },
    { dot: T.warning, title: "Average position dropped to #37.5", desc: "Focus on top 10 keywords to recover page 1 traffic", src: "GSC", srcColor: T.success, srcBg: T.successBg },
    { dot: T.info, title: "Meta Ads synced successfully", desc: "3,14,735 impressions pulled from Vippy Soya", src: "Meta", srcColor: T.primary, srcBg: T.primaryLight },
  ];

  const keywords = [
    { rank: "#1", kw: "promunch", clicks: 106, rankColor: T.success, rankBg: T.successBg },
    { rank: "#1", kw: "promuch snacks", clicks: 23, rankColor: T.success, rankBg: T.successBg },
    { rank: "#3", kw: "promunch soya crunchies", clicks: 9, rankColor: T.primary, rankBg: T.primaryLight },
    { rank: "#2", kw: "promunch soya chunks", clicks: 3, rankColor: T.primary, rankBg: T.primaryLight },
    { rank: "#8", kw: "soya mini chunks", clicks: 1, rankColor: T.warning, rankBg: T.warningBg },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>
          Welcome back, <span style={{ color: T.primary }}>Khush</span>
        </div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4, fontFamily: font.body }}>
          3 sources connected · Last 30 days
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} delay={i * 60} />)}
      </div>

      {/* Anomalies */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowCard }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: font.display, fontSize: 14, fontWeight: 700, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ AI Anomalies
            <span style={{ fontSize: 11, fontWeight: 600, background: T.warningBg, color: "#92400E", padding: "3px 8px", borderRadius: 20, fontFamily: font.body }}>3 new</span>
          </div>
          <span style={{ fontSize: 12, color: T.primary, cursor: "pointer", fontFamily: font.body }}>View all →</span>
        </div>
        {anomalies.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < 2 ? `1px solid ${T.borderSubtle}` : "none", borderLeft: `3px solid ${a.dot}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, fontFamily: font.body }}>{a.title}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontFamily: font.body }}>{a.desc}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: a.srcColor, background: a.srcBg, padding: "3px 8px", borderRadius: 6, fontFamily: font.body }}>{a.src}</div>
            <div style={{ fontSize: 16, color: T.textMuted, cursor: "pointer" }}>✕</div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12 }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, boxShadow: T.shadowCard }}>
          <div style={{ fontFamily: font.display, fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>Organic vs Paid traffic</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, fontFamily: font.body }}>Daily clicks — last 30 days</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textSecondary, fontFamily: font.body }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />Organic
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textSecondary, fontFamily: font.body }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.info }} />Paid
            </div>
          </div>
          {/* Chart bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
            {[45, 62, 48, 80, 95, 72, 88, 75, 92, 68, 55, 70, 65, 42].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i < 9 ? `${T.primary}${Math.round((0.5 + i * 0.04) * 255).toString(16)}` : `${T.info}99`, borderRadius: "3px 3px 0 0" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            {["Mar 12", "", "", "Mar 15", "", "", "Mar 18", "", "", "Mar 22", "", "", "Mar 28", "Apr"].map((l, i) => (
              <div key={i} style={{ flex: 1, fontSize: 9, color: T.textMuted, textAlign: "center", fontFamily: font.body }}>{l}</div>
            ))}
          </div>
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, boxShadow: T.shadowCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: font.display, fontSize: 14, fontWeight: 700, color: T.textPrimary }}>Top keywords</span>
            <span style={{ fontSize: 12, color: T.primary, cursor: "pointer", fontFamily: font.body }}>View all →</span>
          </div>
          {keywords.map((k, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${T.borderSubtle}` : "none" }}>
              <div style={{ width: 28, height: 24, borderRadius: 6, background: k.rankBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: k.rankColor, fontFamily: font.display, flexShrink: 0 }}>
                {k.rank}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: T.textPrimary, fontFamily: font.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.kw}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary, fontFamily: font.display }}>{k.clicks}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [tab, setTab] = useState("Integrations");
  const tabs = ["General", "Brand", "Integrations", "Team", "Alerts", "Billing"];

  const integrations = [
    { name: "Google Search Console", desc: "Track keyword rankings, clicks, and impressions", status: "connected", user: "khush@oltaflock.ai", lastSync: "4/11/2026, 8:46 AM", logoColor: "#34A853", logo: "G" },
    { name: "Google Analytics 4", desc: "Website traffic, sessions, and conversion data", status: "connected", user: "khush@oltaflock.ai", lastSync: "4/11/2026, 8:47 AM", logoColor: "#E37400", logo: "GA" },
    { name: "Google Ads", desc: "Campaign performance, spend, and ROAS tracking", status: "disconnected", user: null, lastSync: null, logoColor: "#4285F4", logo: "G" },
    { name: "Meta Ads", desc: "Facebook & Instagram ad analytics", status: "connected", user: "Khush Mutha", lastSync: "4/11/2026, 7:51 PM", logoColor: "#1877F2", logo: "M" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>Settings</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4, fontFamily: font.body }}>Manage integrations, brand, and preferences</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "inline-flex", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, gap: 2 }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "7px 16px",
              borderRadius: 9,
              border: "none",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#fff" : T.textSecondary,
              background: tab === t ? T.primary : "transparent",
              cursor: "pointer",
              fontFamily: font.body,
              transition: "all 150ms",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Integrations" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: T.textMuted, fontFamily: font.body }}>
              Connect your marketing accounts to start syncing real data.
            </span>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#fff", background: T.primary, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: font.body }}>
              🔄 Sync All Now
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {integrations.map((int, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.shadowCard }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: int.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: font.display, flexShrink: 0 }}>
                    {int.logo}
                  </div>
                  <div>
                    <div style={{ fontFamily: font.display, fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{int.name}</div>
                    <StatusBadge status={int.status} />
                    {int.user && <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6, fontFamily: font.body }}>{int.user}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 12, fontFamily: font.body }}>{int.desc}</div>
                {int.lastSync && (
                  <div style={{ background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: T.textMuted, fontFamily: font.body }}>
                    🕐 Last sync: {int.lastSync}<br />
                    <span style={{ color: T.success }}>✓ Last sync succeeded</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  {int.status === "connected" ? (
                    <>
                      <button style={{ flex: 1, border: `1px solid ${T.border}`, background: "transparent", borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 500, color: T.textSecondary, cursor: "pointer", fontFamily: font.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        🔄 Sync Now
                      </button>
                      <button style={{ border: `1px solid #FECACA`, background: "transparent", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 500, color: T.danger, cursor: "pointer", fontFamily: font.body, display: "flex", alignItems: "center", gap: 5 }}>
                        ✕ Disconnect
                      </button>
                    </>
                  ) : (
                    <button style={{ width: "100%", background: T.primary, border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: font.body }}>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab !== "Integrations" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: T.textMuted, fontFamily: font.body, fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
          Click the <strong style={{ color: T.primary }}>Integrations</strong> tab to see the redesigned layout
        </div>
      )}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: T.bgCard, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, color: T.textMuted, fontFamily: font.body }}>April 12, 2026</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 9, padding: "7px 14px", fontSize: 13, color: T.textMuted, width: 220, fontFamily: font.body }}>
          🔍 Search anything...
          <span style={{ marginLeft: "auto", background: T.primaryLight, color: T.primaryDark, fontSize: 10, padding: "2px 5px", borderRadius: 4, fontWeight: 600, fontFamily: font.body }}>⌘K</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function LumnixRehaul() {
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    if (active === "Dashboard") return <DashboardPage />;
    if (active === "Settings") return <SettingsPage />;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, color: T.textMuted, fontFamily: font.body }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
        <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{active}</div>
        <div style={{ fontSize: 14 }}>Switch to <strong style={{ color: T.primary, cursor: "pointer" }} onClick={() => setActive("Dashboard")}>Dashboard</strong> or <strong style={{ color: T.primary, cursor: "pointer" }} onClick={() => setActive("Settings")}>Settings</strong> to see the rehaul</div>
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: font.body,
        background: T.bgPage,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar active={active} setActive={setActive} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
          <Topbar active={active} />
          <div style={{ flex: 1, padding: "22px 24px", maxWidth: 1280 }}>
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}
