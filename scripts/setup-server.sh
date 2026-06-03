#!/bin/bash
# Запустити один раз на сервері: bash setup-server.sh

set -e

echo "=== 1. Встановлення Node.js 22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "=== 2. Встановлення PM2 ==="
npm install -g pm2

echo "=== 3. Встановлення Caddy ==="
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

echo "=== 4. Клонування репозиторію ==="
mkdir -p /opt/crossyarn
git clone https://github.com/Puzozo/crossyarn.git /opt/crossyarn
cd /opt/crossyarn

echo "=== 5. Налаштування .env ==="
cp .env.example .env
# Генеруємо безпечний AUTH_SECRET
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
sed -i "s/replace-with-a-long-random-string/$SECRET/" .env
echo "DATABASE_URL=file:/opt/crossyarn/prisma/prod.db" >> /dev/null
sed -i "s|file:./dev.db|file:/opt/crossyarn/prisma/prod.db|" .env

echo "=== 6. Встановлення залежностей та збірка ==="
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build

echo "=== 7. Налаштування Caddy ==="
cp /opt/crossyarn/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy

echo "=== 8. Запуск через PM2 ==="
cd /opt/crossyarn
PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name crossyarn
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "=== Готово! Сайт доступний на https://crossyarn.online ==="
