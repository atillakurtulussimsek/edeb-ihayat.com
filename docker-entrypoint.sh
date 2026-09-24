#!/bin/sh
set -e
echo "» Veritabanı migrasyonları uygulanıyor…"
node node_modules/prisma/build/index.js migrate deploy
echo "» Uygulama başlatılıyor"
exec node server.js
