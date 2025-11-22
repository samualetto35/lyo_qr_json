# 🌐 Netlify Deployment Rehberi

Netlify ile frontend'i ücretsiz deploy edebilirsiniz. Backend için Railway veya Render kullanacağız.

## ✅ Ücretsiz mi?

**Evet, tamamen ücretsiz!**

- **Netlify (Frontend):** Tamamen ücretsiz
  - Sınırsız bandwidth
  - Sınırsız build time
  - Otomatik HTTPS
  - Custom domain

- **Railway/Render (Backend):** Ücretsiz tier mevcut
  - Railway: $5 kredi/ay (küçük projeler için yeterli)
  - Render: Tamamen ücretsiz (yavaş startup olabilir)

## 🎯 Özellikler Çalışır mı?

**Evet, TÜM özellikler production'da çalışır:**

✅ **QR Attendance** - HTTPS üzerinden (Netlify otomatik sağlar)
✅ **Geolocation** - HTTPS zorunlu (Netlify otomatik sağlar)
✅ **Device Fingerprinting** - localStorage (tüm browserlarda çalışır)
✅ **IP Tracking** - Backend otomatik alır
✅ **Fraud Detection** - Tüm kurallar aktif

---

## 🚀 Adım 1: Netlify CLI Kurulumu

```bash
# Netlify CLI'yi global olarak yükleyin
npm install -g netlify-cli

# Login olun (browser açılacak)
netlify login
```

---

## 🔧 Adım 2: Frontend Hazırlığı

### 1. Environment Variables Hazırlığı

`frontend/.env.production` dosyası oluşturun:

```bash
cd frontend
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
EOF
```

**Not:** Backend URL'ini Railway'den aldıktan sonra ekleyeceksiniz.

### 2. Build Test

```bash
cd frontend
npm install
npm run build
```

Build başarılı olmalı.

---

## 🌐 Adım 3: Netlify Deploy (3 Yöntem)

### Yöntem 1: Netlify Dashboard (En Kolay) ⭐

1. **Netlify'a Git:** [netlify.com](https://netlify.com) → Sign Up (GitHub ile)

2. **Yeni Site Oluştur:**
   - "Add new site" → "Import an existing project"
   - GitHub repository'nizi seçin

3. **Build Ayarları:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/.next`

4. **Environment Variables:**
   - Site settings → Environment variables
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api/v1`

5. **Deploy:**
   - "Deploy site" butonuna tıklayın
   - Build otomatik başlar
   - URL: `https://random-name.netlify.app`

✅ **Frontend hazır!**

---

### Yöntem 2: Netlify CLI (Terminal) 🖥️

```bash
cd /Users/a.sametyildiz/lyo_qr_json

# Netlify'e bağlan
netlify init

# Sorular:
# - Create & configure a new site? → Yes
# - Team: [Seçin]
# - Site name: [İsim verin veya enter]
# - Build command: cd frontend && npm run build
# - Directory to deploy: frontend/.next
# - Netlify functions folder: [Enter - boş]

# Environment variable ekle
netlify env:set NEXT_PUBLIC_API_URL "https://your-backend.railway.app/api/v1"

# Deploy
cd frontend
npm run build
netlify deploy --prod
```

✅ **Frontend deploy edildi!**

---

### Yöntem 3: GitHub Integration (Otomatik) ⚡

1. **Netlify Dashboard:**
   - "Add new site" → "Import an existing project"
   - GitHub repository'nizi seçin

2. **Auto Deploy Ayarları:**
   - Base directory: `frontend`
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/.next`
   - Environment variables: `NEXT_PUBLIC_API_URL`

3. **Auto Deploy Aktif:**
   - Her GitHub push'ta otomatik deploy olur

✅ **Otomatik deployment aktif!**

---

## 🚂 Adım 4: Backend Deployment (Railway veya Render)

Netlify sadece frontend için. Backend için Railway veya Render kullanacağız.

### Seçenek A: Railway (Önerilen)

1. **Railway:** [railway.app](https://railway.app) → Sign Up

2. **Yeni Proje:**
   - "New Project" → "Deploy from GitHub repo"
   - Repository seçin

3. **PostgreSQL Database:**
   - "New" → "Database" → "Add PostgreSQL"
   - `DATABASE_URL` otomatik oluşur

4. **Backend Servis:**
   - "New" → "GitHub Repo"
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

5. **Environment Variables:**
```
DATABASE_URL=<railway-otomatik-verir>
JWT_ACCESS_SECRET=<güçlü-random-32-karakter>
JWT_REFRESH_SECRET=<güçlü-random-32-karakter>
FRONTEND_URL=https://your-site.netlify.app
NODE_ENV=production
PORT=3001
```

**JWT Secret Oluştur:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. **Database Migration:**
   - Railway → Backend → Terminal
```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

