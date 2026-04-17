import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScrollReveal } from '../components/ScrollReveal';
import { Eye, Zap, Shield, Heart, Users, Target, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Lumnix — Marketing Intelligence for D2C Brands',
  description:
    "We're building the operating system for D2C marketing teams. One platform, every signal, one AI that actually knows your brand.",
};

const values = [
  {
    icon: Eye,
    title: 'Clarity over noise',
    body:
      "Marketing dashboards shouldn't feel like spreadsheets with a dark theme. We cut what doesn't matter, amplify what does.",
  },
  {
    icon: Zap,
    title: 'Speed is a feature',
    body:
      "A 10-second answer beats a 10-hour report. Lumi is built to give you the shape of the answer before you finish asking.",
  },
  {
    icon: Shield,
    title: 'Your data, your moat',
    body:
      'Read-only integrations, encrypted tokens, row-level security. We never write to your ad accounts. We never train on your data.',
  },
  {
    icon: Heart,
    title: 'Made for India, built for anywhere',
    body:
      'Pricing in rupees. Timezones that match. Founders we actually talk to. Then we take the same playbook global.',
  },
];

const stats = [
  { label: 'Tools unified', value: '5+' },
  { label: 'Hours saved / week', value: '14' },
  { label: 'Ad creatives indexed', value: '2M+' },
  { label: 'Founding users', value: '120' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="wr-section wr-hero" style={{ minHeight: '70vh' }}>
          <div className="wr-orb-1" />
          <div className="wr-orb-2" />
          <div className="wr-container" style={{ textAlign: 'center', maxWidth: 900 }}>
            <span className="wr-badge" style={{ margin: '0 auto 24px' }}>
              <span className="wr-pulse-dot" />
              About Lumnix
            </span>
            <h1 className="wr-hero-headline" style={{ marginBottom: 24 }}>
              We&apos;re building the
              <br />
              <span className="wr-shimmer">brain</span> of marketing.
            </h1>
            <p className="wr-sub-headline" style={{ margin: '0 auto 24px', maxWidth: 680 }}>
              Modern D2C teams live in 5+ tabs. Lumnix collapses them into one — with an AI that
              actually remembers your brand, your goals, your last campaign.
            </p>
            <p className="wr-hero-tagline" style={{ marginBottom: 36 }}>
              Made in India. Built for operators.
            </p>
            <div className="wr-hero-ctas" style={{ justifyContent: 'center' }}>
              <Link href="/auth/signup" className="wr-cta wr-cta--lg">
                Get early access <span style={{ fontSize: 20 }}>→</span>
              </Link>
              <a href="mailto:admin@oltaflock.ai" className="wr-cta-ghost">
                Talk to the founders
              </a>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="wr-section" style={{ paddingTop: 0, paddingBottom: 48 }}>
          <div
            className="wr-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              padding: '32px 24px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(180deg, rgba(255,0,102,0.05), rgba(0,212,170,0.03))',
            }}
          >
            {stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Outfit'), system-ui, sans-serif",
                    fontSize: 'clamp(32px, 4vw, 48px)',
                    fontWeight: 900,
                    color: '#FF0066',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(240,240,245,0.6)',
                    marginTop: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="wr-section">
          <div className="wr-container" style={{ maxWidth: 820 }}>
            <ScrollReveal>
              <span className="wr-badge" style={{ marginBottom: 20 }}>
                <Target size={14} />
                Our story
              </span>
              <h2 className="wr-section-headline" style={{ marginBottom: 28 }}>
                Built because we lived the pain.
              </h2>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: 'rgba(240,240,245,0.82)',
                  display: 'grid',
                  gap: 22,
                }}
              >
                <p>
                  We ran growth for D2C brands before we built Lumnix. Every Monday started the
                  same way — eight tabs, three dashboards, a spreadsheet stitched by hand, and a
                  founder asking <em>&quot;so what happened last week?&quot;</em>
                </p>
                <p>
                  GSC for SEO. GA4 for traffic. Google Ads and Meta Ads for paid. A scraper for
                  competitor ads. A notebook for attribution. None of them knew each other existed.
                </p>
                <p>
                  We kept buying more tools. The answer kept getting further away. So we stopped
                  buying and started building — a layer that speaks all of them, remembers
                  everything, and answers the only question that matters:{' '}
                  <strong style={{ color: '#fff' }}>what should I do next?</strong>
                </p>
                <p>
                  That&apos;s Lumnix. One platform. Every signal. One AI — <strong style={{ color: '#FF0066' }}>Lumi</strong> —
                  that actually knows your brand.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Values */}
        <section className="wr-section">
          <div className="wr-container">
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <span className="wr-badge" style={{ marginBottom: 20 }}>
                  <Heart size={14} />
                  What we believe
                </span>
                <h2 className="wr-section-headline">The principles we ship by.</h2>
              </div>
            </ScrollReveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              {values.map((v, i) => (
                <ScrollReveal key={v.title} delay={i * 0.08}>
                  <div
                    style={{
                      padding: 28,
                      borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: '#13131A',
                      height: '100%',
                      transition: 'transform 300ms var(--lx-ease), border-color 300ms var(--lx-ease)',
                    }}
                    className="lx-pop-card"
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'rgba(255,0,102,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        color: '#FF0066',
                      }}
                    >
                      <v.icon size={22} />
                    </div>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: '#fff',
                        marginBottom: 10,
                        letterSpacing: '-0.02em',
                        fontFamily: "var(--font-display, 'Outfit'), system-ui, sans-serif",
                      }}
                    >
                      {v.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: 'rgba(240,240,245,0.65)',
                      }}
                    >
                      {v.body}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Team / Oltaflock */}
        <section className="wr-section">
          <div className="wr-container" style={{ maxWidth: 820 }}>
            <ScrollReveal>
              <div
                style={{
                  padding: '40px 32px',
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: 'linear-gradient(180deg, #1A1A24, #13131A)',
                  textAlign: 'center',
                }}
              >
                <span className="wr-badge" style={{ margin: '0 auto 20px' }}>
                  <Users size={14} />
                  The team
                </span>
                <h2
                  className="wr-section-headline"
                  style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginBottom: 16 }}
                >
                  A small team. A sharp focus.
                </h2>
                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: 'rgba(240,240,245,0.75)',
                    maxWidth: 600,
                    margin: '0 auto 28px',
                  }}
                >
                  Lumnix is made by <strong style={{ color: '#fff' }}>Oltaflock AI</strong> — a
                  two-person studio obsessed with AI-native tools that treat operators like
                  operators, not data entry clerks.
                </p>
                <a
                  href="https://oltaflock.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wr-cta-ghost"
                  style={{ display: 'inline-flex' }}
                >
                  Visit Oltaflock <ArrowUpRight size={16} />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="wr-section" style={{ paddingTop: 0 }}>
          <div className="wr-container" style={{ textAlign: 'center', maxWidth: 760 }}>
            <ScrollReveal>
              <h2 className="wr-section-headline" style={{ marginBottom: 20 }}>
                Want to build with us?
              </h2>
              <p className="wr-sub-headline" style={{ margin: '0 auto 32px', maxWidth: 560 }}>
                Early access is open. Founders get a direct line, lifetime pricing, and roadmap
                input.
              </p>
              <div className="wr-hero-ctas" style={{ justifyContent: 'center' }}>
                <Link href="/auth/signup" className="wr-cta wr-cta--lg">
                  Claim your spot <span style={{ fontSize: 20 }}>→</span>
                </Link>
                <a href="mailto:admin@oltaflock.ai" className="wr-cta-ghost">
                  admin@oltaflock.ai
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
