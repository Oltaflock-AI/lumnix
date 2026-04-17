'use client';

import { useRef, type CSSProperties, type ComponentType, type ReactNode, type MouseEvent } from 'react';
import { ScrollReveal } from './ScrollReveal';

function GSCLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="14" width="3" height="6" rx="0.5" fill="#4285F4" />
      <rect x="7.5" y="10" width="3" height="10" rx="0.5" fill="#EA4335" />
      <rect x="12" y="5.5" width="3" height="14.5" rx="0.5" fill="#FBBC04" />
      <circle cx="17" cy="8" r="3.6" stroke="#34A853" strokeWidth="2" />
      <line x1="19.7" y1="10.6" x2="21.5" y2="12.4" stroke="#34A853" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function GA4Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="14" y="3" width="6" height="18" rx="3" fill="#F9AB00" />
      <circle cx="7" cy="17" r="4" fill="#E37400" />
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="meta-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0081FB" />
          <stop offset="100%" stopColor="#0064E1" />
        </linearGradient>
      </defs>
      <path
        fill="url(#meta-grad)"
        d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973.14.585.338 1.145.636 1.621.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843.345-.291.613-.614.81-.973.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.302-3.454-1.302zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
      />
    </svg>
  );
}

type Tool = {
  color: string;
  category: string;
  title: string;
  Logo: ComponentType;
  knows: ReactNode;
  blind: ReactNode;
  cost: ReactNode;
};

const tools: Tool[] = [
  {
    color: '#34A853',
    category: 'SEO',
    title: 'Google Search Console',
    Logo: GSCLogo,
    knows: (
      <>Your keyword <strong>&ldquo;promunch&rdquo;</strong> ranks <strong>#1</strong></>
    ),
    blind: (
      <>Has no idea you&rsquo;re paying <strong>₹4,200/mo</strong> to bid on the same keyword in Google Ads</>
    ),
    cost: <><span className="wr-tool-cost-dot" />₹0/mo spent here</>,
  },
  {
    color: '#F9AB00',
    category: 'Analytics',
    title: 'Google Analytics 4',
    Logo: GA4Logo,
    knows: (
      <>Sessions dropped <strong>25%</strong> last week</>
    ),
    blind: (
      <>Can&rsquo;t tell you it&rsquo;s because Mamaearth launched <strong>12 new ads</strong> targeting your audience on <strong>Tuesday</strong></>
    ),
    cost: <><span className="wr-tool-cost-dot" />₹0/mo · 3hrs/week exporting CSVs</>,
  },
  {
    color: '#0081FB',
    category: 'Paid Ads',
    title: 'Meta Ads Manager',
    Logo: MetaLogo,
    knows: (
      <>You spent <strong>₹8,159</strong> this month</>
    ),
    blind: (
      <>Doesn&rsquo;t know your competitors are spending <strong>10×</strong> and stealing your audience with hooks you&rsquo;ve never seen</>
    ),
    cost: <><span className="wr-tool-cost-dot" />₹8,159/mo and climbing</>,
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 12;
    const rotX = (0.5 - py) * 8;
    el.style.setProperty('--wr-rx', `${rotX.toFixed(2)}deg`);
    el.style.setProperty('--wr-ry', `${rotY.toFixed(2)}deg`);
    el.style.setProperty('--wr-mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--wr-my', `${(py * 100).toFixed(1)}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--wr-rx', '0deg');
    el.style.setProperty('--wr-ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="wr-pain-card"
      style={{ '--wr-card-accent': tool.color } as CSSProperties}
    >
      <div className="wr-pain-card-inner">
        <div className="wr-tool-header">
          <div
            className="wr-tool-icon"
            style={{ background: `${tool.color}20`, borderColor: `${tool.color}40` }}
          >
            <tool.Logo />
          </div>
          <div className="wr-tool-heading">
            <span className="wr-tool-eyebrow" style={{ color: tool.color }}>{tool.category}</span>
            <span className="wr-tool-name">{tool.title}</span>
          </div>
        </div>

        <div className="wr-tool-row wr-tool-row--knows">
          <div className="wr-tool-tag wr-tool-tag--green">
            <span className="wr-tool-tag-dot" />KNOWS
          </div>
          <p className="wr-tool-detail">{tool.knows}</p>
        </div>

        <div className="wr-tool-row wr-tool-row--blind">
          <div className="wr-tool-tag wr-tool-tag--red">
            <span className="wr-tool-tag-dot" />BLIND TO
          </div>
          <p className="wr-tool-detail">{tool.blind}</p>
        </div>

        <div className="wr-tool-cost">{tool.cost}</div>
      </div>
    </div>
  );
}

export function VillainSection() {
  return (
    <section id="features" className="wr-section">
      <div className="wr-container">
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>THE PROBLEM</span>
            <h2 className="wr-section-headline" style={{ marginBottom: 24 }}>
              You&apos;re paying for{' '}
              <span className="wr-text-danger">5 tools</span>
              <br />that can&apos;t see each other.
            </h2>
            <p className="wr-sub-headline" style={{ maxWidth: 620, margin: '0 auto' }}>
              Every tool knows <em>something</em>. None of them know <strong style={{ color: '#fff' }}>everything</strong>.
              <br />That gap is where you&apos;re losing money.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="wr-tools-grid">
            {tools.map(tool => (
              <ToolCard key={tool.title} tool={tool} />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <p className="wr-gut-punch">
              None of your tools know what your <span className="wr-text-danger">competitors</span> are doing.
            </p>
            <p className="wr-gut-punch-cta">
              <span className="wr-shimmer">Until now.</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
