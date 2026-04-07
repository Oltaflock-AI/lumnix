-- Beta invite codes system
CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan TEXT DEFAULT 'beta',        -- plan to grant: 'beta', 'starter', 'growth'
  max_uses INT,                    -- null = unlimited
  uses INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by TEXT,                 -- admin email who created it
  note TEXT,                       -- internal note ("agency batch", "twitter promo")
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beta_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES beta_invites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beta_invites_code ON beta_invites(code);
CREATE INDEX idx_beta_redemptions_invite ON beta_redemptions(invite_id);

ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_redemptions ENABLE ROW LEVEL SECURITY;

-- Service role only (admin access)
CREATE POLICY "beta_invites_service" ON beta_invites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "beta_redemptions_service" ON beta_redemptions FOR ALL USING (true) WITH CHECK (true);

-- Seed some initial beta invite codes
INSERT INTO beta_invites (code, plan, max_uses, note) VALUES
  ('LUMNIX-BETA-2026', 'beta', 100, 'General beta access code'),
  ('AGENCY-VIP', 'growth', 10, 'VIP agency partners'),
  ('EARLY-BIRD', 'starter', 50, 'Early bird access')
ON CONFLICT (code) DO NOTHING;
