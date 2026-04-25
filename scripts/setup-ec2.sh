#!/usr/bin/env bash
# =============================================================================
# setup-ec2.sh — One-shot production setup for bigspice.in on Amazon Linux 2023
#
# Run as ec2-user with sudo privileges:
#   chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
#
# What this script does:
#   1. Hardens the OS (security updates, swap, limits)
#   2. Installs and configures Nginx
#   3. Obtains a Let's Encrypt TLS certificate via Certbot
#   4. Creates a systemd service for Gunicorn
#   5. Opens only ports 22, 80, 443 in iptables
#   6. Enables automatic cert renewal
# =============================================================================

set -euo pipefail

# ── Config — edit these before running ────────────────────────────────────────
DOMAIN="bigspice.in"
EMAIL="admin@bigspice.in"          # Let's Encrypt expiry notifications
APP_DIR="/home/ec2-user/spicetrade"
VENV_DIR="$APP_DIR/ENV"
APP_USER="ec2-user"
GUNICORN_PORT=3000
# ─────────────────────────────────────────────────────────────────────────────

echo "==> [1/6] System update & essential packages"
dnf update -y
dnf install -y \
    nginx \
    python3-pip \
    python3-devel \
    gcc \
    git \
    postgresql15 \
    certbot \
    python3-certbot-nginx

# ── Swap file (useful on t3.micro / t3.small) ─────────────────────────────────
if [ ! -f /swapfile ]; then
    echo "==> Creating 1 GB swap file"
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── File descriptor limits ─────────────────────────────────────────────────────
cat >> /etc/security/limits.conf << 'EOF'
ec2-user  soft  nofile  65536
ec2-user  hard  nofile  65536
nginx     soft  nofile  65536
nginx     hard  nofile  65536
EOF

echo "==> [2/6] Installing Nginx config"
mkdir -p /var/www/certbot

# Copy the Nginx config from the repo
cp "$APP_DIR/nginx/bigspice.in.conf" /etc/nginx/conf.d/bigspice.in.conf

# Remove the default server block shipped with Nginx
rm -f /etc/nginx/conf.d/default.conf

# Replace the default nginx.conf worker_processes / events block for better perf
cat > /etc/nginx/nginx.conf << 'NGINXCONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    server_tokens   off;   # hide Nginx version in headers/errors

    include /etc/nginx/conf.d/*.conf;
}
NGINXCONF

nginx -t
systemctl enable --now nginx

echo "==> [3/6] Obtaining Let's Encrypt certificate"
# Temporarily serve ACME challenges over plain HTTP
# (the Nginx config already serves /.well-known/acme-challenge/ on port 80)

certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Auto-renewal: Certbot installs a systemd timer automatically on AL2023.
# Verify with: systemctl list-timers | grep certbot
# The timer runs "certbot renew" twice daily; Nginx reloads after renewal
# via the deploy hook below.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Reload Nginx now that certs exist (conf references the cert paths)
nginx -t && systemctl reload nginx

echo "==> [4/6] Creating systemd service for Gunicorn"
cat > /etc/systemd/system/spicetrade.service << UNIT
[Unit]
Description=SpiceTrade Gunicorn application server
After=network.target

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment="PATH=$VENV_DIR/bin"
Environment="PORT=$GUNICORN_PORT"
Environment="WEB_CONCURRENCY=3"

# Load secrets from a file outside the repo (never commit creds.json to git)
# EnvironmentFile=$APP_DIR/.env   # uncomment if you use a .env file

ExecStart=$VENV_DIR/bin/gunicorn -c $APP_DIR/gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP \$MAINPID

Restart=always
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=spicetrade

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now spicetrade

echo "==> [5/6] Firewall — allow only SSH (22), HTTP (80), HTTPS (443)"
# Amazon Linux 2023 uses nftables but iptables-legacy is available.
# For EC2 the primary firewall is the Security Group (see README).
# This is a defence-in-depth OS-level firewall.

if command -v firewall-cmd &>/dev/null; then
    systemctl enable --now firewalld
    firewall-cmd --permanent --set-default-zone=drop
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "    firewalld configured"
else
    # Fall back to iptables
    iptables -F
    iptables -A INPUT  -i lo -j ACCEPT
    iptables -A INPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT
    iptables -A INPUT  -p tcp --dport 22   -j ACCEPT
    iptables -A INPUT  -p tcp --dport 80   -j ACCEPT
    iptables -A INPUT  -p tcp --dport 443  -j ACCEPT
    iptables -A INPUT  -j DROP
    iptables -A OUTPUT -j ACCEPT
    # Persist rules across reboots
    dnf install -y iptables-services
    service iptables save
    systemctl enable iptables
    echo "    iptables configured"
fi

echo "==> [6/6] Status check"
systemctl status spicetrade --no-pager
systemctl status nginx --no-pager

echo ""
echo "✓ Setup complete!"
echo "  App:   https://$DOMAIN"
echo "  Cert:  $(certbot certificates 2>/dev/null | grep 'Expiry Date' | head -1)"
echo ""
echo "Useful commands:"
echo "  sudo systemctl restart spicetrade   # restart Gunicorn"
echo "  sudo systemctl reload nginx         # reload Nginx config"
echo "  sudo journalctl -u spicetrade -f    # tail app logs"
echo "  sudo certbot renew --dry-run        # test cert renewal"
