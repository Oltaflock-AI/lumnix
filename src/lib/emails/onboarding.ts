// Onboarding email sequence for Lumnix
// Brand colors: accent #6366F1 (indigo), dark bg #0A0A0A, card #111111, text #E5E5E5

const BRAND = {
  accent: '#6366F1',
  accentLight: '#818CF8',
  bg: '#0A0A0A',
  card: '#111111',
  cardBorder: '#222222',
  text: '#E5E5E5',
  textMuted: '#888888',
  success: '#10B981',
  warning: '#F59E0B',
};

function baseTemplate(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
  </style>
  <!--<![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND.bg}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: ${BRAND.card}; border: 1px solid ${BRAND.cardBorder}; border-radius: 16px; padding: 36px; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentLight}); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; }
    .btn-outline { display: inline-block; padding: 12px 28px; border: 1px solid ${BRAND.cardBorder}; color: ${BRAND.text} !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; }
    .feature-card { background-color: ${BRAND.bg}; border: 1px solid ${BRAND.cardBorder}; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }
    h1, h2, h3 { color: ${BRAND.text}; margin: 0; }
    p { color: ${BRAND.textMuted}; line-height: 1.7; margin: 0 0 16px; font-size: 15px; }
    a { color: ${BRAND.accent}; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .divider { border: none; border-top: 1px solid ${BRAND.cardBorder}; margin: 24px 0; }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <div class="container">
    ${content}
    <!-- Footer -->
    <div style="text-align: center; padding: 24px 0;">
      <p style="font-size: 12px; color: ${BRAND.textMuted};">
        <span style="font-size: 16px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: ${BRAND.accent};">L</span>umnix</span>
        <br>AI-Powered Marketing Intelligence
        <br><br>
        <a href="https://lumnix-ai.vercel.app" style="color: ${BRAND.textMuted}; text-decoration: none;">lumnix-ai.vercel.app</a>
        &nbsp;·&nbsp;
        <a href="https://lumnix-ai.vercel.app/privacy" style="color: ${BRAND.textMuted}; text-decoration: none;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="mailto:khush@oltaflock.ai" style="color: ${BRAND.textMuted}; text-decoration: none;">Support</a>
        <br><br>
        © 2026 Oltaflock AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmail(userName: string): { subject: string; html: string } {
  const firstName = userName?.split(' ')[0] || 'there';
  return {
    subject: "Welcome to Lumnix — let's replace your 6 dashboards 🚀",
    html: baseTemplate(`
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 28px; font-weight: 800; letter-spacing: -1px; color: ${BRAND.text};">
          <span style="color: ${BRAND.accent};">L</span>umnix
        </div>
      </div>

      <div class="card">
        <div class="badge" style="background: rgba(99,102,241,0.12); color: ${BRAND.accent}; margin-bottom: 20px;">
          🎉 Welcome to Lumnix
        </div>
        
        <h1 style="font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 16px;">
          Hey ${firstName}, you're in!
        </h1>
        
        <p>
          You just joined the future of marketing intelligence. Lumnix unifies GA4, Search Console, Google Ads, and Meta Ads into one AI-powered dashboard — so you can stop tab-switching and start making decisions.
        </p>

        <p>Here's what you can do right now:</p>

        <hr class="divider">

        <!-- Step 1 -->
        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(99,102,241,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${BRAND.accent}; font-weight: 700; font-size: 15px;">1</div>
          <div>
            <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">Connect your data sources</h3>
            <p style="font-size: 14px; margin: 0;">Go to Settings → Integrations and connect GA4, Search Console, or Meta Ads. Takes 30 seconds per source.</p>
          </div>
        </div>

        <!-- Step 2 -->
        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16,185,129,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${BRAND.success}; font-weight: 700; font-size: 15px;">2</div>
          <div>
            <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">Hit Sync Now</h3>
            <p style="font-size: 14px; margin: 0;">Once connected, click Sync Now on any dashboard page. Your data will populate in seconds.</p>
          </div>
        </div>

        <!-- Step 3 -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(245,158,11,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${BRAND.warning}; font-weight: 700; font-size: 15px;">3</div>
          <div>
            <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">Explore your dashboard</h3>
            <p style="font-size: 14px; margin: 0;">Check Analytics, SEO, Meta Ads, and Competitors. Everything updates in real-time.</p>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="https://lumnix-ai.vercel.app/dashboard" class="btn">Open your dashboard →</a>
        </div>
      </div>

      <!-- What's coming -->
      <div class="card" style="border-color: rgba(99,102,241,0.2);">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">What you'll get over the next few days:</h2>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="color: ${BRAND.accent};">📊</span>
          <p style="margin: 0; font-size: 14px;"><strong style="color: ${BRAND.text};">Tomorrow:</strong> Deep dive into AI features — anomaly detection, competitor intel, automated reports</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: ${BRAND.accent};">🚀</span>
          <p style="margin: 0; font-size: 14px;"><strong style="color: ${BRAND.text};">Day 5:</strong> Power user tips + how to get the most out of Lumnix</p>
        </div>
      </div>
    `, 'Welcome to Lumnix — your unified marketing dashboard is ready'),
  };
}

export function featuresEmail(userName: string): { subject: string; html: string } {
  const firstName = userName?.split(' ')[0] || 'there';
  return {
    subject: "Your unfair advantage: 3 Lumnix features most people miss 🧠",
    html: baseTemplate(`
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 28px; font-weight: 800; letter-spacing: -1px; color: ${BRAND.text};">
          <span style="color: ${BRAND.accent};">L</span>umnix
        </div>
      </div>

      <div class="card">
        <div class="badge" style="background: rgba(99,102,241,0.12); color: ${BRAND.accent}; margin-bottom: 20px;">
          📊 Feature Deep Dive
        </div>

        <h1 style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 16px;">
          ${firstName}, most dashboards show data.<br>Lumnix shows <span style="color: ${BRAND.accent};">intelligence</span>.
        </h1>
        
        <p>Here are 3 features that separate Lumnix from everything else you've tried:</p>

        <hr class="divider">

        <!-- Feature 1 -->
        <div class="feature-card">
          <div class="badge" style="background: rgba(239,68,68,0.12); color: #EF4444; margin-bottom: 12px;">🔍 AI Anomaly Detection</div>
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Catch problems before your clients do</h3>
          <p style="font-size: 14px;">
            Lumnix learns your traffic patterns and flags unusual drops or spikes automatically. A 20% dip that's normal for Sundays won't trigger an alert — but the same dip on a Tuesday will.
          </p>
          <p style="font-size: 13px; color: ${BRAND.accent}; margin: 0;">
            → Set up alerts in Settings → Alerts
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="feature-card">
          <div class="badge" style="background: rgba(99,102,241,0.12); color: ${BRAND.accent}; margin-bottom: 12px;">👁️ Competitor Ad Spy</div>
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">See what your competitors are running</h3>
          <p style="font-size: 14px;">
            Add any competitor brand and we'll pull their active Meta ads, analyze their messaging patterns, identify their hooks, and suggest counter-strategies. All powered by the Meta Ad Library.
          </p>
          <p style="font-size: 13px; color: ${BRAND.accent}; margin: 0;">
            → Try it at Competitors → Add a brand → Scrape
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="feature-card">
          <div class="badge" style="background: rgba(16,185,129,0.12); color: ${BRAND.success}; margin-bottom: 12px;">📄 Auto-Generated Reports</div>
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Monday morning reports, delivered Sunday night</h3>
          <p style="font-size: 14px;">
            Branded PDF reports with AI-written executive summaries, charts, and recommendations. Schedule them weekly or monthly — they generate automatically and land in your inbox (or your client's).
          </p>
          <p style="font-size: 13px; color: ${BRAND.accent}; margin: 0;">
            → Generate one at Reports → Generate Report
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://lumnix-ai.vercel.app/dashboard" class="btn">Explore features →</a>
        </div>
      </div>

      <div style="text-align: center; padding: 16px;">
        <p style="font-size: 14px;">
          <strong style="color: ${BRAND.text};">Coming in 3 days:</strong> Power user tips to get 10x more value from Lumnix
        </p>
      </div>
    `, '3 Lumnix features most people miss — AI anomaly detection, competitor spy, auto-reports'),
  };
}

export function powerTipsEmail(userName: string): { subject: string; html: string } {
  const firstName = userName?.split(' ')[0] || 'there';
  return {
    subject: "5 power moves to get 10x more from Lumnix ⚡",
    html: baseTemplate(`
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 28px; font-weight: 800; letter-spacing: -1px; color: ${BRAND.text};">
          <span style="color: ${BRAND.accent};">L</span>umnix
        </div>
      </div>

      <div class="card">
        <div class="badge" style="background: rgba(245,158,11,0.12); color: ${BRAND.warning}; margin-bottom: 20px;">
          ⚡ Power User Guide
        </div>

        <h1 style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 16px;">
          ${firstName}, here's how the pros use Lumnix
        </h1>
        
        <p>You've been with us for a few days. Here are 5 moves that separate casual users from power users:</p>

        <hr class="divider">

        <!-- Tip 1 -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">
            <span style="color: ${BRAND.accent};" class="mono">01</span> &nbsp;Connect ALL your sources
          </h3>
          <p style="font-size: 14px;">GA4 + GSC + Meta Ads together gives you the full picture. Each source alone is just a piece. Together, they tell the real story of your marketing performance.</p>
        </div>

        <!-- Tip 2 -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">
            <span style="color: ${BRAND.accent};" class="mono">02</span> &nbsp;Set up anomaly alerts
          </h3>
          <p style="font-size: 14px;">Go to Settings → Alerts and create rules for traffic drops, ranking changes, and spend anomalies. You'll catch issues in hours instead of days.</p>
        </div>

        <!-- Tip 3 -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">
            <span style="color: ${BRAND.accent};" class="mono">03</span> &nbsp;Track at least 3 competitors
          </h3>
          <p style="font-size: 14px;">The Competitor Ad Spy works best with 3-5 competitors. Add their Facebook page names and domains. Run AI Analysis to get hook patterns and counter-strategies.</p>
        </div>

        <!-- Tip 4 -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">
            <span style="color: ${BRAND.accent};" class="mono">04</span> &nbsp;Schedule weekly reports
          </h3>
          <p style="font-size: 14px;">Auto-generate branded PDF reports every Monday. If you're an agency, white-label them with your client's branding. Your clients will think you hired a data team.</p>
        </div>

        <!-- Tip 5 -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">
            <span style="color: ${BRAND.accent};" class="mono">05</span> &nbsp;Use the SEO + Analytics pages together
          </h3>
          <p style="font-size: 14px;">Cross-reference your GSC ranking data with GA4 traffic patterns. When a keyword ranking drops and traffic follows, you know exactly what to fix.</p>
        </div>

        <hr class="divider">

        <div style="text-align: center;">
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Ready to go all in?</h2>
          <p style="margin-bottom: 24px;">Upgrade to Growth or Agency for AI anomaly detection, competitor tracking, white-label reports, and more.</p>
          <a href="https://lumnix-ai.vercel.app/dashboard/settings" class="btn" style="margin-right: 12px;">View plans →</a>
        </div>
      </div>

      <div style="text-align: center; padding: 16px;">
        <p style="font-size: 14px;">
          Questions? Reply to this email or reach out at <a href="mailto:khush@oltaflock.ai">khush@oltaflock.ai</a>. We read every message.
        </p>
      </div>
    `, '5 power moves to get 10x more from Lumnix — connect sources, set alerts, track competitors'),
  };
}
