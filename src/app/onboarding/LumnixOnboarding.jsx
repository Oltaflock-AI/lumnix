'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  purple: "#7C3AED",
  purpleDark: "#5B21B6",
  purpleLight: "#EDE9FF",
  purpleMid: "#A78BFA",
  page: "#F8F7FC",
  card: "#FFFFFF",
  border: "#EAE8FF",
  textPrimary: "#18163A",
  textSecondary: "#6B7280",
  textMuted: "#A09CC0",
  green: "#059669",
  greenLight: "#ECFDF5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEF2F2",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const styles = {
  card: {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 4px 24px rgba(91,33,182,0.06)",
  },
  logoMark: {
    width: "44px",
    height: "44px",
    background: T.purpleDark,
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "800",
    color: "#fff",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    color: T.textPrimary,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    letterSpacing: "-0.01em",
  },
  h1: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "26px",
    fontWeight: "700",
    color: T.textPrimary,
    letterSpacing: "-0.02em",
    margin: "0 0 8px",
    lineHeight: "1.2",
  },
  body: {
    fontSize: "15px",
    color: T.textSecondary,
    lineHeight: "1.6",
    margin: "0 0 28px",
  },
  btnPrimary: {
    background: T.purple,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "13px 24px",
    fontSize: "15px",
    fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    width: "100%",
    transition: "background 150ms",
  },
  btnSecondary: {
    background: "transparent",
    color: T.textSecondary,
    border: `1px solid ${T.border}`,
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "border-color 150ms",
  },
  input: {
    width: "100%",
    border: `1px solid ${T.border}`,
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "15px",
    fontFamily: "'DM Sans', sans-serif",
    color: T.textPrimary,
    background: T.page,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 150ms",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: T.textPrimary,
    marginBottom: "8px",
    display: "block",
    fontFamily: "'DM Sans', sans-serif",
  },
  stepBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: T.purpleDark,
    background: T.purpleLight,
    padding: "4px 10px",
    borderRadius: "20px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
  },
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            background: i < step ? T.purple : i === step ? T.purpleMid : T.border,
            transition: "background 300ms",
          }}
        />
      ))}
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
      <div style={styles.logoMark}>L</div>
      <span style={styles.logoText}>Lumnix</span>
    </div>
  );
}

