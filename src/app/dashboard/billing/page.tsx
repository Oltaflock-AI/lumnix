'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api-fetch';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { PageShell } from '@/components/PageShell';
import { Check, CreditCard, Receipt, Plus, Ticket } from 'lucide-react';

type SubInfo = {
  type: 'free' | 'active' | 'coupon';
  plan: string;
  started_at?: string;
  expires_at?: string;
  days_left?: number;
  is_expired?: boolean;
};

type PlanKey = 'free' | 'starter' | 'growth' | 'agency';

const PLANS: Array<{
  key: PlanKey;
  name: string;
  price: string;
  priceSub: string;
  tagline: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    key: 'free',
    name: 'Free',
    price: '₹0',
    priceSub: '/mo',
    tagline: 'For solo founders testing the waters',
    features: ['2 integrations', '30-day data retention', '2 team members', 'Basic insights'],
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '₹2,499',
    priceSub: '/mo',
    tagline: 'For growing brands shipping fast',
    features: ['4 integrations', '90-day data retention', '5 team members', 'AI insights', 'PDF reports'],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: '₹6,499',
    priceSub: '/mo',
    tagline: 'For scaling teams who need AI throughout',
    features: ['All integrations', '1-year data retention', '15 team members', 'AI insights + chat', 'White-label reports', 'Competitor tracking'],
    popular: true,
  },
  {
    key: 'agency',
    name: 'Agency',
    price: '₹16,499',
    priceSub: '/mo',
    tagline: 'For agencies running multi-brand ops',
    features: ['Unlimited integrations', 'Unlimited data retention', 'Unlimited team members', 'Everything in Growth', 'Multi-workspace', 'Priority support', 'API access'],
  },
];

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function BillingPage() {
  const { workspace } = useWorkspaceCtx();
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!workspace?.id) return;
    let cancelled = false;
    async function fetchSub() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        const res = await apiFetch(`/api/billing/subscription?workspace_id=${workspace!.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok && !cancelled) {
          const d = await res.json();
          setSubInfo(d);
        } else if (!cancelled) {
          setError('Could not load subscription');
        }
      } catch {
        if (!cancelled) setError('Could not load subscription');
      }
      if (!cancelled) setLoading(false);
    }
    fetchSub();
    return () => { cancelled = true; };
  }, [workspace?.id]);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!coupon.trim() || !workspace?.id) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const res = await apiFetch('/api/billing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: coupon.trim(), workspace_id: workspace.id }),
      });
      const d = await res.json();
      if (!res.ok) {
        setRedeemMsg({ kind: 'error', text: d.error || 'Could not redeem code' });
      } else {
        setRedeemMsg({ kind: 'success', text: `Unlocked ${String(d.plan || '').toUpperCase()} plan. Refreshing…` });
        setCoupon('');
        setTimeout(() => window.location.reload(), 900);
      }
    } catch (err) {
      setRedeemMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Could not redeem code' });
    } finally {
      setRedeeming(false);
    }
  }

  const currentPlan = (subInfo?.plan || 'free') as PlanKey;
  const isActive = subInfo?.type === 'active' || (subInfo?.type === 'coupon' && !subInfo?.is_expired);

  if (loading) {
    return (
      <PageShell
        title="Billing &"
        titleAccent="Plan"
        description="Manage your plan, payment method, and redeem codes"
      >
        <div className="lx-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading billing information…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Billing &"
      titleAccent="Plan"
      description="Manage your plan, payment method, and redeem codes"
    >
      {error && (
        <div className="lx-card" style={{ marginBottom: 16, borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* === SUBSCRIPTION HERO ============================================ */}
      <div
        className="lx-card reveal-on-scroll"
        style={{
          marginBottom: 28,
          padding: 32,
          background:
            'linear-gradient(135deg, rgba(255,0,102,0.10) 0%, rgba(255,0,102,0.02) 60%, transparent 100%)',
          borderColor: 'rgba(255,0,102,0.22)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={16} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--text)',
              }}
            >
              Subscription
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              borderRadius: 99,
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              border: '1px solid rgba(255,0,102,0.25)',
            }}
          >
            {currentPlan} Plan
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <StatCell
            label="Status"
            value={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: isActive ? 'var(--success)' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 0 0 4px rgba(16,185,129,0.15)' : 'none',
                  }}
                />
                {isActive ? 'Active' : 'Free'}
              </span>
            }
          />
          <StatCell
            label="Active Until"
            value={subInfo?.expires_at ? formatDate(subInfo.expires_at) : '—'}
          />
          <StatCell
            label="Days Left"
            value={
              subInfo?.type === 'coupon' && typeof subInfo.days_left === 'number'
                ? `${subInfo.days_left} days`
                : isActive
                  ? 'Ongoing'
                  : '—'
            }
          />
        </div>
      </div>

      {/* === PLANS GRID =================================================== */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}
        >
          Choose your plan
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Upgrade, downgrade, or cancel any time.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {PLANS.map((p) => (
          <PlanCard key={p.key} plan={p} isCurrent={currentPlan === p.key} />
        ))}
      </div>

      {/* === PAYMENT METHODS ============================================== */}
      <div className="lx-card reveal-on-scroll" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={14} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text)',
            }}
          >
            Payment Methods
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Add a card or UPI for automatic renewals and upgrades.
        </div>

        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 12,
            padding: '32px 20px',
            textAlign: 'center',
            background: 'var(--elevated)',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <CreditCard size={22} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 6,
            }}
          >
            No payment method added
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 18px' }}>
            Add a debit card, credit card, or UPI to enable automatic renewals when your plan expires.
          </div>
          <button
            className="lx-btn-primary"
            disabled
            title="Razorpay integration coming soon"
            style={{ opacity: 0.55, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={14} />
            Add Payment Method
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            Razorpay checkout — coming soon
          </div>
        </div>
      </div>

      {/* === BILLING HISTORY ============================================== */}
      <div className="lx-card reveal-on-scroll" style={{ marginBottom: 24, padding: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={14} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'var(--text)',
                }}
              >
                Billing History
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Invoices will appear here after your first paid cycle.
              </div>
            </div>
          </div>
          <button
            className="lx-btn-outline"
            disabled
            style={{ opacity: 0.55, cursor: 'not-allowed' }}
            title="No invoices yet"
          >
            View Invoices
          </button>
        </div>
      </div>

      {/* === COUPON CODE ================================================== */}
      <div
        className="lx-card reveal-on-scroll"
        style={{
          padding: 24,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.06) 0%, transparent 100%)',
          borderColor: 'rgba(0,212,170,0.20)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(0,212,170,0.12)',
              color: 'var(--secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ticket size={14} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text)',
            }}
          >
            Have a coupon code?
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Enter your early access or promo code to unlock a plan.
        </div>

        <form onSubmit={handleRedeem} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="e.g. EARLYACCESS"
            disabled={redeeming}
            style={{
              flex: '1 1 240px',
              minWidth: 200,
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--elevated)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              letterSpacing: '0.06em',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="lx-btn-primary"
            disabled={redeeming || !coupon.trim()}
            style={{ height: 44, paddingInline: 20, opacity: redeeming || !coupon.trim() ? 0.6 : 1 }}
          >
            {redeeming ? 'Redeeming…' : 'Apply Code'}
          </button>
        </form>

        {redeemMsg && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              background: redeemMsg.kind === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
              color: redeemMsg.kind === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${redeemMsg.kind === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            {redeemMsg.text}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: 14,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
}: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
}) {
  const accentBorder = isCurrent
    ? '1px solid rgba(255,0,102,0.45)'
    : plan.popular
      ? '1px solid rgba(255,0,102,0.28)'
      : '1px solid var(--border)';
  const accentBg = isCurrent
    ? 'linear-gradient(160deg, rgba(255,0,102,0.10) 0%, transparent 70%)'
    : plan.popular
      ? 'linear-gradient(160deg, rgba(255,0,102,0.05) 0%, transparent 70%)'
      : 'var(--card)';

  return (
    <div
      className="lx-card lx-card-interactive"
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: accentBorder,
        background: accentBg,
        minHeight: 360,
      }}
    >
      {plan.popular && !isCurrent && (
        <div
          style={{
            position: 'absolute',
            top: -11,
            left: 20,
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '5px 10px',
            borderRadius: 99,
            background: 'var(--primary)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(255,0,102,0.4)',
          }}
        >
          Most Popular
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}
      >
        {plan.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
          }}
        >
          {plan.price}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{plan.priceSub}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, minHeight: 32 }}>
        {plan.tagline}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {plan.features.map((f) => (
          <div
            key={f}
            style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-sec)' }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 99,
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Check size={11} strokeWidth={3} />
            </div>
            {f}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {isCurrent ? (
          <div
            style={{
              width: '100%',
              height: 40,
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              border: '1px solid rgba(255,0,102,0.25)',
            }}
          >
            <Check size={14} strokeWidth={3} />
            Current Plan
          </div>
        ) : (
          <button
            className="lx-btn-outline"
            disabled
            title="Razorpay integration coming soon"
            style={{ width: '100%', height: 40, opacity: 0.55, cursor: 'not-allowed' }}
          >
            {plan.key === 'free' ? 'Downgrade' : 'Upgrade'}
          </button>
        )}
      </div>
    </div>
  );
}
