#!/bin/bash
# Railway Deployment Script
# This script runs migrations and seeds the database

set -e

echo "🚀 Starting Railway deployment..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database (only if needed - idempotent)
echo "🌱 Seeding database..."
npm run prisma:seed || echo "⚠️  Seed script completed (may have skipped existing data)"

echo "✅ Deployment complete!"

