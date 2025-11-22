# 🚀 Quick Deployment Start Guide

## ✅ Railway Backend (Hazır)
- **URL:** `https://lyoqrjson-production.up.railway.app`
- **Status:** ✅ Deployed

## 🔧 Railway Settings Güncellemesi

Railway Dashboard → Backend Service → Variables sekmesine gidin ve şunu ekleyin/güncelleyin:

```
FRONTEND_URL=https://lyoqr.netlify.app
```

**Not:** Bu variable yoksa veya yanlışsa CORS hatası alırsınız!

---

## 🌐 Netlify Frontend Deployment

### Adım 1: Netlify'de Site Oluştur

1. **Netlify'a Git:** [netlify.com](https://netlify.com) → Sign Up/Login (GitHub ile)

2. **Yeni Site:**
   - "Add new site" → "Import an existing project"
   - GitHub repository: `samualetto35/lyo_qr_json`

3. **Build Ayarları:**
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/.next`

4. **Environment Variables:**
   - Site settings → Environment variables → "Add a variable"
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://lyoqrjson-production.up.railway.app/api/v1`
   - **Scopes:** All scopes (production, preview, branch deploys)

5. **Site Name:**
   - Site settings → General → Site details
   - "Change site name" → `lyoqr`
   - **Site URL:** `https://lyoqr.netlify.app`

6. **Deploy:** "Deploy site" butonuna tıklayın

---

### Adım 2: Test

1. Site deploy olduktan sonra: `https://lyoqr.netlify.app`
2. Admin login test:
   - Email: `admin@qrattendance.com`
   - Password: `admin123`
3. Teacher login test:
   - Email: `teacher@qrattendance.com`
   - Password: `teacher123`

---

## ✅ Checklist

- [ ] Railway'de `FRONTEND_URL=https://lyoqr.netlify.app` set edildi
- [ ] Netlify'de site oluşturuldu
- [ ] Netlify'de `NEXT_PUBLIC_API_URL` environment variable eklendi
- [ ] Site name `lyoqr` olarak ayarlandı
- [ ] Deploy başarılı oldu
- [ ] Login test edildi

---

## 🚨 Sorun Giderme

### CORS Hatası
**Sorun:** Browser'da CORS hatası görüyorum

**Çözüm:**
1. Railway'de `FRONTEND_URL=https://lyoqr.netlify.app` set edildiğinden emin olun
2. Railway backend servisini restart edin

### API Connection Error
**Sorun:** Frontend backend'e bağlanamıyor

**Çözüm:**
1. Netlify'de `NEXT_PUBLIC_API_URL` doğru mu kontrol edin
2. Railway backend URL'ini test edin: `https://lyoqrjson-production.up.railway.app/api/v1`
3. Netlify site'yi redeploy edin

### Build Error
**Sorun:** Netlify build başarısız

**Çözüm:**
1. Build loglarını kontrol edin
2. `netlify.toml` dosyasının doğru olduğundan emin olun
3. Local'de test edin: `cd frontend && npm run build`

---

## 🎉 Başarılı!

Deploy tamamlandıktan sonra:
- **Frontend:** `https://lyoqr.netlify.app`
- **Backend:** `https://lyoqrjson-production.up.railway.app`

Her şey çalışıyor! 🚀

