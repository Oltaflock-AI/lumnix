#!/usr/bin/env bash
# Provision a fresh Ubuntu VPS (Oracle Cloud Always-Free ARM, or any x86 box)
# as the ad-spy worker: Node 20 + Chromium + ffmpeg + the queue daemon.
#
# Usage (as a sudo-capable user on the VPS):
#   curl -fsSL https://raw.githubusercontent.com/Oltaflock-AI/lumnix/main/tools/vps_bootstrap.sh | bash
#   # …or copy this file over and: bash vps_bootstrap.sh
#
# Repo is public — no PAT needed. After it finishes, drop secrets into
# /opt/lumnix/.env.local (it prints the template) and:
#   sudo systemctl restart lumnix-spy
set -euo pipefail

APP_DIR="/opt/lumnix"
SERVICE="lumnix-spy"
NODE_MAJOR=20
REPO_URL="${REPO_URL:-https://github.com/Oltaflock-AI/lumnix.git}"

log() { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }

# ── system packages ─────────────────────────────────────────────────────────
log "apt update + base packages (ffmpeg, git, curl, ca-certificates)"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ffmpeg git curl ca-certificates gnupg

# ── Node 20 (NodeSource) ────────────────────────────────────────────────────
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  log "installing Node $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi
log "node $(node -v), npm $(npm -v)"

# ── clone / update repo ─────────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "repo exists — pulling latest"
  sudo git -C "$APP_DIR" pull --ff-only
else
  if [ -z "$REPO_URL" ]; then
    echo "REPO_URL empty and $APP_DIR has no repo. Set REPO_URL and re-run." >&2
    exit 1
  fi
  log "cloning into $APP_DIR"
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER:$USER" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi
sudo chown -R "$USER:$USER" "$APP_DIR"
cd "$APP_DIR"

# ── deps + Chromium (with system libs) ──────────────────────────────────────
log "npm ci"
npm ci --no-audit --no-fund
log "playwright chromium + system deps"
npx playwright install --with-deps chromium

# ── .env.local template (do not overwrite existing) ─────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  cat > "$APP_DIR/.env.local" <<'ENV'
# Fill these in, then: sudo systemctl restart lumnix-spy
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
# Residential proxy so Meta doesn't soft-block the datacenter IP.
# Format: http://user:pass@host:port  (IPRoyal / Rayobyte pay-as-you-go)
SCRAPER_PROXY=
ENV
  log "wrote $APP_DIR/.env.local template — FILL IT IN"
fi

# ── systemd service: queue daemon, auto-restart ─────────────────────────────
log "installing systemd service $SERVICE"
sudo tee "/etc/systemd/system/${SERVICE}.service" >/dev/null <<UNIT
[Unit]
Description=Lumnix ad-spy queue worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env.local
ExecStart=/usr/bin/node $APP_DIR/tools/spy_pipeline.mjs queue --interval 15
Restart=always
RestartSec=10
# scrape/analyze are CPU-bursty; let them breathe but don't OOM the box
MemoryMax=4G

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE"

log "done. Next:"
echo "  1. edit $APP_DIR/.env.local (Supabase keys, ANTHROPIC_API_KEY, SCRAPER_PROXY)"
echo "  2. sudo systemctl restart $SERVICE"
echo "  3. journalctl -u $SERVICE -f   # watch it drain the queue"
