# 🔧 Railway Terminal Açma - Alternatif Yollar

## ❌ "Open Shell" Bulunamıyor

Railway arayüzü farklı olabilir. İşte alternatif yollar:

---

## ✅ YOL 1: Railway CLI ile Terminal (Önerilen)

### Adım 1: Railway CLI Login

Terminal'inizde (local):

```bash
railway login
```

Bu komut browser açacak, Railway hesabınızla login yapın.

### Adım 2: Projeyi Link Et

```bash
cd /Users/a.sametyildiz/lyo_qr_json
railway link -p e50ddb9e-2c14-439d-9f5f-b6f6b60c0e27
```

### Adım 3: Migration Çalıştır

```bash
railway run --service lyo_qr_json -- cd backend && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed
```

---

## ✅ YOL 2: Railway Dashboard - Farklı Yerler

### A) Service Sayfasında "Terminal" Sekmesi

1. Railway Dashboard → `lyo_qr_json` servisi
2. Üst menüde **"Terminal"** sekmesi var mı kontrol edin
3. Veya **"Shell"** sekmesi

### B) Settings'te Terminal

1. Railway Dashboard → Service → **Settings**
2. **"Terminal"** veya **"Shell"** seçeneği var mı?

### C) Service Detay Sayfasında

1. Railway Dashboard → Service
2. Sağ üstte veya alt kısımda terminal ikonu var mı?

---

## ✅ YOL 3: Railway CLI Shell Komutu

Eğer Railway CLI'ye login yaptıysanız:

```bash
railway shell
```

Bu komut Railway container'ına bağlanır.

---

## ✅ YOL 4: Build Logs Üzerinden

1. Railway Dashboard → Service → **"Deployments"**
2. En son deployment'a tıklayın
3. **"Build Logs"** veya **"Deploy Logs"** sekmesinde terminal var mı?

---

## ✅ YOL 5: Railway Dashboard - Service Settings

1. Railway Dashboard → Service → **Settings**
2. **"Root Directory"** altında terminal seçeneği var mı?
3. Veya **"Deploy"** sekmesinde terminal var mı?

---

## 🎯 EN KOLAY YOL: Railway CLI

Eğer Railway Dashboard'da terminal bulamıyorsanız, **Railway CLI** kullanın:

```bash
# 1. Login (browser açılacak)
railway login

# 2. Projeyi link et
cd /Users/a.sametyildiz/lyo_qr_json
railway link -p e50ddb9e-2c14-439d-9f5f-b6f6b60c0e27

# 3. Migration çalıştır
railway run --service lyo_qr_json -- cd backend && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed
```

---

## 📸 Railway Dashboard Görüntüsü

Railway Dashboard'da şunları kontrol edin:

- **Service sayfası:** Üst menüde "Terminal", "Shell", "Console" sekmeleri
- **Deployments:** Her deployment'ın yanında terminal ikonu
- **Settings:** Terminal veya Shell ayarları
- **Activity:** Logların yanında terminal butonu

---

## 💡 Alternatif: Railway Web Terminal

Bazı Railway planlarında web terminal olmayabilir. Bu durumda:

1. **Railway CLI kullanın** (en garantili yol)
2. Veya **Railway Dashboard → Settings → Build Command**'a migration ekleyin

---

**Hangi yolu denediniz? Railway CLI ile devam edelim mi?** 🚀

