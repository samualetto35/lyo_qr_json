# Railway Migration Guide

## 🚀 Running Migrations on Railway

Migration dosyaları GitHub'a push edildi. Şimdi Railway production database'inde migration'ları çalıştırmanız gerekiyor.

### Yöntem 1: Railway Terminal (Önerilen)

1. **Railway Dashboard'a gidin**
   - https://railway.app → Projeniz → Backend Service

2. **Terminal'i açın**
   - Service sayfasında "Deployments" sekmesine gidin
   - En son deployment'ın yanında "..." menüsüne tıklayın
   - "Open Shell" veya "Terminal" seçeneğini seçin

3. **Migration komutlarını çalıştırın**
   ```bash
   # Prisma Client generate
   npx prisma generate
   
   # Migration'ları çalıştır (production-safe)
   npx prisma migrate deploy
   
   # Seed data ekle (default admin/teacher)
   npm run prisma:seed
   ```

### Yöntem 2: Deployment Script (Otomatik)

Railway'de build command'ı güncelleyin:

**Railway Dashboard → Service → Settings → Build Command:**
```bash
npm run build:with-migration
```

Bu komut:
- Backend'i build eder
- Prisma Client generate eder
- Migration'ları otomatik çalıştırır

**Start Command:**
```bash
npm run start:prod
```

### Yöntem 3: Railway CLI (Eğer yüklüyse)

```bash
railway run npx prisma migrate deploy
railway run npm run prisma:seed
```

---

## ✅ Migration Sonrası Kontrol

Migration başarılı olduktan sonra:

1. **Database tablolarını kontrol edin:**
   ```bash
   npx prisma studio
   ```

2. **Backend loglarını kontrol edin:**
   - Railway Dashboard → Service → Logs
   - "Database connection successful" mesajını görmelisiniz

3. **API endpoint'lerini test edin:**
   - `GET /api/v1/health` (eğer varsa)
   - `POST /api/v1/auth/admin/login` (default admin ile)

---

## 🔧 Troubleshooting

### Migration hatası: "relation does not exist"
- Migration'lar henüz çalıştırılmamış
- `npx prisma migrate deploy` komutunu çalıştırın

### Migration hatası: "migration already applied"
- Migration'lar zaten çalıştırılmış
- Bu normal, devam edebilirsiniz

### Seed hatası: "duplicate key"
- Default admin/teacher zaten var
- Bu normal, seed idempotent (tekrar çalıştırılabilir)

---

## 📝 Notlar

- **İlk deployment:** Migration'ları mutlaka çalıştırın
- **Sonraki deployment'lar:** Migration'lar otomatik çalışır (migrate deploy)
- **Seed script:** Sadece ilk deployment'ta çalıştırın (idempotent)

---

## 🎯 Hızlı Başlangıç

Railway terminal'de tek komut:
```bash
npm run deploy
```

Bu komut:
1. Prisma Client generate eder
2. Migration'ları çalıştırır
3. Seed data ekler

