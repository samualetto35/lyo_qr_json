# 🔧 Railway Build Command ile Migration

## ❌ Problem
Railway Dashboard'da terminal bulunamıyor.

## ✅ Çözüm: Build Command'ı Güncelle

Migration'ı build sırasında otomatik çalıştırabiliriz!

---

## 🚀 ADIMLAR

### 1. Railway Dashboard'a Gidin

1. **Railway Dashboard:** https://railway.app
2. Projenize gidin → **`lyo_qr_json`** servisi
3. **Settings** sekmesine tıklayın

### 2. Build Command'ı Güncelleyin

**Settings → Build Command** bölümüne gidin.

**Mevcut:**
```
npm run build
```

**Yeni (Migration ile):**
```
npm run build:with-migration
```

### 3. Redeploy

1. **Deployments** sekmesine gidin
2. En son deployment'ın yanında **"Redeploy"** butonuna tıklayın
3. Veya yeni bir commit yapın (GitHub'dan otomatik deploy)

---

## ✅ Build Logs'ta Göreceksiniz

Redeploy sonrası **Build Logs**'ta şunu göreceksiniz:

```
✔ Generated Prisma Client
✔ Applied migration `20251122154605_init`
✅ Migrations applied successfully
```

---

## 🌱 Seed Data (Manuel - İlk Kez)

Migration otomatik çalışacak ama seed data için:

**Railway CLI ile (eğer login yaptıysanız):**
```bash
railway run --service lyo_qr_json -- cd backend && npm run prisma:seed
```

**VEYA Railway Dashboard'da:**
- Settings → **Start Command**'a ekleyebiliriz (ama her restart'ta çalışır, önerilmez)

**VEYA ilk deployment'tan sonra Railway CLI ile:**
```bash
railway login
railway link -p e50ddb9e-2c14-439d-9f5f-b6f6b60c0e27
railway run --service lyo_qr_json -- cd backend && npm run prisma:seed
```

---

## 📝 Alternatif: Start Command'a Seed Eklemek (Önerilmez)

Eğer seed'i de otomatik yapmak isterseniz (sadece ilk deployment için):

**Settings → Start Command:**
```bash
cd backend && (npm run prisma:seed || true) && npm run start:prod
```

Bu komut:
- Seed çalıştırır (hata olsa bile devam eder - `|| true`)
- Sonra backend'i başlatır

**⚠️ Not:** Bu her restart'ta seed çalıştırır, ama seed idempotent (tekrar çalıştırılabilir).

---

## 🎯 Önerilen Yol

1. ✅ **Build Command:** `npm run build:with-migration` (migration otomatik)
2. ✅ **Seed:** İlk deployment'tan sonra Railway CLI ile manuel çalıştırın

---

**Railway Dashboard → Settings → Build Command'ı güncelleyin ve Redeploy yapın!** 🚀

