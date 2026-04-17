import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ArrowLeft, Clock, Mail } from 'lucide-react';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Playbook' | 'Teardown' | 'Product' | 'Deep Dive';
  date: string;
  readTime: string;
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

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: 'Post not found — Lumnix' };
  return {
    title: `${post.title} — Lumnix`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const tint = categoryTint[post.category];

  return (
    <>
      <Navbar />
      <main id="main-content">
        <article className="wr-section" style={{ paddingTop: 120 }}>
          <div className="wr-container" style={{ maxWidth: 760 }}>
            <Link
              href="/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'rgba(240,240,245,0.6)',
                marginBottom: 32,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} /> All posts
            </Link>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
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
                  fontSize: 13,
                  color: 'rgba(240,240,245,0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Clock size={12} />
                {post.readTime}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(240,240,245,0.5)' }}>
                {post.date}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(34px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 1.08,
                color: '#fff',
                marginBottom: 24,
                fontFamily: "var(--font-display, 'Outfit'), system-ui, sans-serif",
                textWrap: 'balance',
              }}
            >
              {post.title}
            </h1>

            <p
              style={{
                fontSize: 19,
                lineHeight: 1.6,
                color: 'rgba(240,240,245,0.78)',
                marginBottom: 48,
              }}
            >
              {post.excerpt}
            </p>

            <div
              style={{
                padding: '40px 32px',
                borderRadius: 20,
                border: `1px solid ${tint}44`,
                background: `linear-gradient(180deg, ${tint}0f, #13131A)`,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${tint}22`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  color: tint,
                }}
              >
                <Mail size={22} />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: 10,
                  letterSpacing: '-0.02em',
                  fontFamily: "var(--font-display, 'Outfit'), system-ui, sans-serif",
                }}
              >
                Full post dropping soon.
              </h2>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'rgba(240,240,245,0.65)',
                  maxWidth: 460,
                  margin: '0 auto 24px',
                }}
              >
                We&apos;re polishing this one. Subscribe and we&apos;ll drop it in your inbox the
                moment it ships.
              </p>
              <Link href="/auth/signup" className="wr-cta">
                Get notified <span style={{ fontSize: 18 }}>→</span>
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