// ─── STEP 1: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ onNext, userName }) {
  return (
    <div style={styles.card}>
      <Logo />
      <ProgressBar step={0} total={4} />

      <div
        style={{
          width: "64px",
          height: "64px",
          background: T.purpleLight,
          borderRadius: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "30px",
          marginBottom: "24px",
        }}
      >
        👋
      </div>

      <h1 style={styles.h1}>
        {userName ? `Welcome, ${userName.split(" ")[0]}!` : "Welcome to Lumnix"}
      </h1>
      <p style={{
        fontSize: "15px",
        color: T.textSecondary,
        lineHeight: "1.65",
        margin: "0 0 28px",
      }}>
        You're about to replace 5 fragmented marketing tools with one AI-powered
        intelligence platform. Let's get you set up in under 3 minutes.
      </p>

      {/* Value props */}
      <div
        style={{
          background: T.page,
          border: `1px solid ${T.border}`,
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {[
          { icon: "📊", text: "Unified analytics — GA4, GSC, Google Ads, Meta Ads" },
          { icon: "🤖", text: "AI insights from Lumi — ask anything about your data" },
          { icon: "🕵️", text: "Competitor Ad Spy — see what's working for your rivals" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            <span style={{ fontSize: "14px", color: T.textPrimary, fontWeight: "500" }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <button
        style={styles.btnPrimary}
        onClick={onNext}
        onMouseEnter={e => (e.target.style.background = T.purpleDark)}
        onMouseLeave={e => (e.target.style.background = T.purple)}
      >
        Get started →
      </button>

      <p style={{ fontSize: "12px", color: T.textMuted, textAlign: "center", marginTop: "14px" }}>
        Takes about 3 minutes · No credit card required
      </p>
    </div>
  );
}

// ─── STEP 2: Workspace Setup ──────────────────────────────────────────────────
function StepWorkspace({ onNext, userName, saving, error }) {
  const [name, setName] = useState(userName || "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [focused, setFocused] = useState(null);

  const inputStyle = (field) => ({
    ...styles.input,
    borderColor: focused === field ? T.purple : T.border,
    boxShadow: focused === field ? `0 0 0 3px rgba(124,58,237,0.1)` : "none",
  });

  const roles = ["Founder / Solo marketer", "Marketing agency", "D2C brand", "Freelancer"];

  return (
    <div style={styles.card}>
      <Logo />
      <ProgressBar step={1} total={4} />

      <span style={styles.stepBadge}>Step 1 of 4</span>

      <h1 style={{ ...styles.h1, marginTop: "14px" }}>Set up your workspace</h1>
      <p style={{ fontSize: "14px", color: T.textSecondary, margin: "0 0 28px", lineHeight: "1.6" }}>
        Your workspace holds all your integrations, data, and team members.
      </p>

      <div style={{ marginBottom: "18px" }}>
        <label style={styles.label}>Your full name</label>
        <input
          style={inputStyle("name")}
          placeholder="Jane Smith"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setFocused("name")}
          onBlur={() => setFocused(null)}
        />
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label style={styles.label}>Company / Brand name</label>
        <input
          style={inputStyle("company")}
          placeholder="Acme Inc."
          value={company}
          onChange={e => setCompany(e.target.value)}
          onFocus={() => setFocused("company")}
          onBlur={() => setFocused(null)}
        />
        <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "6px" }}>
          This becomes your workspace name — you can change it later
        </p>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <label style={styles.label}>I'm primarily a…</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {roles.map((r, i) => {
            const selected = role === r;
            return (
              <button
                key={i}
                onClick={() => setRole(r)}
                style={{
                  border: `1px solid ${selected ? T.purple : T.border}`,
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: selected ? T.purpleDark : T.textSecondary,
                  background: selected ? T.purpleLight : T.card,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 150ms, background 150ms",
                }}
                onMouseEnter={e => {
                  if (!selected) {
                    e.target.style.borderColor = T.purple;
                    e.target.style.background = T.purpleLight;
                    e.target.style.color = T.purpleDark;
                  }
                }}
                onMouseLeave={e => {
                  if (!selected) {
                    e.target.style.borderColor = T.border;
                    e.target.style.background = T.card;
                    e.target.style.color = T.textSecondary;
                  }
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: "8px", marginBottom: "14px",
          background: T.redLight, border: `1px solid ${T.red}20`, color: T.red, fontSize: "13px",
        }}>
          {error}
        </div>
      )}

      <button
        style={{
          ...styles.btnPrimary,
          opacity: name && company && !saving ? 1 : 0.5,
          cursor: name && company && !saving ? "pointer" : "not-allowed",
        }}
        onClick={name && company && !saving ? () => onNext({ name, company, role }) : undefined}
        onMouseEnter={e => { if (name && company && !saving) e.target.style.background = T.purpleDark; }}
        onMouseLeave={e => e.target.style.background = T.purple}
      >
        {saving ? "Creating workspace…" : "Create workspace →"}
      </button>
    </div>
  );
}

// ─── STEP 3: Connect Integrations ─────────────────────────────────────────────
function StepConnect({ onNext, onConnect, connectingProvider }) {
  const integrations = [
    {
      id: "gsc",
      name: "Google Search Console",
      desc: "Keywords, rankings, clicks",
      icon: "🔍",
      iconBg: "#34A853",
      badge: "Start here",
      badgeColor: T.green,
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      desc: "Sessions, traffic sources, conversions",
      icon: "📈",
      iconBg: "#E37400",
      badge: "Most popular",
      badgeColor: T.amber,
    },
    {
      id: "meta_ads",
      name: "Meta Ads",
      desc: "Facebook & Instagram ad performance",
      icon: "📱",
      iconBg: "#1877F2",
      badge: null,
    },
    {
      id: "google_ads",
      name: "Google Ads",
      desc: "Campaigns, spend, ROAS",
      icon: "💰",
      iconBg: "#4285F4",
      badge: null,
    },
  ];

  return (
    <div style={styles.card}>
      <Logo />
      <ProgressBar step={2} total={4} />

      <span style={styles.stepBadge}>Step 2 of 4</span>
      <h1 style={{ ...styles.h1, marginTop: "14px" }}>Connect your data sources</h1>
      <p style={{ fontSize: "14px", color: T.textSecondary, margin: "0 0 24px", lineHeight: "1.6" }}>
        Connect at least one to get started. OAuth only — we never store your password.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {integrations.map((item) => {
          const isConnecting = connectingProvider === item.id;
          return (
            <div
              key={item.id}
              onClick={() => !isConnecting && onConnect(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                cursor: isConnecting ? "wait" : "pointer",
                background: T.card,
                transition: "all 150ms",
                userSelect: "none",
                opacity: isConnecting ? 0.7 : 1,
              }}
              onMouseEnter={e => {
                if (!isConnecting) e.currentTarget.style.borderColor = T.purple;
              }}
              onMouseLeave={e => {
                if (!isConnecting) e.currentTarget.style.borderColor = T.border;
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: item.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: T.textPrimary }}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        color: item.badgeColor,
                        background: item.badgeColor === T.green ? T.greenLight : T.amberLight,
                        padding: "2px 7px",
                        borderRadius: "10px",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px" }}>
                  {isConnecting ? "Redirecting to OAuth…" : item.desc}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: T.purple,
                  flexShrink: 0,
                }}
              >
                {isConnecting ? "…" : "Connect →"}
              </div>
            </div>
          );
        })}
      </div>

      <button
        style={{ ...styles.btnSecondary, width: "100%", marginTop: "10px" }}
        onClick={onNext}
        onMouseEnter={e => (e.target.style.borderColor = T.purple)}
        onMouseLeave={e => (e.target.style.borderColor = T.border)}
      >
        Skip for now — connect later in Settings
      </button>
    </div>
  );
}