✅ **Backend URL:** `https://your-backend.railway.app`

---

### Seçenek B: Render (Tamamen Ücretsiz)

1. **Render:** [render.com](https://render.com) → Sign Up

2. **Yeni Web Service:**
   - "New +" → "Web Service"
   - GitHub repository seçin

3. **Ayarlar:**
   - **Name:** backend
   - **Root Directory:** backend
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`

4. **PostgreSQL Database:**
   - "New +" → "PostgreSQL"
   - Database otomatik oluşturulur

5. **Environment Variables:**
   - `DATABASE_URL` (Render otomatik verir)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`

6. **Database Migration:**
   - Render Shell açın:
```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

✅ **Backend URL:** `https://your-backend.onrender.com`

**⚠️ Render Notu:** İlk request yavaş olabilir (free tier'da sleep mode)

---

## 🔗 Adım 5: CORS Ayarları

### Backend'de (Railway/Render)

`FRONTEND_URL` environment variable'ını güncelleyin:

```
FRONTEND_URL=https://your-site.netlify.app
```

Backend'i restart edin.

---

### Netlify'de

Environment variable'ı güncelleyin:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

Site'yi redeploy edin.

---

## ✅ Test Checklist

### Frontend Test
- [ ] Netlify URL'i açılıyor: `https://your-site.netlify.app`
- [ ] HTTPS aktif (kilit ikonu)
- [ ] Admin login sayfası açılıyor
- [ ] Teacher login sayfası açılıyor
- [ ] Login başarılı
- [ ] Dashboard yükleniyor

### Backend Test
- [ ] Backend URL'i açılıyor: `https://your-backend.railway.app`
- [ ] API endpoint'leri çalışıyor
- [ ] CORS çalışıyor (browser console'da hata yok)

### QR Attendance Test
- [ ] Teacher session başlattı
- [ ] QR code oluşturuldu
- [ ] QR code scan edildi (telefon kamerası)
- [ ] Public page açıldı (HTTPS üzerinden)
- [ ] Geolocation permission istendi
- [ ] Attendance submit edildi
- [ ] Device fingerprinting çalıştı

---

## 🐛 Sorun Giderme

### Netlify Build Hatası

**Problem:** Build başarısız oluyor

**Çözüm:**
```bash
# Local'de test edin
cd frontend
npm run build

# Eğer hata varsa, çözün
# Sonra Netlify'e push edin
```

### CORS Hatası

**Problem:** Frontend'den backend'e istek çalışmıyor

**Çözüm:**
1. Backend `FRONTEND_URL` doğru mu kontrol edin
2. Netlify URL'i doğru yazıldığından emin olun
3. Backend'i restart edin

### Geolocation Çalışmıyor

**Problem:** Browser permission istemiyor

**Çözüm:**
- HTTPS kullanıldığından emin olun (Netlify otomatik sağlar)
- Browser console'da hata var mı kontrol edin
- System settings'de `geo_required` false ise permission istemez

---

## 💰 Maliyet

### Netlify (Frontend)
- **Ücretsiz:** Sınırsız
- **Build time:** Sınırsız
- **Bandwidth:** 100GB/ay (çoğu proje için yeterli)

### Railway (Backend + Database)
- **Free tier:** $5 kredi/ay
- **Backend + Database:** ~$2-3/ay (küçük projeler)

### Render (Backend + Database)
- **Tamamen ücretsiz**
- İlk request yavaş olabilir (sleep mode)

---

## 🎉 Başarılı Deployment!

Tüm adımları tamamladıysanız:

✅ Frontend: Netlify'de çalışıyor
✅ Backend: Railway/Render'de çalışıyor
✅ Database: PostgreSQL çalışıyor
✅ HTTPS: Otomatik aktif
✅ Tüm özellikler: Production'da çalışıyor

**İlk kullanım:**
1. Default admin login: `admin@qrattendance.com` / `admin123`
2. Şifrenizi değiştirin
3. Test session başlatıp QR code'u test edin

---

**🚀 İyi kullanımlar!**

