# bytemc.uz

ByteMC community sayti (Vite + React + Express backend). Frontend Vercel’da statik sifatida joylanadi, backend esa VPS yoki boshqa hostingda 24/7 ishlaydi.

## Lokal ishga tushirish
- `npm install`
- Frontend: `npm run dev` (port `9090`)
- Backend: `npm run server` (port `4000`)

## Muhit sozlamalari (.env)
Frontend uchun muhim o‘zgaruvchilar:
- `VITE_API_URL` — backend API manzili (masalan: `https://api.bytemc.uz` yoki VPS IP:port)
- `JWT_SECRET` — tokenlar uchun maxfiy kalit

Backend uchun (server/index.js foydalanadi):
- `LITEBANS_DB_HOST`, `LITEBANS_DB_PORT`, `LITEBANS_DB_USER`, `LITEBANS_DB_PASS`, `LITEBANS_DB_NAME`
- `LITEBANS_TABLE_PREFIX` (masalan: `litebans_`)
- `MC_HOST`, `MC_PORT`

`.env` fayli repositoryga kiritilmaydi (gitignore’ga qo‘shilgan).

## Vercel deploy (Frontend)
1. GitHub repo’ga push qiling (quyida ko‘rsatilgan).
2. Vercel’da “New Project” → GitHub repo tanlang.
3. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables (Production):
   - `VITE_API_URL` → backend’ning to‘liq URL’i.
5. SPA routing ishlashi uchun `vercel.json` qo‘shildi: barcha yo‘llar `index.html`ga rewrite qilinadi.

Eslatma: Express backend’ni Vercel’da doimiy ishlatish tavsiya etilmaydi. Backend’ni VPS/Render/Railway’da ishga tushiring, frontend esa Vercel’da.

## Git (boshlash va push)
- `git init`
- `git add .`
- `git commit -m "first commit"`
- `git branch -M main`
- `git remote add origin https://github.com/muhammadsolih112/bytemc.uz.git`
- `git push -u origin main`

## Gitignore
Loyihada quyidagilar e’tiborsiz:
- `node_modules/`, `dist/`, `.env`, `.vercel/`, `coverage/`, `build/`, IDE/OS fayllari
- `public/uploads/*` (faqat `.gitkeep` saqlanadi)

## Muhim
- Frontendda `vite.config.ts` da `base: "/bytemc/"` belgilangan. Domen ildizida xizmat ko‘rsatishda asset yo‘llari to‘g‘ri bo‘lishi uchun bu sozlama mos keladi. Agar `home`ni `/` dan ko‘rsatmoqchi bo‘lsangiz, `base`ni `/` ga o‘zgartiring va yo‘llarni qayta tekshiring.
- Backend URL’ini to‘g‘ri kiriting; aks holda UI sahifalaridagi ma’lumotlar ko‘rinmaydi.