# 📋 Daily Report System

ระบบ Daily Report สำหรับ IT Operations — รองรับ Network Speed Test, UPS Check, Room Check และ Server Room Monitoring

## Stack
- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: PostgreSQL บน Railway
- **Deploy**: Vercel
- **Speed Test**: Cloudflare Speed (open source, ไม่ต้องใช้ API Key)

---

## 🚀 วิธี Deploy

### 1. สร้าง Database บน Railway

1. ไปที่ [railway.app](https://railway.app) → New Project → PostgreSQL
2. เข้าไปที่ PostgreSQL service → **Connect** tab
3. Copy **DATABASE_URL** (รูปแบบ: `postgresql://...`)

### 2. Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → New Project → Import repository
3. เพิ่ม Environment Variable:
   ```
   DATABASE_URL = postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```
4. กด **Deploy**

### 3. Run Database Migration

หลัง Deploy สำเร็จ ให้รัน migration ผ่าน Vercel CLI หรือ Railway Shell:

```bash
npx prisma db push
```

หรือใช้ Railway Shell:
```bash
# ใน Railway project terminal
npx prisma migrate deploy
```

---

## 💻 Local Development

```bash
# 1. Clone และติดตั้ง dependencies
npm install

# 2. สร้างไฟล์ .env.local
cp .env.example .env.local
# แก้ DATABASE_URL ให้ถูกต้อง

# 3. Push schema ไป database
npx prisma db push

# 4. รัน dev server
npm run dev
```

เปิด http://localhost:3000

---

## 📁 โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── api/
│   │   ├── speedtest/route.ts   # Speed test endpoint (Cloudflare)
│   │   └── reports/route.ts     # Save/Get reports (PostgreSQL)
│   ├── page.tsx                 # Main form page
│   ├── page.module.css          # Styles
│   ├── layout.tsx
│   └── globals.css
└── lib/
    ├── prisma.ts                # Prisma client
    └── types.ts                 # TypeScript types

prisma/
└── schema.prisma               # Database schema
```

---

## 🌐 Speed Test

ใช้ **Cloudflare Speed** endpoint ซึ่งเป็น open source และไม่มีค่าใช้จ่าย:
- Download: `https://speed.cloudflare.com/__down`
- Upload: `https://speed.cloudflare.com/__up`

ทำการทดสอบจาก server (Vercel Edge) ดังนั้นความเร็วที่ได้คือความเร็วจาก server ไป Cloudflare
หากต้องการทดสอบจาก client จริง ให้ย้าย speed test logic มาทำงานใน browser

---

## 🔧 Self-hosted Speed Test (Optional)

ถ้าต้องการ speed test server ในเครือข่ายภายใน ให้ติดตั้ง [LibreSpeed](https://github.com/librespeed/speedtest) ด้วย Docker:

```bash
docker run -d -p 8080:80 adolfintel/speedtest
```

แล้วแก้ไข `src/app/api/speedtest/route.ts` ให้ชี้ไปที่ `http://YOUR_SERVER:8080`

---

## 📊 Database Schema

| Table | Fields |
|-------|--------|
| `daily_reports` | id, date, tempIn, tempOut, humidity, remark |
| `network_tests` | location, downloadMbps, uploadMbps, remark |
| `ups_checks` | building, backupMin, tempC, remark |
| `room_checks` | roomNumber, tvOk, telOk, internetDown, internetUp, remark |
