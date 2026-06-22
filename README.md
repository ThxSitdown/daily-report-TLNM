# IT Daily Report System

ระบบ Daily Report สำหรับ 3 โรงแรม: Travelodge Nimman, Eastin Tan, U Nimman

## Stack
Next.js 14 · PostgreSQL (Railway) · Vercel · JWT Auth · Prisma

---

## 🚀 Deploy Steps

### 1. Railway — สร้าง PostgreSQL
New Project → Add PostgreSQL → Copy `DATABASE_URL`

### 2. Vercel — ตั้ง Environment Variables
```
DATABASE_URL = postgresql://...
JWT_SECRET   = your-random-secret-string-min-32-chars
```

### 3. Deploy
Push to GitHub → Vercel auto-deploy

### 4. สร้าง Admin (ทำครั้งแรกครั้งเดียว)
หลัง deploy เสร็จ เปิด browser ไปที่:
```
https://your-app.vercel.app/api/seed
```
จะสร้าง admin / Tlcmn@1122 ให้อัตโนมัติ

### 5. Database Migration
```bash
npx prisma db push
```

---

## 👤 Default Account
| Username | Password    | Role  |
|----------|-------------|-------|
| admin    | Tlcmn@1122  | Admin |

Admin เป็นคนเพิ่ม User เท่านั้น ผ่านหน้า /admin

---

## ✨ Features
- 🔐 Login / JWT Cookie Session (7 วัน)
- 🏨 เลือกโรงแรม: Travelodge / Eastin+U Nimman
- 📶 Network Speed Test (client-side, Cloudflare)
- 💾 Auto-save Draft ทุก 2 วินาที → เก็บใน PostgreSQL
- 🔄 Cross-device: เปิดคอมหรือมือถือ ข้อมูลยังอยู่
- 📋 Copy report text ได้ทันที
- 🗑️ Clear data พร้อม confirm modal

---

## 🗂️ Routes
| Path | ใช้ทำอะไร |
|------|-----------|
| /login | หน้า Login |
| /select | เลือกโรงแรม |
| /travelodge | Daily Report ของ Travelodge |
| /eastin-u | Daily Report ของ Eastin + U Nimman |
| /admin | จัดการ User (Admin เท่านั้น) |
| /api/seed | สร้าง admin ครั้งแรก |

---

## 🔄 Draft Flow
```
กรอกข้อมูล → debounce 2s → POST /api/drafts → PostgreSQL
เปิดหน้าใหม่ → GET /api/drafts → โหลดข้อมูลเดิม
กดส่ง Report → POST /api/reports → บันทึกถาวร
กด Clear → DELETE /api/drafts + reset form
```
