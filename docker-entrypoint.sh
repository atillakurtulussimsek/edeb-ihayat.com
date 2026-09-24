#!/bin/sh
set -e
: "${DATABASE_URL:?DATABASE_URL tanımlı değil}"
echo "» Veritabanı migrasyonları uygulanıyor…"
node node_modules/prisma/build/index.js migrate deploy
echo "» Uygulama başlatılıyor (port ${PORT:-3000})"
exec node server.js
