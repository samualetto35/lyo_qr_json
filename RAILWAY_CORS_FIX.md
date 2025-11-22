
# 🚨 Railway CORS Hatası Düzeltme

## Sorun
Netlify frontend'den Railway backend'e istek yapılamıyor:
```
Access to XMLHttpRequest blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

## Çözüm

### Adım 1: Railway'de FRONTEND_URL Variable'ını Ekle

1. **Railway Dashboard'a git:** [railway.app](https://railway.app)
2. **Backend servisinize tıklayın** (`lyoqrjson-production`)
3. **Variables** sekmesine gidin
4. **"New Variable"** butonuna tıklayın
5. Şunu ekleyin:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://lyoqr.netlify.app`
6. **Save** butonuna tıklayın

### Adım 2: Backend'i Restart Et

Railway otomatik olarak restart edecek, ama manuel restart için:
1. **Deployments** sekmesine gidin
2. **"Redeploy"** butonuna tıklayın

### Adım 3: Test Et

1. Netlify frontend'i aç: `https://lyoqr.netlify.app`
2. Admin login yap:
   - Email: `admin@qrattendance.com`
   - Password: `admin123`

Artık CORS hatası olmamalı! ✅

---

## Port Çakışması (EADDRINUSE)

Bu hatayı görüyorsanız:
```
Error: listen EADDRINUSE: address already in use :::3001
```

Bu normal bir Railway restart loop'u olabilir. Railway otomatik olarak PORT environment variable'ını verir ve backend bunu kullanır. Birkaç saniye bekleyin, otomatik olarak düzelecektir.

Eğer hata devam ederse:
1. Railway'de **Variables** sekmesine gidin
2. `PORT` variable'ının set olduğundan emin olun (Railway otomatik verir)
3. Backend'i **Redeploy** edin

