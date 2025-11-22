#!/bin/bash
# Railway Seed Script
# Login sonrası çalıştırın: bash railway_seed.sh

echo "🌱 Railway'de seed data çalıştırılıyor..."

railway run --service lyo_qr_json -- cd backend && npm run prisma:seed

echo "✅ Seed tamamlandı!"

