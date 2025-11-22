# 🌐 Netlify Deployment Guide - lyoqr.netlify.app

## 🎯 Deployment Adımları

### 1️⃣ Railway Backend URL'ini Al

1. Railway Dashboard'a git: [railway.app](https://railway.app)
2. Backend servisinize tıklayın
3. **Settings** → **Domains** sekmesine gidin
4. Railway domain URL'ini kopyalayın: `https://_____.railway.app`
5. **Not:** Bu URL'yi aşağıdaki adımlarda kullanacağız

---

### 2️⃣ Railway Backend CORS Ayarları

Railway'de backend servisinizin **Variables** sekmesine gidin ve şunu ekleyin:

```
FRONTEND_URL=https://lyoqr.netlify.app
```

**Not:** Eğer FRONTEND_URL zaten varsa, değerini güncelleyin.

Backend'i restart etmeniz gerekebilir (Railway otomatik restart eder).

---

### 3️⃣ Netlify'de Site Oluştur

#### Yöntem A: Netlify Dashboard (Önerilen)

1. **Netlify'a Git:** [netlify.com](https://netlify.com) → Sign Up/Login (GitHub ile)

2. **Yeni Site Oluştur:**
   - "Add new site" → "Import an existing project"
   - GitHub repository'nizi seçin: `samualetto35/lyo_qr_json`

3. **Build Ayarları:**
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/.next`

4. **Environment Variables (Site settings → Environment variables):**
   ```
   NEXT_PUBLIC_API_URL=https://YOUR_RAILWAY_BACKEND_URL/api/v1
   ```
   **Örnek:**
   ```
   NEXT_PUBLIC_API_URL=https://terrific-growth-production.up.railway.app/api/v1
   ```

5. **Site İsmi:**
   - Site settings → General → Site details
   - "Change site name" → `lyoqr`
   - **Site URL:** `https://lyoqr.netlify.app`

6. **Deploy:** "Deploy site" butonuna tıklayın

---

#### Yöntem B: Netlify CLI

```bash
# Netlify CLI kurulumu (eğer yoksa)
npm install -g netlify-cli

# Login
netlify login

# Deploy (frontend klasöründen)
cd frontend
netlify deploy --prod

# İlk deploy'da site ismini ayarlayın:
# Site name: lyoqr
# Environment variables'ı Netlify dashboard'dan ekleyin
```

---

### 4️⃣ Environment Variables Kontrol

Netlify dashboard'da şu environment variable'ın set edildiğinden emin olun:

- **NEXT_PUBLIC_API_URL:** `https://YOUR_RAILWAY_BACKEND_URL/api/v1`

**Not:** Railway backend URL'inizi buraya eklemeyi unutmayın!

---

### 5️⃣ Deploy ve Test

1. **Deploy başlatıldıktan sonra:**
   - Netlify dashboard'da build loglarını kontrol edin
   - Build başarılı olmalı

2. **Site URL'sini açın:**
   - `https://lyoqr.netlify.app`

3. **Test:**
   - Admin login: `admin@qrattendance.com` / `admin123`
   - Teacher login: `teacher@qrattendance.com` / `teacher123`

---

## ✅ Checklist

- [ ] Railway backend URL'ini aldım
- [ ] Railway'de `FRONTEND_URL=https://lyoqr.netlify.app` set ettim
- [ ] Netlify'de site oluşturdum
- [ ] Netlify'de `NEXT_PUBLIC_API_URL` environment variable'ını ekledim (Railway backend URL'i)
- [ ] Site ismini `lyoqr` olarak ayarladım
- [ ] Deploy başarılı oldu
- [ ] Login test ettim

---

## 🚨 Sorun Giderme

### CORS Hatası

**Hata:** `Access to XMLHttpRequest blocked by CORS policy`

**Çözüm:**
1. Railway'de `FRONTEND_URL=https://lyoqr.netlify.app` set edildiğinden emin olun
2. Railway backend'i restart edin

### API Connection Error

**Hata:** `Network Error` veya `Failed to fetch`

**Çözüm:**
1. Netlify'de `NEXT_PUBLIC_API_URL` doğru mu kontrol edin
2. Railway backend URL'ini browser'da test edin: `https://YOUR_BACKEND_URL/api/v1`
3. Netlify site'yi redeploy edin (environment variable değiştiyse)

### Build Error

**Hata:** `Module not found` veya build fail

**Çözüm:**
1. `netlify.toml` dosyasının doğru olduğundan emin olun
2. Build loglarını kontrol edin
3. `frontend` klasöründe `npm install && npm run build` çalıştırıp local'de test edin

---

## 🎉 Başarılı!

Deploy başarılı olduktan sonra:
- **Frontend:** `https://lyoqr.netlify.app`
- **Backend:** `https://YOUR_RAILWAY_BACKEND_URL`

Her şey çalışıyor olmalı! 🚀

