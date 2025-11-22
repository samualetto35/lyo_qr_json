# 🧪 Railway Backend Test Checklist

## ✅ Backend URL'inizi alın:
Railway → `lyo_qr_json` → Settings → Domain
**Backend URL:** `https://____________________.railway.app`

## 🔍 Test Adımları:

### 1. Backend Health Check
```bash
curl https://your-backend.railway.app/api/v1
```

**Beklenen:** JSON response veya 404 (normal, çünkü root endpoint yok)

### 2. Admin Login Test
```bash
curl -X POST https://your-backend.railway.app/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qrattendance.com","password":"admin123"}'
```

**Beklenen:** 
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {...}
}
```

### 3. Browser'da Test
Backend URL'ini browser'da açın:
`https://your-backend.railway.app/api/v1`

---

## 📋 Default Login Credentials:

- **Admin:** `admin@qrattendance.com` / `admin123`
- **Teacher:** `teacher@qrattendance.com` / `teacher123`

---

## 🚨 Eğer Hata Alırsanız:

### Database Migration Çalıştırın:
Railway → `lyo_qr_json` → Terminal (Shell açın):
```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

### Environment Variables Kontrol:
- [ ] DATABASE_URL var mı?
- [ ] JWT_ACCESS_SECRET var mı?
- [ ] JWT_REFRESH_SECRET var mı?
- [ ] NODE_ENV=production var mı?

---

## ✅ Başarılı Olduysa:

Backend çalışıyor demektir! Şimdi Netlify'de frontend'i deploy edelim.

