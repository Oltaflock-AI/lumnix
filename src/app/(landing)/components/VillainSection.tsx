'use client';

import { Search, BarChart2, Megaphone } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const tools = [
  {
    color: '#34A853', title: 'Google Search Console',
    Icon: Search,
    knows: 'Your keyword "promunch" ranks #1',
    blind: 'Has no idea you\'re paying ₹4,200/mo to bid on the same keyword in Google Ads',
    cost: '₹0/mo spent here',
  },
  {
    color: '#E37400', title: 'Google Analytics 4',
    Icon: BarChart2,
    knows: 'Sessions dropped 25% last week',
    blind: 'Can\'t tell you it\'s because Mamaearth launched 12 new ads targeting your audience on Tuesday',
    cost: '₹0/mo but 3hrs/week exporting CSVs',
  },
  {
    color: '#1877F2', title: 'Meta Ads Manager',
    Icon: Megaphone,
    knows: 'You spent ₹8,159 this month',
    blind: 'Doesn\'t know your competitors are spending 10x and stealing your audience with hooks you\'ve never seen',
    cost: '₹8,159/mo and climbing',
  },
];

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
              <div key={tool.title} className="wr-pain-card">
                <div className="wr-tool-header">
                  <div className="wr-tool-icon" style={{ background: `${tool.color}20`, borderColor: `${tool.color}30` }}>
                    <tool.Icon size={20} color={tool.color} />
                  </div>
                  <span className="wr-tool-name">{tool.title}</span>
                </div>

                <div className="wr-tool-knows">
                  <div className="wr-tool-tag wr-tool-tag--green">KNOWS</div>
                  <p className="wr-tool-detail">{tool.knows}</p>
                </div>

                <div className="wr-tool-blind">
                  <div className="wr-tool-tag wr-tool-tag--red">BLIND TO</div>
                  <p className="wr-tool-detail wr-text-secondary">{tool.blind}</p>
                </div>

                <p className="wr-tool-cost">{tool.cost}</p>
              </div>
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