// ─── STEP 4: Syncing / Loading ─────────────────────────────────────────────────
function StepSyncing({ onNext }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Setting up your workspace...",
    "Configuring your dashboard...",
    "Preparing AI analysis...",
    "Almost there...",
    "Generating your first insights...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onNext, 600);
          return 100;
        }
        return p + 2;
      });
    }, 60);

    const stepInterval = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div style={{ ...styles.card, textAlign: "center" }}>
      <Logo />

      {/* Animated spinner */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: T.purpleLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 28px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: "50%",
            border: `3px solid ${T.border}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: "50%",
            border: `3px solid transparent`,
            borderTopColor: T.purple,
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontSize: "28px", position: "relative" }}>⚡</span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <h1 style={{ ...styles.h1, textAlign: "center", fontSize: "22px", marginBottom: "8px" }}>
        Setting up your intelligence layer
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: T.textMuted,
          marginBottom: "28px",
          minHeight: "22px",
          transition: "opacity 300ms",
        }}
      >
        {steps[currentStep]}
      </p>

      {/* Progress bar */}
      <div
        style={{
          background: T.purpleLight,
          borderRadius: "10px",
          height: "8px",
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "10px",
            background: T.purple,
            width: `${progress}%`,
            transition: "width 120ms linear",
          }}
        />
      </div>
      <p style={{ fontSize: "12px", color: T.textMuted }}>{progress}%</p>

      {/* Checklist */}
      <div
        style={{
          marginTop: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          textAlign: "left",
        }}
      >
        {[
          { label: "Workspace created", done: true },
          { label: "Dashboard configured", done: progress > 30 },
          { label: "AI engine initialized", done: progress > 60 },
          { label: "Ready to go", done: progress > 90 },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: item.done ? 1 : 0.4,
              transition: "opacity 400ms",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: item.done ? T.green : T.border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 400ms",
              }}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              style={{
                fontSize: "13px",
                color: item.done ? T.textPrimary : T.textMuted,
                fontWeight: item.done ? "500" : "400",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 5: Ready / Dashboard Preview ───────────────────────────────────────
function StepReady({ onFinish, userName }) {
  return (
    <div style={styles.card}>
      <Logo />

      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            background: T.greenLight,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            margin: "0 auto 20px",
          }}
        >
          🎉
        </div>
        <h1 style={{ ...styles.h1, textAlign: "center" }}>
          You're all set{userName ? `, ${userName.split(" ")[0]}` : ""}!
        </h1>
        <p style={{
          fontSize: "15px",
          color: T.textSecondary,
          lineHeight: "1.65",
          margin: "8px 0 0",
        }}>
          Your marketing intelligence platform is ready.
          Head to your dashboard to start exploring.
        </p>
      </div>

      {/* Quick actions */}
      <div
        style={{
          background: T.page,
          border: `1px solid ${T.border}`,
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>
          Suggested next steps
        </div>
        {[
          { icon: "🔗", label: "Connect your data sources", tag: "Settings" },
          { icon: "🕵️", label: "Add a competitor to track", tag: "Ad Spy" },
          { icon: "🤖", label: "Chat with Lumi AI", tag: "AI insights" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              border: `1px solid ${T.border}`,
              borderRadius: "10px",
              background: T.card,
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: "13px", fontWeight: "500", color: T.textPrimary }}>
              {item.label}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: T.purpleDark,
                background: T.purpleLight,
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              {item.tag}
            </span>
          </div>
        ))}
      </div>

      <button
        style={styles.btnPrimary}
        onClick={onFinish}
        onMouseEnter={e => (e.target.style.background = T.purpleDark)}
        onMouseLeave={e => (e.target.style.background = T.purple)}
      >
        Go to dashboard →
      </button>
    </div>
  );
}

// ─── Main Onboarding Orchestrator ─────────────────────────────────────────────
export default function LumnixOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState("");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wsError, setWsError] = useState("");
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Auth check on mount ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) {
        router.replace("/auth/signin?redirect=/onboarding");
        return;
      }
      setSession(s);
      setUserName(s.user?.user_metadata?.full_name || "");

      // Check if user already completed onboarding — redirect to dashboard
      if (s.user?.user_metadata?.onboarding_completed) {
        router.replace("/dashboard");
        return;
      }

      // For users who existed before onboarding_completed flag was added:
      // check if they already have a workspace. If so, mark onboarding done and redirect.
      try {
        const res = await fetch("/api/workspace", {
          headers: { Authorization: `Bearer ${s.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const ws = data.workspace;
          if (ws?.id) {
            // User already has a workspace — check if it looks set up
            // (has a custom name, not the auto-generated default)
            const isDefault = ws.name?.endsWith("'s Workspace");
            if (!isDefault) {
              // Existing user with a configured workspace — skip onboarding
              await supabase.auth.updateUser({ data: { onboarding_completed: true } });
              router.replace("/dashboard");
              return;
            }
            setWorkspaceId(ws.id);
          }
        }
      } catch {}

      setAuthChecked(true);
    });
  }, [router]);

  // ── Handle workspace step submit ──
  async function handleWorkspaceSubmit({ name, company, role }) {
    if (!session) return;
    setSaving(true);
    setWsError("");

    try {
      // Update user metadata (full_name + role)
      await supabase.auth.updateUser({
        data: { full_name: name, user_role: role },
      });
      setUserName(name);

      // Ensure workspace exists, then update its name
      let wsId = workspaceId;
      if (!wsId) {
        try {
          const res = await fetch("/api/workspace", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            wsId = data.workspace?.id;
            if (wsId) setWorkspaceId(wsId);
          }
        } catch {}
      }

      if (wsId) {
        // Update workspace name to company name
        await fetch("/api/workspace", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: company }),
        });
      }

      setStep(2);
    } catch (err) {
      setWsError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Handle integration connect ──
  async function handleConnect(providerId) {
    if (!session || !workspaceId) return;
    setConnectingProvider(providerId);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider: providerId, workspace_id: workspaceId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Store onboarding state so we resume after OAuth redirect
        try { localStorage.setItem("lumnix-onboarding-step", "2"); } catch {}
        window.location.href = data.url;
        return;
      }
    } catch {}
    setConnectingProvider(null);
  }

  // ── Resume after OAuth redirect ──
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem("lumnix-onboarding-step");
      if (savedStep) {
        setStep(parseInt(savedStep, 10));
        localStorage.removeItem("lumnix-onboarding-step");
      }
    } catch {}
  }, []);

  // ── Handle onboarding complete ──
  async function handleFinish() {
    // Mark onboarding as completed in user metadata
    try {
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
    } catch {}
    router.push("/dashboard");
  }

  const next = () => setStep((s) => Math.min(s + 1, 4));

  // ── Loading state ──
  if (!authChecked) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.page,
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ ...styles.logoMark, opacity: 0.6 }}>L</div>
          <span style={{ fontSize: "13px", color: T.textMuted }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: T.page,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(8,145,178,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {step === 0 && <StepWelcome onNext={next} userName={userName} />}
        {step === 1 && (
          <StepWorkspace
            onNext={handleWorkspaceSubmit}
            userName={userName}
            saving={saving}
            error={wsError}
          />
        )}
        {step === 2 && (
          <StepConnect
            onNext={next}
            onConnect={handleConnect}
            connectingProvider={connectingProvider}
          />
        )}
        {step === 3 && <StepSyncing onNext={next} />}
        {step === 4 && (
          <StepReady onFinish={handleFinish} userName={userName} />
        )}
      </div>

      {/* Step indicator dots */}
      {step < 4 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "28px",
            position: "relative",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: i === step ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === step ? T.purple : i < step ? T.purpleMid : T.border,
                transition: "width 300ms ease, background 300ms",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
