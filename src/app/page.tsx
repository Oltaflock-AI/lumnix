'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, CSSProperties } from 'react';
import {
  ArrowRight, Check, Zap, Brain, Target, FileText, ChevronRight, ChevronDown,
  BarChart3, Shield, Bell, Eye, Search, TrendingUp, TrendingDown,
  Users, Globe, Mail, Linkedin, Twitter, Play, Star, AlertTriangle,
  LayoutDashboard, Sparkles, MonitorSmartphone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const NAV_LINKS = ['Features', 'Pricing', 'Testimonials'];

const LOGOS = [
  'Meridian Digital', 'Apex Growth', 'NovaCraft', 'Stellar Media',
  'Prism Agency', 'BlueShift', 'Catalyst Co', 'Zenith Labs',
];

const SOCIAL_LINKS = {
  twitter: 'https://x.com/oltaflockai',
  linkedin: 'https://www.linkedin.com/company/oltaflock-ai',
  email: 'mailto:khush@oltaflock.ai',
};

const FEATURES = [
  { icon: Brain, title: 'AI Anomaly Detection', desc: 'Auto-detects traffic drops, ranking changes, and CTR anomalies before your client calls angry. Daily scans, instant Slack alerts.' },
  { icon: Eye, title: 'Competitor Intelligence', desc: 'See exactly which keywords your competitors rank for, their estimated traffic, and domain authority shifts — updated weekly.' },
  { icon: Search, title: 'Ad Spy', desc: 'Meta Ad Library integration shows you competitor creatives, spend estimates, and launch dates. Know their playbook before they run it.' },
  { icon: FileText, title: 'Unified Reporting', desc: 'Branded PDF reports auto-generated and delivered overnight. Combine GA4, GSC, Ads data in one beautiful document.' },
  { icon: BarChart3, title: 'SEO Dashboard', desc: 'Rankings, clicks, impressions, CTR — all in one view. Filter by page, query, device, country. No more GSC tab-switching.' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Configurable thresholds for traffic, rankings, spend, and conversions. Get notified via email or Slack the moment something moves.' },
];

const SPOTLIGHTS = [
  {
    badge: 'AI-Powered',
    title: 'Anomaly detection that actually works',
    desc: 'Our ML models learn your traffic patterns and flag deviations automatically. A 15% Tuesday dip that\'s normal for your site won\'t trigger an alert — but a 15% dip on a Thursday will. Context-aware intelligence, not dumb thresholds.',
    bullets: ['Pattern learning per property', 'Severity scoring (info → critical)', 'One-click root cause analysis', 'Slack & email delivery'],
  },
  {
    badge: 'Competitor Intel',
    title: 'Know what your competitors know',
    desc: 'Track up to 50 competitor domains. See their top-performing keywords, estimated organic traffic, new pages indexed, and backlink velocity. Get weekly digests comparing your trajectory against theirs.',
    bullets: ['Keyword gap analysis', 'Traffic trend comparison', 'New content detection', 'Backlink monitoring'],
  },
  {
    badge: 'Automated Reports',
    title: 'Reports that write themselves',
    desc: 'Connect your data sources, pick a template, set a schedule. Lumnix generates branded PDF reports with AI-written summaries, charts, and recommendations — delivered to your inbox or your client\'s.',
    bullets: ['White-label branding', 'AI executive summary', 'Scheduled delivery', 'Custom metrics selection'],
  },
];

const TESTIMONIALS = [
  { name: 'Sarah Mitchell', role: 'Head of Growth', company: 'Meridian Digital', color: '#6366F1', quote: 'We caught a 40% traffic drop on our biggest client\'s site before they even noticed. Lumnix paid for itself that week.' },
  { name: 'James Chen', role: 'Marketing Director', company: 'Apex Growth', color: '#10B981', quote: 'Replaced SEMrush, Google Analytics, and our manual reporting spreadsheet. Saving my team about 12 hours a week.' },
  { name: 'Priya Sharma', role: 'Founder', company: 'NovaCraft', color: '#F59E0B', quote: 'The competitor ad spy alone is worth the subscription. We saw exactly when our competitor doubled their Meta spend and adjusted our strategy same-day.' },
  { name: 'Marcus Thompson', role: 'VP Marketing', company: 'Stellar Media', color: '#EF4444', quote: 'Client reporting used to take us all of Monday. Now it auto-generates overnight. Our clients think we hired more people.' },
  { name: 'Elena Rodriguez', role: 'Growth Lead', company: 'BlueShift', color: '#8B5CF6', quote: 'The AI anomaly alerts caught a tracking issue on our site that was silently killing our conversion data for 2 weeks. No other tool flagged it.' },
  { name: 'David Kim', role: 'CEO', company: 'Catalyst Co', color: '#06B6D4', quote: 'I used to check 4 different dashboards every morning. Now I check one. It sounds simple but it changed how I run the company.' },
];

const METRICS = [
  { value: '500+', label: 'Waitlist signups' },
  { value: '6→1', label: 'Tools replaced' },
  { value: '12 hrs', label: 'Saved per team per week' },
  { value: '5', label: 'Data sources unified' },
];

const PRICING = [
  {
    name: 'Starter', price: 29, desc: 'For solo marketers and freelancers',
    features: ['GSC + GA4 integration', '3 competitor tracking', 'Email alerts', 'PDF reports (5/mo)', '30-day data history', 'Community support'],
    cta: 'Join waitlist',
  },
  {
    name: 'Growth', price: 79, desc: 'For growing teams that need an edge', badge: 'Most Popular', highlight: true,
    features: ['Everything in Starter', 'Google Ads + Meta Ads', 'Slack alerts', 'AI anomaly detection', '10 competitor tracking', 'Unlimited reports', '12-month data history', 'Priority support'],
    cta: 'Join waitlist',
  },
  {
    name: 'Agency', price: 199, desc: 'For agencies managing multiple clients',
    features: ['Everything in Growth', 'White-label reports', 'Team invites & roles', 'Unlimited competitors', 'Custom branding per client', 'Ad spy (Meta Ad Library)', 'API access', 'Dedicated account manager'],
    cta: 'Contact sales',
  },
];

const FAQS = [
  { q: 'How does early access work?', a: 'Join the waitlist and we\'ll invite you in waves. Early access users get the Growth plan free for 30 days — no credit card required. You\'ll also get direct access to our team for feedback and feature requests.' },
  { q: 'Which data sources does Lumnix connect to?', a: 'Currently: Google Analytics 4, Google Search Console, Google Ads, and Meta Ads (Facebook & Instagram). We\'re adding LinkedIn Ads and TikTok Ads in Q3 2026.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We use OAuth tokens (never passwords), and our infrastructure runs on SOC 2-compliant cloud providers. We never share or sell your data.' },
  { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no cancellation fees. You can downgrade or cancel from your dashboard in two clicks. Your data is retained for 30 days after cancellation in case you change your mind.' },
  { q: 'How does competitor tracking work?', a: 'Enter a competitor\'s domain and we pull their estimated organic keywords, traffic, top pages, and backlink profile. Data refreshes weekly. The Ad Spy feature also lets you see their active Meta/Facebook ad creatives.' },
  { q: 'Do you offer white-label reports?', a: 'Yes, on the Agency plan. You can upload your agency\'s logo, set brand colors, and customize the report header. Your clients will never see the Lumnix brand — it looks like your own proprietary tool.' },
];

const FOOTER_LINKS = {
  Product: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Resources: ['Documentation', 'API Reference', 'Status', 'Community'],
  Legal: ['Privacy', 'Terms', 'Security', 'GDPR'],
};

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function InitialsAvatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* Mini dashboard mockup components */
function MockStatCard({ label, value, change, positive, accent }: { label: string; value: string; change: string; positive: boolean; accent: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12, color: positive ? c.success : c.danger, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {change}
      </div>
    </div>
  );
}

function MockChartSVG({ accent }: { accent: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 140" preserveAspectRatio="none">
      <defs>
        <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,100 C30,95 60,85 100,75 C140,65 170,80 210,60 C250,40 280,55 320,35 C360,15 400,30 440,20 C480,10 520,25 560,15 L600,10 L600,140 L0,140 Z" fill="url(#heroChartGrad)" />
      <path d="M0,100 C30,95 60,85 100,75 C140,65 170,80 210,60 C250,40 280,55 320,35 C360,15 400,30 440,20 C480,10 520,25 560,15 L600,10" fill="none" stroke={accent} strokeWidth="2.5" />
      <circle cx="440" cy="20" r="4" fill={accent} />
      <circle cx="440" cy="20" r="8" fill={accent} fillOpacity="0.2" />
    </svg>
  );
}

function MockAlertRow({ severity, msg, time }: { severity: 'critical' | 'warning' | 'info'; msg: string; time: string }) {
  const { c } = useTheme();
  const colors = { critical: c.danger, warning: c.warning, info: c.accent };
  const bgColors = { critical: c.dangerSubtle, warning: c.warningSubtle, info: c.accentSubtle };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: c.bgCardHover, marginBottom: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[severity], flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: c.text, flex: 1 }}>{msg}</span>
      <span style={{
        fontSize: 10, color: colors[severity], backgroundColor: bgColors[severity],
        padding: '2px 8px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase', flexShrink: 0,
      }}>{severity}</span>
      <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0 }}>{time}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */

function LandingInner() {
  const { c } = useTheme();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  // Waitlist modal state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [wlName, setWlName] = useState('');
  const [wlEmail, setWlEmail] = useState('');
  const [wlCompany, setWlCompany] = useState('');
  const [wlRole, setWlRole] = useState('');
  const [wlTeamSize, setWlTeamSize] = useState('');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlSuccess, setWlSuccess] = useState(false);
  const [wlError, setWlError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const openWaitlist = () => {
    setWlSuccess(false);
    setWlError('');
    setShowWaitlist(true);
  };

  const submitWaitlist = async () => {
    if (!wlName.trim() || !wlEmail.trim()) { setWlError('Name and email are required'); return; }
    setWlSubmitting(true);
    setWlError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wlName.trim(), email: wlEmail.trim(), company: wlCompany.trim(), role: wlRole.trim(), team_size: wlTeamSize }),
      });
      const data = await res.json();
      if (!res.ok) { setWlError(data.error || 'Something went wrong'); }
      else { setWlSuccess(true); }
    } catch { setWlError('Network error — please try again'); }
    setWlSubmitting(false);
  };

  // smooth scroll helper
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileNav(false);
  };

  const sectionMax: CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.bgPage, color: c.text, fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      {/* Background dot pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(${c.borderStrong} 1px, transparent 1px)`,
        backgroundSize: '32px 32px', opacity: 0.35,
      }} />

      {/* ──────────────────────── NAVBAR ──────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 40px', height: 64,
        backgroundColor: scrolled ? 'rgba(10,10,10,0.75)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? `1px solid ${c.border}` : '1px solid transparent',
        transition: 'all 0.35s ease',
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: c.text, position: 'relative', zIndex: 201 }}>
          <span style={{ color: c.accent }}>L</span>umnix
        </span>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(l => (
            <a key={l} onClick={() => scrollTo(l.toLowerCase())} style={{
              padding: '8px 16px', color: c.textSecondary, fontSize: 14, textDecoration: 'none',
              fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s', borderRadius: 6,
            }}
              onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.backgroundColor = c.bgCardHover; }}
              onMouseLeave={e => { e.currentTarget.style.color = c.textSecondary; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >{l}</a>
          ))}
          <div style={{ width: 1, height: 20, backgroundColor: c.border, margin: '0 8px' }} />
          <button
            onClick={() => router.push('/auth/signin')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: c.text, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >Sign in</button>
          <button
            onClick={() => openWaitlist()}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              backgroundColor: c.accent, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = c.accentHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = c.accent; e.currentTarget.style.transform = 'translateY(0)'; }}
          >Join waitlist</button>
        </div>
      </nav>

      {/* ──────────────────────── HERO ──────────────────────── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 40px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 500,
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.15) 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: -1,
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 18px', borderRadius: 100,
          border: '1px solid rgba(99,102,241,0.25)',
          backgroundColor: c.accentSubtle, marginBottom: 36,
        }}>
          <Sparkles size={13} color={c.accent} />
          <span style={{ fontSize: 13, color: c.accent, fontWeight: 600 }}>AI-Powered Marketing Intelligence</span>
        </div>

        <h1 style={{
          fontSize: 72, fontWeight: 800, lineHeight: 1.04, letterSpacing: '-3px',
          marginBottom: 28, fontFamily: 'var(--font-display)',
          background: `linear-gradient(180deg, ${c.text} 30%, ${c.textSecondary} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Six tools. One dashboard.<br />Zero wasted hours.
        </h1>

        <p style={{
          fontSize: 19, color: c.textSecondary, lineHeight: 1.7,
          maxWidth: 600, margin: '0 auto 44px',
        }}>
          Lumnix unifies GA4, Search Console, Google Ads, and Meta Ads into one
          AI-powered command center. Anomaly detection, competitor intelligence,
          and automated reports — so you can stop juggling tabs and start making decisions.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            onClick={() => openWaitlist()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 32px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.25s', boxShadow: `0 4px 24px rgba(99,102,241,0.3)`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.3)'; }}
          >
            Join the waitlist <ArrowRight size={18} />
          </button>

        </div>
        <p style={{ fontSize: 13, color: c.textMuted }}>Free early access &middot; No credit card &middot; Be first in line</p>

        {/* ─── Hero Dashboard Mockup ─── */}
        <div style={{
          marginTop: 64, position: 'relative', borderRadius: 16,
          border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
          padding: 20, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 120px rgba(99,102,241,0.08)',
        }}>
          {/* top glow */}
          <div style={{
            position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
            width: 700, height: 200,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Window chrome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <div style={{
              flex: 1, maxWidth: 300, margin: '0 auto', height: 28, borderRadius: 6,
              backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, color: c.textMuted }}>app.lumnix.io/dashboard</span>
            </div>
          </div>

          {/* Sidebar + main layout */}
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Mini sidebar */}
            <div style={{
              width: 48, backgroundColor: c.bgCardHover, borderRadius: 10, padding: '12px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              border: `1px solid ${c.border}`, flexShrink: 0,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutDashboard size={14} color={c.accent} />
              </div>
              {[BarChart3, Search, FileText, Bell].map((Icon, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={c.textMuted} />
                </div>
              ))}
            </div>

            {/* Main dashboard area */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Stat cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                <MockStatCard label="Sessions" value="12,847" change="+14.2%" positive accent={c.accent} />
                <MockStatCard label="Conversions" value="842" change="+8.7%" positive accent={c.accent} />
                <MockStatCard label="Avg. Position" value="4.2" change="-0.8" positive accent={c.accent} />
                <MockStatCard label="CTR" value="3.9%" change="-0.3%" positive={false} accent={c.accent} />
              </div>

              {/* Chart + alerts row */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Chart */}
                <div style={{
                  flex: 2, backgroundColor: c.bgCardHover, borderRadius: 10, padding: 16,
                  border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden', minHeight: 160,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>Organic Sessions</div>
                  <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 12 }}>Last 30 days</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 }}>
                    <MockChartSVG accent={c.accent} />
                  </div>
                </div>

                {/* Alerts panel */}
                <div style={{
                  flex: 1, backgroundColor: c.bgCardHover, borderRadius: 10, padding: 14,
                  border: `1px solid ${c.border}`, minWidth: 0,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={12} color={c.warning} /> Alerts
                  </div>
                  <MockAlertRow severity="critical" msg="Traffic drop -23% on /pricing" time="2h ago" />
                  <MockAlertRow severity="warning" msg="Position dropped for &apos;saas analytics&apos;" time="5h ago" />
                  <MockAlertRow severity="info" msg="New competitor page indexed" time="1d ago" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── LOGO BAR ──────────────────────── */}
      <section style={{ padding: '80px 24px 60px', position: 'relative', zIndex: 1 }}>
        <p style={{ textAlign: 'center', fontSize: 13, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 32 }}>
          Backed by early-access teams from
        </p>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48,
          flexWrap: 'wrap', maxWidth: 1000, margin: '0 auto', opacity: 0.4,
        }}>
          {LOGOS.map(name => (
            <span key={name} style={{
              fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: c.text,
              whiteSpace: 'nowrap',
            }}>{name}</span>
          ))}
        </div>
      </section>

      {/* ──────────────────────── PAIN → SOLUTION ──────────────────────── */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ ...sectionMax, display: 'flex', gap: 40, alignItems: 'stretch', flexWrap: 'wrap' }}>
          {/* Pain side */}
          <div style={{
            flex: '1 1 460px', borderRadius: 16, padding: 40,
            border: `1px solid ${c.dangerBorder}`, backgroundColor: c.dangerSubtle,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 6, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`,
              marginBottom: 24,
            }}>
              <TrendingDown size={14} color={c.danger} />
              <span style={{ fontSize: 12, fontWeight: 700, color: c.danger, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before Lumnix</span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: c.text, marginBottom: 20, letterSpacing: '-0.5px' }}>
              Death by a thousand tabs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Switching between GA4, GSC, Ads, and SEMrush every morning',
                'Spending all Monday building client reports manually',
                'Missing traffic drops until the client calls angry',
                'Competitor launches a campaign and you find out two weeks later',
                'Data everywhere, insights nowhere',
              ].map((pain, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.danger, marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.6 }}>{pain}</span>
                </div>
              ))}
            </div>
            {/* Fake scattered tabs mockup */}
            <div style={{ marginTop: 28, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['GA4', 'GSC', 'Google Ads', 'Meta Ads', 'SEMrush', 'Sheets'].map((tab, i) => (
                <div key={i} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  backgroundColor: c.bgCard, border: `1px solid ${c.border}`, color: c.textMuted,
                  transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (1 + i)}deg)`,
                }}>{tab}</div>
              ))}
            </div>
          </div>

          {/* Solution side */}
          <div style={{
            flex: '1 1 460px', borderRadius: 16, padding: 40,
            border: `1px solid ${c.successBorder}`, backgroundColor: c.successSubtle,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 6, backgroundColor: c.successSubtle, border: `1px solid ${c.successBorder}`,
              marginBottom: 24,
            }}>
              <TrendingUp size={14} color={c.success} />
              <span style={{ fontSize: 12, fontWeight: 700, color: c.success, textTransform: 'uppercase', letterSpacing: '0.05em' }}>With Lumnix</span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: c.text, marginBottom: 20, letterSpacing: '-0.5px' }}>
              One dashboard. Total clarity.
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'All your data sources unified in one intelligent view',
                'Branded PDF reports auto-generated and delivered overnight',
                'AI catches anomalies and alerts you in real-time',
                'Competitor moves detected and surfaced automatically',
                'Data becomes insights — insights become action',
              ].map((solution, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Check size={16} color={c.success} style={{ marginTop: 3, flexShrink: 0 } as CSSProperties} />
                  <span style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.6 }}>{solution}</span>
                </div>
              ))}
            </div>
            {/* Unified tab mockup */}
            <div style={{ marginTop: 28, display: 'flex', gap: 0 }}>
              <div style={{
                padding: '8px 20px', borderRadius: '8px 8px 0 0', fontSize: 13, fontWeight: 600,
                backgroundColor: c.accent, color: '#fff',
              }}>Lumnix Dashboard</div>
              <div style={{ flex: 1, borderBottom: `2px solid ${c.accent}` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── FEATURES GRID ──────────────────────── */}
      <section id="features" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={sectionMax}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px',
              borderRadius: 100, backgroundColor: c.accentSubtle, border: `1px solid rgba(99,102,241,0.2)`,
              marginBottom: 20,
            }}>
              <Zap size={12} color={c.accent} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.accent }}>Features</span>
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-2px', marginBottom: 18, color: c.text }}>
              Intelligence, not just data
            </h2>
            <p style={{ fontSize: 17, color: c.textMuted, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              Six powerful features that turn scattered marketing data into clear, actionable intelligence.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                  borderRadius: 14, padding: 32, transition: 'all 0.25s', cursor: 'default',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.borderStrong; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                  background: `radial-gradient(circle, ${c.accentSubtle} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: c.accentSubtle, border: `1px solid rgba(99,102,241,0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 22,
                }}>
                  <f.icon size={22} color={c.accent} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────── BIG FEATURE SPOTLIGHTS ──────────────────────── */}
      <section style={{ padding: '60px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={sectionMax}>
          {SPOTLIGHTS.map((spot, idx) => {
            const reversed = idx % 2 !== 0;
            return (
              <div key={idx} style={{
                display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap',
                marginBottom: idx < SPOTLIGHTS.length - 1 ? 120 : 0,
                flexDirection: reversed ? 'row-reverse' : 'row',
              }}>
                {/* Text */}
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                    borderRadius: 6, backgroundColor: c.accentSubtle, border: `1px solid rgba(99,102,241,0.2)`,
                    marginBottom: 20,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.accent }}>{spot.badge}</span>
                  </div>
                  <h3 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', color: c.text, marginBottom: 20, lineHeight: 1.15 }}>
                    {spot.title}
                  </h3>
                  <p style={{ fontSize: 16, color: c.textSecondary, lineHeight: 1.75, marginBottom: 28 }}>
                    {spot.desc}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {spot.bullets.map(b => (
                      <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={12} color={c.accent} />
                        </div>
                        <span style={{ fontSize: 14, color: c.textSecondary }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock UI */}
                <div style={{
                  flex: '1 1 440px', borderRadius: 16, border: `1px solid ${c.border}`,
                  backgroundColor: c.bgCard, padding: 20, overflow: 'hidden',
                  boxShadow: '0 16px 60px rgba(0,0,0,0.25)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
                    width: 400, height: 120,
                    background: `radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  {idx === 0 && (
                    /* Anomaly detection mock */
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>AI Anomaly Detection</div>
                        <div style={{ padding: '3px 10px', borderRadius: 100, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, fontSize: 11, color: c.danger, fontWeight: 600 }}>3 anomalies detected</div>
                      </div>
                      <div style={{ backgroundColor: c.bgCardHover, borderRadius: 10, padding: 14, border: `1px solid ${c.border}`, marginBottom: 12, position: 'relative', height: 130, overflow: 'hidden' }}>
                        <svg width="100%" height="100%" viewBox="0 0 500 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                          <path d="M0,60 C40,55 80,50 120,48 C160,46 200,44 240,42 C280,40 300,38 320,70 C340,85 360,80 400,75 C440,70 480,65 500,60" fill="none" stroke={c.accent} strokeWidth="2" />
                          <circle cx="320" cy="70" r="6" fill={c.danger} />
                          <circle cx="320" cy="70" r="10" fill={c.danger} fillOpacity="0.2" />
                          <line x1="320" y1="70" x2="320" y2="10" stroke={c.danger} strokeWidth="1" strokeDasharray="4 4" />
                          <rect x="290" y="2" width="60" height="18" rx="4" fill={c.danger} />
                          <text x="320" y="14" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">-23% Drop</text>
                        </svg>
                      </div>
                      <MockAlertRow severity="critical" msg="Organic traffic dropped 23% on /pricing" time="Today" />
                      <MockAlertRow severity="warning" msg="CTR anomaly on brand keywords" time="Yesterday" />
                      <MockAlertRow severity="info" msg="New ranking for 'ai marketing tool'" time="2d ago" />
                    </>
                  )}

                  {idx === 1 && (
                    /* Competitor intelligence mock */
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 16 }}>Competitor Keyword Gap</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <div style={{ padding: '4px 12px', borderRadius: 6, backgroundColor: c.accent, color: '#fff', fontSize: 12, fontWeight: 600 }}>Gap Analysis</div>
                        <div style={{ padding: '4px 12px', borderRadius: 6, backgroundColor: c.bgCardHover, color: c.textSecondary, fontSize: 12 }}>Traffic Trends</div>
                        <div style={{ padding: '4px 12px', borderRadius: 6, backgroundColor: c.bgCardHover, color: c.textSecondary, fontSize: 12 }}>Backlinks</div>
                      </div>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '8px 12px', fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${c.border}` }}>
                        <span>Keyword</span><span>Their Pos.</span><span>Your Pos.</span><span>Volume</span>
                      </div>
                      {[
                        { kw: 'marketing analytics tool', them: '#3', you: '—', vol: '2.4K' },
                        { kw: 'seo reporting software', them: '#5', you: '#12', vol: '1.8K' },
                        { kw: 'automated marketing reports', them: '#2', you: '#8', vol: '1.2K' },
                        { kw: 'competitor analysis platform', them: '#4', you: '—', vol: '980' },
                        { kw: 'google ads dashboard', them: '#7', you: '#15', vol: '3.1K' },
                      ].map((row, i) => (
                        <div key={i} style={{
                          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8,
                          padding: '10px 12px', fontSize: 13, borderBottom: `1px solid ${c.border}`,
                          backgroundColor: i % 2 === 0 ? 'transparent' : c.bgCardHover,
                        }}>
                          <span style={{ color: c.text, fontWeight: 500 }}>{row.kw}</span>
                          <span style={{ color: c.success, fontWeight: 600 }}>{row.them}</span>
                          <span style={{ color: row.you === '—' ? c.danger : c.warning, fontWeight: 600 }}>{row.you}</span>
                          <span style={{ color: c.textSecondary }}>{row.vol}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {idx === 2 && (
                    /* Report builder mock */
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Report Builder</div>
                        <div style={{ padding: '5px 14px', borderRadius: 6, backgroundColor: c.accent, color: '#fff', fontSize: 12, fontWeight: 600 }}>Generate PDF</div>
                      </div>
                      {/* Fake report preview */}
                      <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, color: '#111' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>M</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Meridian Digital</div>
                            <div style={{ fontSize: 10, color: '#888' }}>Monthly Performance Report — March 2026</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                          {[{ l: 'Sessions', v: '45.2K', c: '#10B981' }, { l: 'Conversions', v: '1,247', c: '#6366F1' }, { l: 'Revenue', v: '$89.4K', c: '#F59E0B' }].map((s, i) => (
                            <div key={i} style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{s.l}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ backgroundColor: '#f0f4ff', borderRadius: 8, padding: 12, borderLeft: `3px solid ${c.accent}` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: c.accent, marginBottom: 4 }}>AI Summary</div>
                          <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>
                            Traffic increased 14% MoM driven by organic growth in blog content. Conversion rate held steady at 2.8%. Recommend increasing ad spend on high-performing campaigns.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────── TESTIMONIALS ──────────────────────── */}
      <section id="testimonials" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={sectionMax}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px',
              borderRadius: 100, backgroundColor: c.accentSubtle, border: `1px solid rgba(99,102,241,0.2)`,
              marginBottom: 20,
            }}>
              <Users size={12} color={c.accent} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.accent }}>Testimonials</span>
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-2px', marginBottom: 18, color: c.text }}>
              What our beta testers say
            </h2>
            <p style={{ fontSize: 17, color: c.textMuted, maxWidth: 500, margin: '0 auto' }}>
              Early feedback from teams testing Lumnix before launch.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                  borderRadius: 14, padding: 28, transition: 'all 0.25s',
                  display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.borderStrong; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={16} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.7, flex: 1, marginBottom: 24 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <InitialsAvatar name={t.name} color={t.color} size={40} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: c.textMuted }}>{t.role}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────── METRICS / SOCIAL PROOF ──────────────────────── */}
      <section style={{ padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          ...sectionMax,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '36px 20px', borderRadius: 14,
              backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
            }}>
              <div style={{
                fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px',
                color: c.accent, fontFamily: 'var(--font-mono)', marginBottom: 8,
              }}>{m.value}</div>
              <div style={{ fontSize: 14, color: c.textMuted, fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────── PRICING ──────────────────────── */}
      <section id="pricing" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={sectionMax}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px',
              borderRadius: 100, backgroundColor: c.accentSubtle, border: `1px solid rgba(99,102,241,0.2)`,
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: c.accent }}>Pricing</span>
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-2px', marginBottom: 18, color: c.text }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 17, color: c.textMuted, marginBottom: 36 }}>
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </div>

          {/* Annual toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 56 }}>
            <span style={{ fontSize: 14, color: annual ? c.textMuted : c.text, fontWeight: 500 }}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              style={{
                width: 52, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer',
                backgroundColor: annual ? c.accent : c.bgCardHover,
                position: 'relative', transition: 'background-color 0.2s',
                padding: 0,
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff',
                position: 'absolute', top: 3,
                left: annual ? 27 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: 14, color: annual ? c.text : c.textMuted, fontWeight: 500 }}>
              Annual
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: c.success,
              backgroundColor: c.successSubtle, padding: '3px 10px', borderRadius: 100,
            }}>Save 20%</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start', maxWidth: 1040, margin: '0 auto' }}>
            {PRICING.map(p => {
              const displayPrice = annual ? Math.round(p.price * 0.8) : p.price;
              return (
                <div
                  key={p.name}
                  style={{
                    backgroundColor: c.bgCard,
                    border: `1px solid ${p.highlight ? c.accent : c.border}`,
                    borderRadius: 16, padding: 36, position: 'relative',
                    transition: 'all 0.25s',
                    ...(p.highlight ? { boxShadow: '0 0 80px rgba(99,102,241,0.12)', transform: 'scale(1.03)' } : {}),
                  }}
                  onMouseEnter={e => { if (!p.highlight) { e.currentTarget.style.borderColor = c.borderStrong; e.currentTarget.style.transform = 'translateY(-4px)'; } }}
                  onMouseLeave={e => { if (!p.highlight) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  {p.badge && (
                    <div style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      padding: '5px 18px', borderRadius: 100, whiteSpace: 'nowrap',
                    }}>{p.badge}</div>
                  )}

                  <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>{p.name}</div>
                  <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>{p.desc}</p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                    <span style={{ fontSize: 52, fontWeight: 800, color: c.text, letterSpacing: '-2px', fontFamily: 'var(--font-mono)' }}>${displayPrice}</span>
                    <span style={{ fontSize: 15, color: c.textMuted }}>/mo</span>
                  </div>

                  <button
                    onClick={() => openWaitlist()}
                    style={{
                      width: '100%', padding: 14, borderRadius: 10, cursor: 'pointer',
                      fontSize: 15, fontWeight: 700, marginBottom: 28,
                      border: p.highlight ? 'none' : `1px solid ${c.borderStrong}`,
                      backgroundColor: p.highlight ? c.accent : 'transparent',
                      color: p.highlight ? '#fff' : c.text,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = p.highlight ? c.accentHover : c.bgCardHover; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = p.highlight ? c.accent : 'transparent'; }}
                  >{p.cta}</button>

                  <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 24 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <Check size={15} color={p.highlight ? c.accent : c.textMuted} strokeWidth={2.5} />
                        <span style={{ fontSize: 14, color: c.textSecondary }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────── FAQ ──────────────────────── */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ ...sectionMax, maxWidth: 760 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 18, color: c.text }}>
              Frequently asked questions
            </h2>
            <p style={{ fontSize: 16, color: c.textMuted }}>
              Everything you need to know about Lumnix.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{
                  backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                  borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '20px 24px', border: 'none', backgroundColor: 'transparent',
                      color: c.text, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {faq.q}
                    <ChevronDown size={18} color={c.textMuted} style={{
                      transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    } as CSSProperties} />
                  </button>
                  <div style={{
                    maxHeight: isOpen ? 300 : 0,
                    overflow: 'hidden', transition: 'max-height 0.3s ease',
                  }}>
                    <p style={{
                      padding: '0 24px 20px', fontSize: 15, color: c.textSecondary, lineHeight: 1.7, margin: 0,
                    }}>{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────── FINAL CTA ──────────────────────── */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          ...sectionMax, maxWidth: 900, textAlign: 'center',
          borderRadius: 24, padding: '80px 40px',
          background: `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)`,
          border: `1px solid rgba(99,102,241,0.2)`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow orbs */}
          <div style={{
            position: 'absolute', top: -100, left: '20%', width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -100, right: '20%', width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontSize: 48, fontWeight: 800, letterSpacing: '-2px', marginBottom: 20,
            color: c.text, lineHeight: 1.1, position: 'relative',
          }}>
            Stop drowning in dashboards.
          </h2>
          <p style={{
            fontSize: 18, color: c.textSecondary, maxWidth: 520, margin: '0 auto 40px',
            lineHeight: 1.7, position: 'relative',
          }}>
            Join the waitlist and be first to experience the future of
            marketing intelligence. Early access spots are limited.
          </p>
          <button
            onClick={() => openWaitlist()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '18px 40px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
              color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.25s', position: 'relative',
              boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.3)'; }}
          >
            Join the waitlist <ArrowRight size={20} />
          </button>
          <p style={{ fontSize: 13, color: c.textMuted, marginTop: 16, position: 'relative' }}>
            No credit card required &middot; Free early access &middot; Limited spots
          </p>
        </div>
      </section>

      {/* ──────────────────────── FOOTER ──────────────────────── */}
      <footer style={{
        padding: '60px 24px 32px', borderTop: `1px solid ${c.border}`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ ...sectionMax }}>
          {/* Top row: logo + link columns */}
          <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap', marginBottom: 48 }}>
            {/* Brand column */}
            <div style={{ flex: '1 1 240px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: c.text, marginBottom: 12 }}>
                <span style={{ color: c.accent }}>L</span>umnix
              </div>
              <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>
                AI-powered marketing intelligence. One dashboard to replace them all.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ Icon: Twitter, href: SOCIAL_LINKS.twitter }, { Icon: Linkedin, href: SOCIAL_LINKS.linkedin }, { Icon: Mail, href: SOCIAL_LINKS.email }].map(({ Icon, href }, i) => (
                  <a key={i} href={href} target={href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" style={{
                    width: 36, height: 36, borderRadius: 8, backgroundColor: c.bgCardHover,
                    border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.2s', textDecoration: 'none',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = c.borderStrong)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                  >
                    <Icon size={16} color={c.textMuted} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category} style={{ flex: '0 0 140px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</div>
                {links.map(link => (
                  <a key={link} href={link === 'Privacy' ? '/privacy' : link === 'Terms' ? '/terms' : '#'} style={{
                    display: 'block', fontSize: 14, color: c.textMuted, textDecoration: 'none',
                    padding: '5px 0', transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = c.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                  >{link}</a>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: `1px solid ${c.border}`, paddingTop: 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: c.textMuted }}>&copy; 2026 Lumnix. All rights reserved.</span>
            <span style={{ fontSize: 13, color: c.borderStrong }}>Built with care for marketing teams everywhere.</span>
          </div>
        </div>
      </footer>

      {/* ──────────────────────── WAITLIST MODAL ──────────────────────── */}
      {showWaitlist && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        }} onClick={() => setShowWaitlist(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, margin: '0 16px',
              backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
              borderRadius: 20, padding: 36, position: 'relative',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Close button */}
            <button onClick={() => setShowWaitlist(false)} style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              color: c.textMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1,
            }}>&times;</button>

            {wlSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', backgroundColor: c.successSubtle,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', border: `2px solid ${c.success}`,
                }}>
                  <Check size={28} color={c.success} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 10 }}>You&apos;re on the list! 🎉</h3>
                <p style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.7, marginBottom: 8 }}>
                  We&apos;ll notify you when your early access is ready. You&apos;re going to love what we&apos;re building.
                </p>
                <p style={{ fontSize: 13, color: c.textMuted }}>Check your inbox for a confirmation.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 8 }}>Join the waitlist</h3>
                  <p style={{ fontSize: 14, color: c.textSecondary, margin: 0 }}>Get early access to Lumnix — free for 30 days, no card required.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Name *</label>
                    <input
                      value={wlName} onChange={e => setWlName(e.target.value)}
                      placeholder="Your full name"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: `1px solid ${c.border}`, backgroundColor: c.bgPage,
                        color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = c.accent}
                      onBlur={e => e.target.style.borderColor = c.border}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Email *</label>
                    <input
                      value={wlEmail} onChange={e => setWlEmail(e.target.value)}
                      placeholder="you@company.com" type="email"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: `1px solid ${c.border}`, backgroundColor: c.bgPage,
                        color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = c.accent}
                      onBlur={e => e.target.style.borderColor = c.border}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Company</label>
                    <input
                      value={wlCompany} onChange={e => setWlCompany(e.target.value)}
                      placeholder="Your company name"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: `1px solid ${c.border}`, backgroundColor: c.bgPage,
                        color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = c.accent}
                      onBlur={e => e.target.style.borderColor = c.border}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Role</label>
                      <input
                        value={wlRole} onChange={e => setWlRole(e.target.value)}
                        placeholder="e.g. Marketing Director"
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8,
                          border: `1px solid ${c.border}`, backgroundColor: c.bgPage,
                          color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = c.accent}
                        onBlur={e => e.target.style.borderColor = c.border}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>Team size</label>
                      <select
                        value={wlTeamSize} onChange={e => setWlTeamSize(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8,
                          border: `1px solid ${c.border}`, backgroundColor: c.bgPage,
                          color: wlTeamSize ? c.text : c.textMuted, fontSize: 14, outline: 'none',
                          boxSizing: 'border-box' as const, cursor: 'pointer',
                        }}
                      >
                        <option value="">Select</option>
                        <option value="just_me">Just me</option>
                        <option value="2-5">2–5</option>
                        <option value="6-20">6–20</option>
                        <option value="21-50">21–50</option>
                        <option value="50+">50+</option>
                      </select>
                    </div>
                  </div>

                  {wlError && (
                    <p style={{ fontSize: 13, color: c.danger, margin: 0 }}>{wlError}</p>
                  )}

                  <button
                    onClick={submitWaitlist}
                    disabled={wlSubmitting}
                    style={{
                      width: '100%', padding: 14, borderRadius: 10, border: 'none',
                      background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
                      color: '#fff', fontSize: 15, fontWeight: 700, cursor: wlSubmitting ? 'not-allowed' : 'pointer',
                      opacity: wlSubmitting ? 0.7 : 1, transition: 'all 0.2s',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                      marginTop: 4,
                    }}
                  >
                    {wlSubmitting ? 'Submitting...' : 'Join the waitlist'}
                  </button>

                  <p style={{ fontSize: 12, color: c.textMuted, textAlign: 'center', margin: 0 }}>
                    We&apos;ll never spam you. Unsubscribe anytime.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Global responsive style injection ─── */}
      <style>{`
        html { scroll-behavior: smooth; }
        @media (max-width: 900px) {
          h1 { font-size: 44px !important; letter-spacing: -1.5px !important; }
          h2 { font-size: 32px !important; }
          h3 { font-size: 24px !important; }
        }
        @media (max-width: 768px) {
          nav > div:last-child a:not([style*="border-radius: 8"]) { display: none; }
          [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: 2fr"] { grid-template-columns: 1fr !important; }
          section > div[style*="flex-direction: row-reverse"] { flex-direction: column !important; }
          section > div[style*="flex-direction: row"] { flex-direction: column !important; }
        }
        @media (max-width: 640px) {
          nav { padding: 0 16px !important; }
          h1 { font-size: 36px !important; letter-spacing: -1px !important; }
          [style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingInner />
    </ThemeProvider>
  );
}
