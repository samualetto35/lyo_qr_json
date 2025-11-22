# ✅ Production Deployment Checklist

Bu checklist'i kullanarak deployment öncesi ve sonrası kontrolleri yapın.

## 🔧 Deployment Öncesi Hazırlık

### Backend Hazırlık
- [ ] `backend/.env` dosyası oluşturuldu
- [ ] `DATABASE_URL` production PostgreSQL URL'i ile set edildi
- [ ] `JWT_ACCESS_SECRET` güçlü random string (32+ karakter)
- [ ] `JWT_REFRESH_SECRET` güçlü random string (32+ karakter)
- [ ] `FRONTEND_URL` production frontend URL'i ile set edildi
- [ ] `NODE_ENV=production` set edildi
- [ ] `backend/src/main.ts` CORS ayarları güncellendi
- [ ] Backend build başarılı: `cd backend && npm run build`

### Frontend Hazırlık
- [ ] `frontend/.env.local` dosyası oluşturuldu
- [ ] `NEXT_PUBLIC_API_URL` production backend URL'i ile set edildi
- [ ] Frontend build başarılı: `cd frontend && npm run build`

### Database Hazırlık
- [ ] Production PostgreSQL database oluşturuldu (Railway/Neon.tech)
- [ ] `DATABASE_URL` connection string doğru
- [ ] Migration'lar hazır: `npx prisma migrate deploy`
- [ ] Database seed script hazır

---

## 🚀 Deployment Adımları

