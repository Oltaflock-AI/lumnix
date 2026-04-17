'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api-fetch';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { Check, Download } from 'lucide-react';

type SubInfo = {
  type: 'free' | 'active' | 'coupon';
  plan: string;
  started_at?: string;
  expires_at?: string;
  days_left?: number;
  is_expired?: boolean;
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['1 Workspace', '5K API Calls', '1 Team Member', 'Core Integrations'],
  starter: ['2 Workspaces', '25K API Calls', '3 Team Members', 'All Integrations', 'Email Support'],
  pro: ['5 Workspaces', '50K API Calls', '10 Team Members', 'All Integrations', 'Priority Support'],
  enterprise: ['Unlimited Workspaces', 'Unlimited API Calls', 'Unlimited Team', 'All Integrations', 'Dedicated Support', 'SSO + Audit Logs'],
};

const PLAN_PRICE: Record<string, string> = {
  free: '$0/mo',
  starter: '$29/mo',
  pro: '$99/mo',
  enterprise: 'Contact sales',
};

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

  const plan = subInfo?.plan || 'free';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  const price = PLAN_PRICE[plan] || '$0/mo';

  let renewalLine = '';
  if (subInfo?.type === 'coupon' && subInfo.expires_at) {
    renewalLine = subInfo.is_expired
      ? `Expired ${formatDate(subInfo.expires_at)}`
      : `Coupon access · ${subInfo.days_left} days left · expires ${formatDate(subInfo.expires_at)}`;
  } else if (subInfo?.type === 'active') {
    renewalLine = `${price} · Active subscription`;
  } else {
    renewalLine = `${price} · Upgrade to unlock more`;
  }

  if (loading) {
    return (
      <div className="lx-content">
        <div className="lx-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading billing information…
        </div>
      </div>
    );
  }

  return (
    <div className="lx-content">
      <div className="lx-welcome">
        <h1>Billing & <span>Plan</span></h1>
        <div className="lx-welcome-sub">
          <span className="lx-welcome-dot"></span>
          Manage your plan, usage, and payments
        </div>
      </div>

      {error && (
        <div className="lx-card" style={{ marginBottom: 16, borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Plan hero */}
      <div className="lx-card" style={{ marginBottom: 24, padding: 32, background: 'linear-gradient(135deg, rgba(255,0,102,0.08) 0%, rgba(123,97,255,0.04) 100%)', borderColor: 'rgba(255,0,102,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current plan</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{planLabel} Plan</div>
            <div style={{ fontSize: 14, color: 'var(--text-sec)', marginTop: 6 }}>{renewalLine}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {features.map(f => (
                <div key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--elevated)', fontSize: 12, fontWeight: 500, color: 'var(--text-sec)' }}>
                  <Check size={12} style={{ color: 'var(--primary)' }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <button className="lx-btn-outline" disabled title="Razorpay integration coming soon" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              Change plan
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Razorpay checkout — coming soon</span>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Usage this cycle</div>
      <div className="lx-kpi-grid" style={{ marginBottom: 24 }}>
        <UsageCard label="API Calls" used="—" limit={planLimits(plan).api} />
        <UsageCard label="Workspaces" used="—" limit={planLimits(plan).workspaces} />
        <UsageCard label="Team Members" used="—" limit={planLimits(plan).team} />
      </div>

      {/* Payment method */}
      <div className="lx-card" style={{ marginBottom: 24 }}>
        <div className="lx-card-header"><span className="lx-card-title">Payment method</span></div>
        <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          No payment method on file. Add one when you upgrade via Razorpay.
        </div>
      </div>

      {/* Invoice history */}
      <div className="lx-card">
        <div className="lx-card-header"><span className="lx-card-title">Invoice history</span></div>
        <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          Invoices will appear here after your first paid cycle.
        </div>
      </div>
    </div>
  );
}

function planLimits(plan: string) {
  const map: Record<string, { api: string; workspaces: string; team: string }> = {
    free: { api: '5K', workspaces: '1', team: '1' },
    starter: { api: '25K', workspaces: '2', team: '3' },
    pro: { api: '50K', workspaces: '5', team: '10' },
    enterprise: { api: '∞', workspaces: '∞', team: '∞' },
  };
  return map[plan] || map.free;
}

function UsageCard({ label, used, limit }: { label: string; used: string; limit: string }) {
  return (
    <div className="lx-kpi-card">
      <div className="lx-kpi-top">
        <span className="lx-kpi-label">{label}</span>
      </div>
      <div className="lx-kpi-value" style={{ fontSize: 28 }}>{used}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}> / {limit}</span></div>
      <div style={{ height: 6, background: 'var(--elevated)', borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '0%', background: 'var(--primary)', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Usage tracking coming soon</div>
    </div>
  );
}
