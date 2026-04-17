-- ============================================================================
-- Drop Stripe columns from workspaces
-- Created: 2026-04-17
-- Reason: Lumnix billing provider swapped to Razorpay. Stripe columns unused.
-- Safe to re-run: uses IF EXISTS.
-- ============================================================================

BEGIN;

ALTER TABLE workspaces DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS stripe_subscription_id;

COMMIT;
