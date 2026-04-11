'use client';
import { CreditCard } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { BillingTab } from '@/app/dashboard/settings/page';

export default function BillingPage() {
  return (
    <PageShell
      title="Billing"
      description="Manage your plan, payment method, and redeem codes"
      icon={CreditCard}
    >
      <BillingTab />
    </PageShell>
  );
}
