# 🧪 Railway API Test Guide

## ✅ Backend Durumu

Loglardan görünen:
- ✅ Nest application successfully started
- ✅ Database connected
- ✅ Tüm route'lar map edildi

---

## 🔍 Kontrol Edilmesi Gerekenler

### 1. Build Logs - Migration Kontrolü

**Railway Dashboard → Service → "Build Logs" sekmesine gidin**

Aradığınız mesajlar:
```
✅ Prisma Client generated
✅ Migration applied
```

**Eğer migration logları yoksa:**
- Railway Terminal açın
- Şu komutu çalıştırın:
  ```bash
  cd backend && npx prisma migrate deploy
  ```

---

### 2. Seed Data Kontrolü

**Railway Terminal'de:**

```bash
cd backend && npm run prisma:seed
```

**Çıktı:**
```
🌱 Seeding database...
✅ System settings created
✅ Default admin created: admin@qrattendance.com
✅ Demo teacher created: teacher@qrattendance.com
✅ Demo course created
✅ 3 demo students created
✅ Students enrolled in demo course
🎉 Database seeding completed successfully!
```

**Eğer "duplicate key" hatası alırsanız:**
- Normal! Admin/teacher zaten var demektir
- Devam edebilirsiniz

---

### 3. API Endpoint Testleri

#### Test 1: Admin Login

**Backend URL'inizi alın:**
- Railway Dashboard → Service → Settings → Domains
- Veya "Deployments" sekmesinde URL görünür

**Test komutu (Terminal'de veya Postman'de):**

```bash
# Backend URL'inizi kullanın (örnek: https://terrific-growth-production.up.railway.app)
curl -X POST https://YOUR_BACKEND_URL/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@qrattendance.com",
    "password": "admin123"
  }'
```

**Beklenen sonuç:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "email": "admin@qrattendance.com",
    "role": "admin"
  }
}
```

**Eğer hata alırsanız:**
- Migration'lar çalışmamış olabilir → Terminal'de `npx prisma migrate deploy`
- Seed data eklenmemiş olabilir → Terminal'de `npm run prisma:seed`

---

#### Test 2: Teacher Login

```bash
curl -X POST https://YOUR_BACKEND_URL/api/v1/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@qrattendance.com",
    "password": "teacher123"
  }'
```

---

#### Test 3: Admin - Get Teachers

```bash
# Önce login yapın ve access_token'ı alın
ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"

curl -X GET https://YOUR_BACKEND_URL/api/v1/admin/teachers \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 🐛 Olası Hatalar ve Çözümleri

### Hata 1: "relation does not exist"
**Sebep:** Migration'lar çalışmamış

**Çözüm:**
```bash
cd backend && npx prisma migrate deploy
```

---

### Hata 2: "Invalid credentials" (Login)
**Sebep:** Seed data eklenmemiş

**Çözüm:**
```bash
cd backend && npm run prisma:seed
```

---

### Hata 3: "Database connection failed"
**Sebep:** DATABASE_URL yanlış veya eksik

**Çözüm:**
1. Railway Dashboard → Service → Variables
2. `DATABASE_URL` kontrol edin
3. PostgreSQL servisinin çalıştığından emin olun

---

### Hata 4: "Cannot find module"
**Sebep:** Build hatası

**Çözüm:**
1. Railway Dashboard → Service → "Redeploy"
2. Build loglarını kontrol edin

---

## ✅ Başarı Kriterleri

Tüm bunlar çalışırsa:
- ✅ Migration'lar uygulandı
- ✅ Seed data eklendi
- ✅ API endpoint'leri çalışıyor
- ✅ Authentication çalışıyor
- ✅ Database bağlantısı aktif

**Production'a hazırsınız!** 🚀

---

## 📝 Notlar

- **Backend URL:** Railway Dashboard → Service → Settings → Domains
- **Database URL:** Railway Dashboard → PostgreSQL Service → Variables → `DATABASE_URL`
- **Migration'lar:** Build sırasında otomatik çalışmalı, ama manuel kontrol edin
- **Seed data:** Sadece ilk deployment'ta çalıştırın (idempotent)

---

**Şimdi Build Logs'u kontrol edin ve seed script'i çalıştırın!** 🔍

