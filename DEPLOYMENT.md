# 🚀 Production Deployment Guide

Bu rehber, QR Attendance Platform'unu production ortamına deploy etmek için gerekli tüm adımları içerir.

## 📋 Özellikler Production'da Çalışır mı?

✅ **Tüm özellikler production'da çalışır:**

- ✅ **QR Attendance**: HTTPS üzerinden kamera erişimi mümkün
- ✅ **Geolocation**: HTTPS zorunlu (browser API'si) - Vercel/Render HTTPS sağlar
- ✅ **Device Fingerprinting**: localStorage kullanır, tüm browserlarda çalışır
- ✅ **IP Tracking**: Backend request'ten otomatik alınır
- ✅ **Fraud Detection**: Tüm kurallar production'da aktif

## 🎯 Önerilen Deployment Platformları (Ücretsiz)

### Frontend: **Vercel** (Önerilen)
- ✅ Next.js için optimize edilmiş
- ✅ Otomatik HTTPS (Geolocation için gerekli)
- ✅ Ücretsiz tier yeterli
- ✅ Otomatik build ve deploy
- ✅ Custom domain desteği

**Alternatif:** Netlify

### Backend: **Railway** veya **Render** (Önerilen)
- ✅ PostgreSQL dahil
- ✅ Ücretsiz tier mevcut
- ✅ Otomatik HTTPS
- ✅ Environment variables yönetimi
- ✅ Otomatik restart

**Alternatif:** Fly.io, Heroku (artık ücretsiz değil)

### Database: **Railway PostgreSQL** veya **Neon.tech**
- ✅ Railway: Backend ile aynı platform (kolay)
- ✅ Neon.tech: Ayrı managed PostgreSQL (daha güçlü)

---

## 📝 Adım 1: Environment Variables Hazırlığı

### Backend `.env` Dosyası

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# JWT Secrets (güçlü random stringler kullanın)
JWT_ACCESS_SECRET="your-super-secret-access-key-here-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-min-32-chars"
JWT_ACCESS_EXPIRES_IN="30m"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV=production

# Frontend URL (production URL'niz)
FRONTEND_URL="https://your-frontend-domain.vercel.app"

# Throttling (opsiyonel)
THROTTLE_TTL=60
THROTTLE_LIMIT=60
```

### Frontend `.env.local` Dosyası

```bash
# Backend API URL (production backend URL'niz)
NEXT_PUBLIC_API_URL="https://your-backend.railway.app/api/v1"
```

---

## 🔧 Adım 2: Backend Production Hazırlığı

### 1. CORS Ayarlarını Güncelle

`backend/src/main.ts` dosyasını güncelleyin:

```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
    // Development için (gerekirse)
    'http://localhost:3000',
  ],
  credentials: true,
});
```

### 2. Production Build

```bash
cd backend
npm install
npm run build
```

Build çıktısı: `dist/` klasörü

### 3. Database Migration

Production database'e migrate edin:

```bash
# Railway veya Neon.tech'den DATABASE_URL'i alın
DATABASE_URL="postgresql://..." npx prisma migrate deploy
npx prisma generate
```

### 4. Seed Database (İlk kez)

```bash
DATABASE_URL="postgresql://..." npm run prisma:seed
```

---

## 🌐 Adım 3: Frontend Production Hazırlığı

### 1. Environment Variables

`.env.local` dosyasına production backend URL'ini ekleyin:

```bash
NEXT_PUBLIC_API_URL="https://your-backend.railway.app/api/v1"
```

### 2. Production Build

```bash
cd frontend
npm install
npm run build
```

Build başarılı olmalı.

---

## 🚂 Adım 4: Railway ile Backend Deployment

### 1. Railway Hesabı Oluştur
- [railway.app](https://railway.app) → Sign Up (GitHub ile)

### 2. Yeni Proje Oluştur
- "New Project" → "Deploy from GitHub repo"
- Repository'nizi seçin

### 3. PostgreSQL Database Ekle
- "New" → "Database" → "Add PostgreSQL"
- Database URL otomatik `DATABASE_URL` olarak eklenir

### 4. Backend Servis Ayarları
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

### 5. Environment Variables
Railway dashboard'da şunları ekleyin:

```
JWT_ACCESS_SECRET=<random-32-chars>
JWT_REFRESH_SECRET=<random-32-chars>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
PORT=3001
```

**⚠️ ÖNEMLİ:** JWT secret'larını güçlü random stringler yapın:
```bash
# Terminal'de çalıştırın:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Custom Domain (Opsiyonel)
- Settings → Domains → "Generate Domain" veya custom domain ekleyin
- HTTPS otomatik aktif olur

### 7. Database Migration
Railway'de terminal açın:

```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

---

## ▲ Adım 5: Vercel ile Frontend Deployment

### 1. Vercel Hesabı Oluştur
- [vercel.com](https://vercel.com) → Sign Up (GitHub ile)

### 2. Yeni Proje Oluştur
- "Add New..." → "Project"
- GitHub repository'nizi import edin

### 3. Project Ayarları
- **Framework Preset:** Next.js
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (otomatik)
- **Output Directory:** `.next` (otomatik)

### 4. Environment Variables
Vercel dashboard'da:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

### 5. Deploy
- "Deploy" butonuna tıklayın
- Build otomatik başlar
- URL otomatik oluşturulur: `https://your-project.vercel.app`