### Railway (Backend + Database)
- [ ] Railway hesabı oluşturuldu
- [ ] GitHub repository bağlandı
- [ ] Yeni proje oluşturuldu
- [ ] PostgreSQL database eklendi
- [ ] Backend servis oluşturuldu
- [ ] Root directory: `backend` set edildi
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start:prod`
- [ ] Environment variables eklendi:
  - [ ] `DATABASE_URL` (otomatik)
  - [ ] `JWT_ACCESS_SECRET`
  - [ ] `JWT_REFRESH_SECRET`
  - [ ] `FRONTEND_URL`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
- [ ] Custom domain eklendi (opsiyonel)
- [ ] Railway deploy başarılı
- [ ] Database migration çalıştırıldı: `npx prisma migrate deploy`
- [ ] Database seed çalıştırıldı: `npm run prisma:seed`

### Vercel (Frontend)
- [ ] Vercel hesabı oluşturuldu
- [ ] GitHub repository bağlandı
- [ ] Yeni proje oluşturuldu
- [ ] Framework: Next.js seçildi
- [ ] Root directory: `frontend` set edildi
- [ ] Environment variables eklendi:
  - [ ] `NEXT_PUBLIC_API_URL` (Railway backend URL)
- [ ] Custom domain eklendi (opsiyonel)
- [ ] Vercel deploy başarılı

---

## ✅ Post-Deployment Test

### Backend API Test
- [ ] Backend URL'ine erişilebilir: `https://your-backend.railway.app`
- [ ] Health check: `https://your-backend.railway.app/api/v1`
- [ ] Admin login endpoint çalışıyor: `POST /auth/admin/login`
- [ ] Teacher login endpoint çalışıyor: `POST /auth/teacher/login`
- [ ] CORS çalışıyor (browser console'da hata yok)

### Frontend Test
- [ ] Frontend açılıyor: `https://your-frontend.vercel.app`
- [ ] HTTPS aktif (kilit ikonu görünüyor)
- [ ] Admin login sayfası açılıyor: `/login/admin`
- [ ] Teacher login sayfası açılıyor: `/login/teacher`
- [ ] Login başarılı (cookies set ediliyor)
- [ ] Dashboard yükleniyor
- [ ] API istekleri çalışıyor (Network tab'da 200 OK)

### QR Attendance Test (KRİTİK)
- [ ] Teacher login yapıldı
- [ ] Bir course seçildi
- [ ] Attendance session başlatıldı
- [ ] QR code oluşturuldu
- [ ] QR code tarayıcıda görüntüleniyor
- [ ] QR code scan edildi (telefon kamerası ile)
- [ ] Public attendance page açıldı (HTTPS üzerinden)
- [ ] Browser geolocation permission istedi (eğer gerekliyse)
- [ ] Student ID girildi
- [ ] Attendance submit edildi
- [ ] Başarı mesajı gösterildi
- [ ] Attendance backend'de kaydedildi
- [ ] Device fingerprinting çalıştı (localStorage'da `device_id`)
- [ ] IP tracking çalıştı (backend logs'da IP görünüyor)
- [ ] Geofencing çalıştı (eğer aktifse)

### Özellik Test
- [ ] Admin panel açılıyor
- [ ] Courses listesi görüntüleniyor
- [ ] Teachers listesi görüntüleniyor
- [ ] Students listesi görüntüleniyor
- [ ] CSV import çalışıyor
- [ ] Attendance sessions listesi görüntüleniyor
- [ ] Fraud signals görüntüleniyor
- [ ] Audit logs görüntüleniyor

### Güvenlik Test
- [ ] HTTPS zorunlu (HTTP redirect ediliyor)
- [ ] CORS sadece frontend URL'ine izin veriyor
- [ ] JWT token geçerli
- [ ] Rate limiting çalışıyor
- [ ] Environment variables expose edilmemiş

---

## 🐛 Bilinen Sorunlar ve Çözümler

### Geolocation Çalışmıyor
**Semptom:** Browser permission istemiyor veya hata veriyor

**Çözüm:**
- ✅ HTTPS kullanıldığından emin olun (HTTP'de geolocation çalışmaz)
- ✅ Browser console'da hata var mı kontrol edin
- ✅ System settings'de `geo_required` false ise permission istemez

### CORS Hatası
**Semptom:** `Access-Control-Allow-Origin` hatası

**Çözüm:**
- ✅ Backend `FRONTEND_URL` environment variable'ını kontrol edin
- ✅ Frontend URL'ini doğru yazdığınızdan emin olun (https:// ile başlamalı)
- ✅ Backend'i restart edin
- ✅ Railway logs'da CORS ayarlarını kontrol edin

### Database Bağlantı Hatası
**Semptom:** `Can't reach database server` veya `P1001`

**Çözüm:**
- ✅ Railway'de database'in running olduğunu kontrol edin
- ✅ `DATABASE_URL` environment variable'ını kontrol edin
- ✅ Database migration'ların çalıştığını kontrol edin: `npx prisma migrate deploy`
- ✅ Prisma client generate edildi: `npx prisma generate`

### QR Code Açılmıyor
**Semptom:** QR code tarayınca sayfa açılmıyor veya 404

**Çözüm:**
- ✅ QR code'daki URL'in HTTPS olduğundan emin olun
- ✅ Frontend URL'inin doğru olduğundan emin olun
- ✅ Browser'da direkt URL'i test edin: `/attendance/qr?session_id=...&token=...`
- ✅ Vercel deployment'ının başarılı olduğunu kontrol edin

### Device Fingerprinting Çalışmıyor
**Semptom:** Her submit'te farklı device ID

**Çözüm:**
- ✅ localStorage'ın çalıştığını kontrol edin (browser console: `localStorage.getItem('device_id')`)
- ✅ HTTPS kullanıldığından emin olun (bazı browserlar HTTP'de localStorage'a kısıtlama koyar)
- ✅ Browser'ın fingerprintjs2'yi yüklediğini kontrol edin (Network tab)

---

## 📊 Monitoring

### Railway Logs
- Railway dashboard → Backend servis → Logs
- Real-time logs görüntülenir
- Hata logları burada görünür

### Vercel Logs
- Vercel dashboard → Project → Deployments → View Function Logs
- Analytics sekmesinde trafik bilgisi

### Database Monitoring
- Railway: Database → Metrics
- Neon.tech: Dashboard → Metrics

---

## 🔄 Güncelleme Süreci

### Backend Güncelleme
1. Kod değişikliklerini GitHub'a push edin
2. Railway otomatik deploy eder (auto-deploy aktifse)
3. Database migration gerekirse: Railway terminal → `npx prisma migrate deploy`

### Frontend Güncelleme
1. Kod değişikliklerini GitHub'a push edin
2. Vercel otomatik deploy eder
3. Environment variables değiştiyse Vercel dashboard'dan güncelleyin

---

## 🎉 Deployment Başarılı!

Tüm checklist'i tamamladıysanız:
- ✅ Platform production'da çalışıyor
- ✅ Tüm özellikler aktif
- ✅ HTTPS aktif (Geolocation için gerekli)
- ✅ Security best practices uygulanmış

**İlk kullanım:**
1. Default admin login ile giriş yapın
2. Şifrenizi değiştirin
3. System settings'i kontrol edin
4. Test session başlatıp QR code'u test edin

---

**🚀 İyi kullanımlar!**

