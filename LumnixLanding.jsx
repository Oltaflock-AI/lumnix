import { useState, useEffect, useRef } from "react";

// ─── Fonts & CSS ──────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=DM+Sans:wght@300;400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #07051A; }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotateX(0deg); }
      50% { transform: translateY(-8px) rotateX(1deg); }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }
    @keyframes count-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes draw-line {
      from { stroke-dashoffset: 300; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-1%, -1%); }
      20% { transform: translate(1%, 1%); }
      30% { transform: translate(-1%, 0); }
      40% { transform: translate(0, 1%); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes orb-pulse {
      0%, 100% { transform: scale(1); opacity: 0.15; }
      50% { transform: scale(1.1); opacity: 0.22; }
    }

    .animate-float { animation: float 4s ease-in-out infinite; }
    .animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
    .fade-up-1 { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
    .fade-up-2 { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
    .fade-up-3 { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
    .fade-up-4 { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s both; }
    .fade-up-5 { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.7s both; }

    .shimmer-text {
      background: linear-gradient(90deg, #fff 0%, #A78BFA 40%, #fff 60%, #A78BFA 80%, #fff 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }

    .card-glass {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .card-glass:hover {
      border-color: rgba(124,58,237,0.4);
    }

    .btn-primary-glow {
      background: #7C3AED;
      box-shadow: 0 0 20px rgba(124,58,237,0.3);
      transition: all 200ms ease;
    }
    .btn-primary-glow:hover {
      background: #6D28D9;
      box-shadow: 0 0 40px rgba(124,58,237,0.5);
      transform: translateY(-1px);
    }

    .section-light { background: #F7F6FE; }
    .text-accent { color: #A78BFA; }
    .text-green { color: #34D399; }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.2);
    }
    .feature-card { transition: all 250ms ease; }
  `}</style>
);

// ─── 3D Card Component ────────────────────────────────────────────────────────
function Card3D({ children, className = "", style = {} }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, scale: 1 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setTilt({
      x: ((y - cy) / cy) * -10,
      y: ((x - cx) / cx) * 10,
      scale: 1.02,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.scale})`,
        transition: "transform 200ms ease",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ target, prefix = "", suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        background: scrolled ? "rgba(7,5,26,0.92)" : "rgba(7,5,26,0.4)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "transparent"}`,
        transition: "all 300ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            background: "#5B21B6",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: "#fff",
          }}
        >
          L
        </div>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          Lumnix
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Features", "Pricing", "Changelog"].map((link) => (
          <span
            key={link}
            style={{
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#fff")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.6)")}
          >
            {link}
          </span>
        ))}
        <button
          className="btn-primary-glow"
          style={{
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}
        >
          Get early access
        </button>
      </div>
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "100px 48px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "15%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
          animation: "orb-pulse 6s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8,145,178,0.12) 0%, transparent 70%)",
          animation: "orb-pulse 8s ease-in-out infinite 2s",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: 80,
          alignItems: "center",
        }}
      >
        {/* Left: Copy */}
        <div>
          <div className="fade-up-1">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: "#A78BFA",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 24,
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.2)",
                padding: "6px 14px",
                borderRadius: 20,
              }}
            >
              <span
                className="animate-pulse-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#34D399",
                  display: "inline-block",
                }}
              />
              Now in early access — Indian D2C & agencies
            </span>
          </div>

          <div className="fade-up-2">
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "clamp(52px, 6vw, 80px)",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#fff",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: 24,
              }}
            >
              Your competitors
              <br />
              know something
              <br />
              <span className="shimmer-text">you don't.</span>
            </h1>
          </div>

          <div className="fade-up-3">
            <p
              style={{
                fontSize: 20,
                fontFamily: "'DM Sans', sans-serif",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.65,
                marginBottom: 16,
                maxWidth: 520,
              }}
            >
              While you're switching between 5 dashboards, they're making decisions in one.
            </p>
            <p
              style={{
                fontSize: 16,
                fontFamily: "'DM Sans', sans-serif",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 480,
              }}
            >
              The average marketing team spends <strong style={{ color: "rgba(255,255,255,0.7)" }}>14 hours a week</strong> copy-pasting data between tools that were never designed to talk to each other. Lumnix ends that.
            </p>
          </div>

          <div className="fade-up-4" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              className="btn-primary-glow"
              style={{
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "16px 32px",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Get early access — it's free
              <span style={{ fontSize: 18 }}>→</span>
            </button>
            <button
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "15px 24px",
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                color: "rgba(255,255,255,0.65)",
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
            >
              See how it works ↓
            </button>
          </div>

          <div className="fade-up-5" style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
            <div style={{ display: "flex" }}>
              {["KH", "AM", "VS", "PR", "RK"].map((init, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `hsl(${260 + i * 15}, 70%, ${40 + i * 5}%)`,
                    border: "2px solid #07051A",
                    marginLeft: i > 0 ? -8 : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {init}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif" }}>
              <strong style={{ color: "rgba(255,255,255,0.7)" }}>200+ brands</strong> in early access
            </p>
          </div>
        </div>

        {/* Right: 3D Intel Card */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Card3D className="animate-float">
            <div
              style={{
                width: 380,
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(124,58,237,0.35)",
                borderRadius: 20,
                padding: 28,
                boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
                  COMPETITOR INTEL
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#34D399", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
                  LIVE
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", marginBottom: 4 }}>
                  Mamaearth
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Running 18 winning ads right now
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {[
                  { icon: "🏆", val: "213 days", label: "Longest running" },
                  { icon: "👁", val: "4.2M", label: "Est. reach" },
                  { icon: "📈", val: "+12", label: "New this week" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 10,
                      padding: "10px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* AI insight */}
              <div
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  borderLeft: "3px solid #7C3AED",
                  borderRadius: "0 10px 10px 0",
                  padding: "12px 14px",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>
                  LUMI'S ANALYSIS
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  Hook: before/after + dermatologist endorsement. Pain point: hair fall anxiety. Offer framing: 90-day guarantee.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ color: "#A78BFA", cursor: "pointer", fontWeight: 500 }}>5 content angles → View brief</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>Updated 2h ago</span>
              </div>
            </div>
          </Card3D>
        </div>
      </div>
    </section>
  );
}

// ─── Pain Section ─────────────────────────────────────────────────────────────
function PainSection() {
  return (
    <section style={{ padding: "100px 48px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(40px, 5vw, 64px)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          5 tools. 5 logins.
          <br />
          <span style={{ color: "rgba(255,255,255,0.3)" }}>0 of them talking to each other.</span>
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          It's not that you're bad at marketing. It's that your tools were built to be used separately — and that's costing you.
        </p>
      </div>

      {/* Broken tools display */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 64 }}>
        {[
          { color: "#34A853", title: "Google Search Console", insight: "knows your keywords rank #1", blind: "doesn't know if you're running ads for them" },
          { color: "#E37400", title: "Google Analytics 4", insight: "knows your sessions are down 25%", blind: "doesn't know why — or what competitors did" },
          { color: "#1877F2", title: "Meta Ads Manager", insight: "knows you spent ₹8,159 this month", blind: "doesn't know if competitors are stealing your audience" },
        ].map((tool, i) => (
          <div
            key={i}
            className="card-glass feature-card"
            style={{
              borderRadius: 16,
              padding: 24,
              transform: `rotate(${[-1.5, 0.5, -0.8][i]}deg)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: tool.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {tool.title[0]}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{tool.title}</span>
            </div>
            <p style={{ fontSize: 13, color: "#34D399", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, lineHeight: 1.5 }}>
              ✓ {tool.insight}
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              ✗ {tool.blind}
            </p>
          </div>
        ))}
      </div>

      {/* The body copy */}
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        {[
          "You already know organic search is your best channel. But your ad tool doesn't.",
          "You already know which landing pages convert. But your SEO tool doesn't.",
          "And none of them know what your competitors are doing.",
        ].map((line, i) => (
          <p
            key={i}
            style={{
              fontSize: i === 2 ? 20 : 17,
              fontFamily: "'DM Sans', sans-serif",
              color: i === 2 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)",
              lineHeight: 1.7,
              marginBottom: i === 2 ? 0 : 12,
              fontWeight: i === 2 ? 500 : 400,
            }}
          >
            {line}
          </p>
        ))}
        <p style={{ fontSize: 22, fontWeight: 700, color: "#A78BFA", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 20, letterSpacing: "-0.01em" }}>
          Until now.
        </p>
      </div>
    </section>
  );
}

// ─── Proof Numbers ────────────────────────────────────────────────────────────
function ProofNumbers() {
  const stats = [
    { prefix: "₹", val: 24000000, suffix: "", label: "in ad spend analysed", note: "Synced in first 30 days of beta" },
    { prefix: "", val: 14, suffix: " hrs", label: "saved weekly per team", note: "Reclaimed from manual data work" },
    { prefix: "", val: 165, suffix: "x", label: "peak ROAS recorded", note: "Real Google Ads campaign tracked" },
    { prefix: "", val: 47, suffix: "", label: "competitor ads uncovered", note: "For one brand in week one" },
  ];

  const display = ["₹2.4 Cr", "14 hrs", "165x", "47"];

  return (
    <section
      style={{
        padding: "100px 48px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.05), transparent)",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "clamp(48px, 5vw, 72px)",
                fontWeight: 900,
                color: "#34D399",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 10,
              }}
            >
              {display[i]}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
              {s.note}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Competitor Spy Feature ───────────────────────────────────────────────────
function CompetitorSpySection() {
  return (
    <section style={{ padding: "120px 48px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
            COMPETITOR AD SPY
          </div>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(36px, 4vw, 56px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Your competitors have been testing ads for 6 months.
            <br />
            <span style={{ color: "#A78BFA" }}>You're about to see all of them.</span>
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, marginBottom: 32 }}>
            Meta's Ad Library is public. But nobody has time to manually check 500 ads per competitor and figure out which ones are winning.
            <br /><br />
            Any ad running <strong style={{ color: "rgba(255,255,255,0.8)" }}>90+ days = Meta kept serving it = it works.</strong> Our AI tells you exactly why — and what to make next.
          </p>
          {[
            "Add competitor by name, website, or Facebook URL",
            "90-day longevity = proven winner signal",
            "AI brief: exactly what hooks, pain points, and offers they use",
          ].map((point, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>

        {/* 3D Card stack */}
        <div style={{ position: "relative", height: 360 }}>
          <Card3D style={{ position: "absolute", top: 0, left: 20, zIndex: 2 }}>
            <div
              style={{
                width: 340,
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ height: 140, background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(8,145,178,0.1) 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 12,
                    background: "#5B21B6",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 20,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.06em",
                  }}
                >
                  🏆 TOP PERFORMER
                </div>
                <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.6)", fontSize: 11, padding: "3px 8px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif" }}>
                  213 days
                </div>
                <svg width="48" height="48" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 5 }}>Onion Hair Oil That Actually Works</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, lineHeight: 1.4 }}>Dermatologically tested. Over 1 million bottles sold...</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, background: "rgba(124,58,237,0.15)", color: "#A78BFA", padding: "3px 8px", borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Shop Now</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>↗ View ad</span>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Background card */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 0,
              width: 340,
              height: 280,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              transform: "rotate(-3deg)",
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Lumi Chat Section ────────────────────────────────────────────────────────
function LumiSection() {
  const [activeQ, setActiveQ] = useState(0);
  const convos = [
    {
      q: "Why did my traffic drop last week?",
      a: "Your top GSC keyword 'promunch' dropped from position 1.2 to position 3.8 between Apr 8–10. This coincides with a new Mamaearth campaign targeting the same search intent. Recommend: strengthen the page's internal linking and update the meta title to match the query more directly.",
    },
    {
      q: "What should I focus on this week?",
      a: "3 quick wins on page 1 right now: 'soya mini chunks' (190 impressions, 0% CTR), 'soya munch' (8 impressions, 0% CTR), 'peri peri soya' (1 impression, 1 click). Fixing meta titles on these 3 pages could add ~20 organic clicks/week at zero cost.",
    },
    {
      q: "Compare my organic vs paid this month",
      a: "Organic: 214 clicks, ₹0 spend, estimated ₹6,200 value at avg CPC. Paid: 18,038 clicks, ₹8,159 spend, ₹0.45 CPC. Organic CTR 26% vs paid CTR 3.87%. Your organic is significantly more efficient — consider doubling down on content for your top 10 GSC keywords.",
    },
  ];

  return (
    <section style={{ padding: "100px 48px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
            AI ASSISTANT — LUMI
          </div>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(36px, 4vw, 52px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Stop pulling reports.
            <br />
            <span style={{ color: "#A78BFA" }}>Start asking questions.</span>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, marginBottom: 32 }}>
            This isn't a chatbot that's read marketing articles. Lumi has read <em style={{ color: "rgba(255,255,255,0.7)" }}>your data</em>. It knows your top keyword, your worst campaign, your competitor's winning hook, and your biggest missed opportunity.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {convos.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveQ(i)}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  border: `1px solid ${activeQ === i ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 10,
                  background: activeQ === i ? "rgba(124,58,237,0.12)" : "transparent",
                  color: activeQ === i ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => { if (activeQ !== i) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                onMouseLeave={(e) => { if (activeQ !== i) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                "{c.q}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div
          className="card-glass"
          style={{
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7C3AED, #0891B2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Lumi</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>AI Marketing Assistant</div>
            </div>
            <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", marginLeft: "auto" }} />
          </div>

          <div style={{ padding: 20, minHeight: 280, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* User message */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  background: "#7C3AED",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "18px 18px 4px 18px",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  maxWidth: "80%",
                  lineHeight: 1.5,
                  boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                }}
              >
                "{convos[activeQ].q}"
              </div>
            </div>

            {/* AI response */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #0891B2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                L
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.85)",
                  padding: "12px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.65,
                  maxWidth: "85%",
                }}
              >
                {convos[activeQ].a}
              </div>
            </div>
          </div>

          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "9px 14px",
                fontSize: 13,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Ask Lumi anything...
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9 22,2" /></svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function PricingSection() {
  const plans = [
    { name: "Free", price: "₹0", period: "/mo", features: ["2 integrations", "30-day data retention", "2 team members", "Basic insights"], cta: "Get started free", ctaStyle: "outline" },
    { name: "Starter", price: "₹2,499", period: "/mo", features: ["4 integrations", "90-day retention", "5 team members", "AI insights", "PDF reports"], cta: "Get early access", ctaStyle: "outline" },
    { name: "Growth", price: "₹6,499", period: "/mo", features: ["All integrations", "1-year retention", "15 team members", "AI chat + insights", "White-label reports", "Competitor tracking"], cta: "Get early access", ctaStyle: "primary", popular: true },
    { name: "Agency", price: "₹16,499", period: "/mo", features: ["Unlimited everything", "Unlimited retention", "Unlimited team", "Everything in Growth", "Multi-workspace", "Priority support", "API access"], cta: "Contact us", ctaStyle: "outline" },
  ];

  return (
    <section className="section-light" style={{ padding: "120px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(36px, 4vw, 56px)",
              fontWeight: 800,
              color: "#18163A",
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Less than the cost of one bad ad.
          </h2>
          <p style={{ fontSize: 18, color: "#7C7AAA", fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: "0 auto 12px" }}>
            The tools you're replacing cost ₹75,000/mo combined.
          </p>
          <p style={{ fontSize: 16, color: "#7C3AED", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            Lumnix starts at ₹2,499.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 48 }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                background: "#fff",
                border: plan.popular ? "2px solid #7C3AED" : "1px solid #E4E2F4",
                borderRadius: 18,
                padding: "24px 22px",
                position: "relative",
                boxShadow: plan.popular ? "0 8px 40px rgba(124,58,237,0.15)" : "0 2px 12px rgba(91,33,182,0.06)",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#7C3AED",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  Most Popular
                </div>
              )}
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#18163A", marginBottom: 6 }}>
                {plan.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 800, color: "#18163A", letterSpacing: "-0.02em" }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: "#7C7AAA", fontFamily: "'DM Sans', sans-serif" }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="rgba(5,150,105,0.15)" /><path d="M4 7l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 13, color: "#4A4770", fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  background: plan.ctaStyle === "primary" ? "#7C3AED" : "transparent",
                  color: plan.ctaStyle === "primary" ? "#fff" : "#7C3AED",
                  border: plan.ctaStyle === "primary" ? "none" : "1px solid #7C3AED",
                  transition: "all 150ms",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            maxWidth: 560,
            margin: "40px auto 0",
            textAlign: "center",
            padding: "20px 24px",
            background: "#EDE9FF",
            border: "1px solid #DDD8FF",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 14, color: "#5B21B6", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            "I replaced Ahrefs (₹8,000/mo), Atria ($129/mo ≈ ₹10,700), and 3 manual reporting hours per week with Lumnix."
          </p>
          <p style={{ fontSize: 12, color: "#9B97C2", marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            — Early access user, D2C snack brand
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section
      style={{
        padding: "120px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(40px, 5vw, 68px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Marketing that guesses is expensive.
          <br />
          <span className="shimmer-text">Marketing that knows is unstoppable.</span>
        </h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", marginBottom: 40, lineHeight: 1.65 }}>
          Join 200+ brands and agencies who stopped exporting CSVs and started making decisions.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <button
            className="btn-primary-glow"
            style={{
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "18px 40px",
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
            }}
          >
            Get early access — it's free
          </button>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 16, fontFamily: "'DM Sans', sans-serif" }}>
          No credit card required · Takes 3 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function LumnixLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ background: "#07051A", minHeight: "100vh" }}>
      <GlobalStyles />
      <Navbar scrolled={scrolled} />
      <Hero />
      <PainSection />
      <ProofNumbers />
      <CompetitorSpySection />
      <LumiSection />
      <PricingSection />
      <FinalCTA />
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "32px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#5B21B6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, color: "#fff" }}>L</div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Lumnix by Oltaflock AI</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif" }}>
          © 2026 Oltaflock AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
