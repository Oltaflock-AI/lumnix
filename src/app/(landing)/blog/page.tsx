import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScrollReveal } from '../components/ScrollReveal';
import { ArrowUpRight, Clock, Sparkles, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — Lumnix',
  description:
    'Playbooks, teardowns, and operator notes on D2C growth, AI marketing, and the tools we build at Lumnix.',
};

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Playbook' | 'Teardown' | 'Product' | 'Deep Dive';
  date: string;
  readTime: string;
  featured?: boolean;
};

const posts: Post[] = [
  {
    slug: 'unified-marketing-stack',
    title: 'The unified marketing stack: why D2C teams need one layer, not ten tools',
    excerpt:
      "A tour of the five dashboards you're probably using today — and the case for collapsing them into one AI-native workspace.",
    category: 'Playbook',
    date: 'Apr 15, 2026',
    readTime: '8 min read',
    featured: true,
  },
  {
    slug: 'meta-ad-library-teardown',
    title: 'Inside the Meta Ad Library: how we scrape 2M+ creatives for competitor intelligence',
    excerpt:
      'The scrapers, the rate limits, the data model, and how Lumi turns raw ad dumps into "here is what your competitor is about to test."',
    category: 'Teardown',
    date: 'Apr 11, 2026',
    readTime: '12 min read',
  },
  {
    slug: 'lumi-ai-agent',
    title: 'Meet Lumi: the AI that actually remembers your brand',
    excerpt:
      'Context windows, workspace memory, and why the third message is more important than the first when you talk to a marketing AI.',
    category: 'Product',
    date: 'Apr 7, 2026',
    readTime: '6 min read',
  },
  {
    slug: 'gsc-ga4-attribution',
    title: 'Why GSC + GA4 + Ads never agree — and how to build an attribution layer that does',
    excerpt:
      'Sampling, dedup logic, cross-device gaps, and the attribution model Lumnix ships with for Indian D2C brands.',
    category: 'Deep Dive',
    date: 'Apr 2, 2026',
    readTime: '10 min read',
  },
  {
    slug: 'cac-india-2026',
    title: 'CAC benchmarks for Indian D2C in 2026 — what we are seeing across 120 brands',
    excerpt:
      "Median blended CAC by category, what's broken about Meta right now, and where the cheapest incremental revenue is hiding.",
    category: 'Playbook',
    date: 'Mar 28, 2026',
    readTime: '9 min read',
  },
  {
    slug: 'building-in-public',
    title: 'Building Lumnix in public: month one',
    excerpt:
      'Shipping velocity, the features we killed, the pricing we changed twice, and what founding users asked for that we did not expect.',
    category: 'Product',
    date: 'Mar 21, 2026',
    readTime: '5 min read',
  },
];

const categoryTint: Record<Post['category'], string> = {
  Playbook: '#FF0066',
  Teardown: '#00D4AA',
  Product: '#7B61FF',
  'Deep Dive': '#FF8A00',
};

function PostCard({ post, large = false }: { post: Post; large?: boolean }) {
  const tint = categoryTint[post.category];
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="lx-pop-card"
      style={{
        display: 'block',
        padding: large ? 40 : 28,
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.07)',
        background: large
          ? 'linear-gradient(180deg, #1A1A24, #13131A)'
          : '#13131A',
        height: '100%',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 300ms var(--lx-ease), border-color 300ms var(--lx-ease)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {large && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 10% 0%, ${tint}22, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 12px',
              borderRadius: 100,
              background: `${tint}1f`,
              color: tint,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {post.category}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'rgba(240,240,245,0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={12} />
            {post.readTime}
          </span>
        </div>
        <h3
          style={{
            fontSize: large ? 'clamp(26px, 3.2vw, 38px)' : 20,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            marginBottom: 14,
            fontFamily: "var(--font-display, 'Outfit'), system-ui, sans-serif",
          }}
        >
          {post.title}
        </h3>
        <p
          style={{
            fontSize: large ? 17 : 14.5,
            lineHeight: 1.6,
            color: 'rgba(240,240,245,0.65)',
            marginBottom: 20,
          }}
        >
          {post.excerpt}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            color: 'rgba(240,240,245,0.45)',
          }}
        >
          <span>{post.date}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: tint,
              fontWeight: 600,
            }}
          >
            Read <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="wr-section wr-hero" style={{ minHeight: '50vh' }}>
          <div className="wr-orb-1" />
          <div className="wr-orb-2" />
          <div className="wr-container" style={{ textAlign: 'center', maxWidth: 820 }}>
            <span className="wr-badge" style={{ margin: '0 auto 24px' }}>
              <Sparkles size={14} />
              The Lumnix journal
            </span>
            <h1 className="wr-hero-headline" style={{ marginBottom: 24 }}>
              Operator notes.
              <br />
              <span className="wr-shimmer">Zero fluff.</span>
            </h1>
            <p className="wr-sub-headline" style={{ margin: '0 auto', maxWidth: 620 }}>
              Playbooks, teardowns, and product dispatches on D2C growth, AI marketing, and the
              tools we&apos;re building inside Lumnix.
            </p>
          </div>
        </section>

        {/* Featured */}
        <section className="wr-section" style={{ paddingTop: 0 }}>
          <div className="wr-container">
            <ScrollReveal>
              <PostCard post={featured} large />
            </ScrollReveal>
          </div>
        </section>

        {/* Grid */}
        <section className="wr-section" style={{ paddingTop: 0 }}>
          <div className="wr-container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#fff',
                  fontFamily: "var(--font-display, 'Outfit'), system-ui, sans-serif",
                }}
              >
                Latest
              </h2>
              <span style={{ fontSize: 14, color: 'rgba(240,240,245,0.5)' }}>
                {rest.length} posts
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              {rest.map((p, i) => (
                <ScrollReveal key={p.slug} delay={i * 0.06}>
                  <PostCard post={p} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="wr-section">
          <div className="wr-container" style={{ maxWidth: 760 }}>
            <ScrollReveal>
              <div
                style={{
                  padding: '40px 32px',
                  borderRadius: 24,
                  border: '1px solid rgba(255,0,102,0.25)',
                  background:
                    'linear-gradient(180deg, rgba(255,0,102,0.08), rgba(0,212,170,0.04))',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(255,0,102,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    color: '#FF0066',
                  }}
                >
                  <Mail size={22} />
                </div>
                <h2
                  className="wr-section-headline"
                  style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', marginBottom: 14 }}
                >
                  One email. Every Thursday.
                </h2>
                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.6,
                    color: 'rgba(240,240,245,0.72)',
                    maxWidth: 520,
                    margin: '0 auto 28px',
                  }}
                >
                  The best teardown of the week, one growth playbook, and whatever we shipped
                  inside Lumnix. No threads, no fluff.
                </p>
                <div className="wr-hero-ctas" style={{ justifyContent: 'center' }}>
                  <Link href="/auth/signup" className="wr-cta wr-cta--lg">
                    Subscribe <span style={{ fontSize: 20 }}>→</span>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
