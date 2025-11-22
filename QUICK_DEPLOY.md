# 🚀 Hızlı Deployment Rehberi

Bu rehber production'a deploy etmek için **en hızlı yolu** gösterir.

## ⚡ 5 Dakikada Deploy

### 1️⃣ Railway - Backend + Database (2 dakika)

1. **Railway'a Git:** [railway.app](https://railway.app) → Sign Up (GitHub)

2. **Yeni Proje:** "New Project" → "Deploy from GitHub repo"
   - Repository'nizi seçin

3. **PostgreSQL Ekle:** "New" → "Database" → "Add PostgreSQL"
   - `DATABASE_URL` otomatik oluşur

4. **Backend Servis:** "New" → "GitHub Repo"
   - Repository seçin
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

5. **Environment Variables (Railway → Variables):**
```bash
DATABASE_URL=<railway-otomatik-verir>
JWT_ACCESS_SECRET=<güçlü-random-32-karakter>
JWT_REFRESH_SECRET=<güçlü-random-32-karakter>
FRONTEND_URL=https://your-frontend.vercel.app (şimdilik boş bırak, sonra ekle)
NODE_ENV=production
PORT=3001
```

**JWT Secret Oluştur:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. **Database Migration:** Railway → Backend → Terminal
```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

✅ Backend hazır! URL'ini kopyala: `https://your-backend.railway.app`

---

### 2️⃣ Vercel - Frontend (2 dakika)

1. **Vercel'a Git:** [vercel.com](https://vercel.com) → Sign Up (GitHub)

2. **Yeni Proje:** "Add New..." → "Project"
   - Repository'nizi import edin

3. **Ayarlar:**
   - Framework: Next.js (otomatik)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (otomatik)

4. **Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

5. **Deploy:** "Deploy" butonuna tıkla

✅ Frontend hazır! URL'ini kopyala: `https://your-project.vercel.app`

---

### 3️⃣ CORS Ayarları (1 dakika)

**Railway'de:** Backend → Variables → `FRONTEND_URL`
```bash
FRONTEND_URL=https://your-project.vercel.app
```

**Backend'i Redeploy Et:** Railway → Deployments → Redeploy

---

### 4️⃣ Test Et

1. **Frontend:** `https://your-project.vercel.app` → Login ol
2. **QR Test:** Teacher login → Course → Start Session → QR scan et
3. **Geolocation:** Browser permission isteyecek → Allow
4. **Submit:** Student ID gir → Submit

✅ Çalışıyor!

---

## 📋 Önemli Notlar

### ✅ Production'da Çalışan Özellikler:
- ✅ QR Attendance (HTTPS gerekli - Vercel otomatik sağlar)
- ✅ Geolocation (HTTPS gerekli - Vercel otomatik sağlar)
- ✅ Device Fingerprinting (localStorage - çalışır)
- ✅ IP Tracking (Backend otomatik alır)
- ✅ Fraud Detection (Tüm kurallar aktif)

### 🔒 Güvenlik:
- ✅ HTTPS: Vercel + Railway otomatik sağlar
- ✅ JWT Secrets: Güçlü random stringler kullanın
- ✅ CORS: Sadece frontend URL'ine izin verin
- ✅ Rate Limiting: Backend'de aktif

### 💰 Ücretsiz Tier:
- **Railway:** $5 kredi/ay (backend + database için yeterli)
- **Vercel:** Sınırsız (çoğu proje için yeterli)

---

## 🐛 Sorun mu var?

### CORS Hatası:
- Railway → Variables → `FRONTEND_URL` doğru mu?
- Backend'i redeploy ettiniz mi?

### Geolocation Çalışmıyor:
- HTTPS kullanılıyor mu? (HTTP'de çalışmaz)
- Browser permission verildi mi?

### Database Bağlanamıyor:
- Railway → Database running mi?
- `DATABASE_URL` doğru mu?
- Migration çalıştı mı? (`npx prisma migrate deploy`)

**Daha detaylı:** `DEPLOYMENT.md` dosyasına bakın!

---

**🎉 Başarılı deployment! Artık gerçek hayatta kullanabilirsiniz!**

