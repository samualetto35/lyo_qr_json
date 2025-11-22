#!/bin/bash
# Railway Migration Script
# Bu script'i Railway Terminal'de çalıştırın

set -e

echo "🚀 Starting Railway migration..."

cd backend || { echo "❌ backend directory not found"; exit 1; }

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🗄️  Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run prisma:seed || echo "⚠️  Seed completed (may have skipped existing data)"

echo "✅ Migration completed successfully!"