### 6. Custom Domain (Opsiyonel)
- Settings → Domains → Custom domain ekleyin

---

## ✅ Adım 6: Production Test Checklist

### Backend Test
- [ ] `https://your-backend.railway.app/api/v1/auth/admin/login` erişilebilir
- [ ] Database bağlantısı çalışıyor
- [ ] CORS çalışıyor (browser console'da hata yok)

### Frontend Test
- [ ] Frontend açılıyor
- [ ] Admin login çalışıyor
- [ ] Teacher login çalışıyor
- [ ] Dashboard yükleniyor

### QR Attendance Test (ÖNEMLİ)
- [ ] Teacher bir session başlatabildi
- [ ] QR code oluşturuldu
- [ ] QR code'u tarayınca public page açılıyor (HTTPS üzerinden)
- [ ] Geolocation çalışıyor (browser permission istiyor)
- [ ] Attendance submit edilebiliyor
- [ ] Device fingerprinting çalışıyor
- [ ] IP tracking çalışıyor

### Özellik Test
- [ ] Fraud signals görüntüleniyor
- [ ] Audit logs çalışıyor
- [ ] CSV import çalışıyor
- [ ] Attendance sessions kapanıyor

---

## 🔒 Production Güvenlik Checklist

- [x] JWT secrets güçlü (32+ karakter, random)
- [x] HTTPS aktif (Vercel + Railway otomatik)
- [x] CORS sadece frontend URL'sine izin veriyor
- [x] Environment variables production'da set edilmiş
- [x] Database credentials güvenli
- [x] Rate limiting aktif

---

## 🐛 Sorun Giderme

### Geolocation Çalışmıyor
**Problem:** Browser permission istemiyor veya hata veriyor

**Çözüm:**
- HTTPS kullanıldığından emin olun (HTTP'de çalışmaz)
- Browser console'da hataları kontrol edin
- `sessionInfo.requires_geo` true ise permission zorunlu

### CORS Hatası
**Problem:** `Access-Control-Allow-Origin` hatası

**Çözüm:**
- Backend `FRONTEND_URL` environment variable'ını kontrol edin
- Frontend URL'ini doğru yazdığınızdan emin olun
- Backend'i restart edin

### Database Bağlantı Hatası
**Problem:** `Can't reach database server`

**Çözüm:**
- Railway'de database'in running olduğunu kontrol edin
- `DATABASE_URL` environment variable'ını kontrol edin
- Database migration'ların çalıştığını kontrol edin

### QR Code Açılmıyor
**Problem:** QR code tarayınca sayfa açılmıyor

**Çözüm:**
- QR code'daki URL'nin HTTPS olduğundan emin olun
- Frontend URL'inin doğru olduğundan emin olun
- Browser'da direkt URL'i test edin

---

## 📊 Monitoring ve Logs

### Railway (Backend)
- Railway dashboard → Logs sekmesi
- Real-time logs görüntülenir
- Hata logları burada görünür

### Vercel (Frontend)
- Vercel dashboard → Deployments → View Function Logs
- Analytics sekmesinde trafik bilgisi

---

## 🔄 Güncelleme Süreci

### Backend Güncelleme
1. Kod değişikliklerini GitHub'a push edin
2. Railway otomatik deploy eder (auto-deploy aktifse)
3. Veya manuel: Railway → Deploy → Redeploy

### Frontend Güncelleme
1. Kod değişikliklerini GitHub'a push edin
2. Vercel otomatik deploy eder
3. Veya manuel: Vercel → Deployments → Redeploy

### Database Migration
Railway'de terminal açın:
```bash
npx prisma migrate deploy
npx prisma generate
```

---

## 💰 Ücretsiz Tier Limitleri

### Railway
- **Free Tier:** $5 kredi/ay
- **Backend + Database:** ~$2-3/ay (küçük projeler için yeterli)
- **Limits:** Her servis için RAM/CPU limitleri var

### Vercel
- **Free Tier:** Sınırsız
- **Bandwidth:** 100GB/ay
- **Build Time:** 6 saat/ay
- **Çoğu proje için yeterli**

---

## 🎉 Başarılı Deployment Sonrası

1. **Test URL'lerini kaydedin:**
   - Frontend: `https://your-project.vercel.app`
   - Backend: `https://your-backend.railway.app`

2. **Default credentials:**
   - Admin: `admin@qrattendance.com` / `admin123`
   - Teacher: `teacher@qrattendance.com` / `teacher123`
   - **⚠️ İlk login'den sonra şifreleri değiştirin!**

3. **İlk kullanım:**
   - Admin panelinden system settings'i kontrol edin
   - Geofencing'i isteğe bağlı aktif edin
   - Test session başlatıp QR code'u test edin

---

## 📞 Destek

Sorun yaşarsanız:
1. Railway ve Vercel logs'larını kontrol edin
2. Browser console'da hataları kontrol edin
3. Environment variables'ları doğrulayın
4. Database migration'ların çalıştığından emin olun

---

**🎊 Tebrikler! Platform production'da çalışıyor!**

