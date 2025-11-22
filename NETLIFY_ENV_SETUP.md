# 🌐 Netlify Environment Variables Setup

## Backend URL
```
NEXT_PUBLIC_API_URL=https://lyoqrjson-production.up.railway.app/api/v1
```

## Netlify'de Environment Variable Ekleme

1. Netlify Dashboard → Site Settings → Environment variables
2. "Add a variable" butonuna tıkla
3. Şunu ekle:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://lyoqrjson-production.up.railway.app/api/v1`
   - **Scopes:** All scopes (production, preview, branch deploys)
4. "Save" butonuna tıkla
5. Site'yi redeploy et (Deploys → Trigger deploy → Deploy site)

---

## Railway'de FRONTEND_URL Setup

Railway Dashboard → Backend Service → Variables sekmesine gidin ve şunu ekleyin/güncelleyin:

```
FRONTEND_URL=https://lyoqr.netlify.app
```

Railway otomatik olarak backend'i restart edecek.

