# 🏥 PTH-X-P — ระบบจัดการคลินิกกายภาพบำบัด

ระบบจัดการคลินิกกายภาพบำบัดแบบครบวงจร พัฒนาด้วย Node.js + Express.js + EJS รองรับการบริหารข้อมูลผู้ป่วย การตรวจร่างกาย การวินิจฉัย การรักษา และการออกใบเสร็จ พร้อมระบบจัดการสิทธิ์ผู้ใช้งานหลายระดับ

---

## ✨ ฟีเจอร์หลัก

| โมดูล | รายละเอียด |
|-------|-----------|
| 🔐 Authentication | เข้าสู่ระบบด้วย Passport.js + bcrypt, จัดการ session |
| 👥 Patient Management | ลงทะเบียนผู้ป่วย, ค้นหาด้วยหมายเลข HN, ดูประวัติ |
| 🩺 Medical Form | บันทึกข้อมูลการแพทย์เบื้องต้น, ประวัติการรักษา |
| 🔬 Examination | ตรวจร่างกายผู้ป่วย, บันทึกผลการตรวจ |
| 📋 Diagnosis | วินิจฉัยโรค, ดูประวัติการวินิจฉัย |
| 💊 Procedure | บันทึกหัตถการการรักษา, ประวัติการรักษา |
| 📊 PT Data | บันทึกข้อมูลนักกายภาพบำบัด |
| 💰 Billing | ออกใบเสร็จ, อัปเดตสถานะการชำระเงิน |
| 📅 Appointment | นัดหมายผู้ป่วย, แก้ไข/ยกเลิกนัด |
| ⚙️ Admin | จัดการผู้ใช้งานในระบบ (เฉพาะ Admin) |

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **View Engine:** EJS
- **Database:** MySQL / MariaDB (Connection Pool)
- **Auth:** Passport.js (Local Strategy), bcryptjs, express-session
- **PDF:** Puppeteer
- **อื่นๆ:** dotenv, connect-flash, method-override

---

## 👤 ระดับสิทธิ์ผู้ใช้

| Role | สิทธิ์ |
|------|--------|
| `admin` | เข้าถึงได้ทุกโมดูล รวมถึงจัดการผู้ใช้ |
| `physical_therapist` | ตรวจ, วินิจฉัย, รักษา, นัดหมาย, ออกใบเสร็จ |
| `staff` | ลงทะเบียนผู้ป่วย, บันทึกข้อมูลเบื้องต้น, นัดหมาย |

---

## 🚀 การติดตั้งและรันโปรเจกต์

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/rapepan/Project-Pth-X-P.git
cd Project-Pth-X-P
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=pth_x_p
DB_CHARSET=utf8mb4
DB_TIMEZONE=+07:00
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT=60000

# Session
SESSION_SECRET=your_secret_key
SESSION_NAME=connect.sid
SESSION_MAX_AGE=86400000

# Timezone
TZ=Asia/Bangkok

# Optional
TRUST_PROXY=false
DEVELOPED_BY=Developed by JIM
```

### 4. สร้างฐานข้อมูล

นำเข้า SQL schema เข้า MySQL/MariaDB ก่อนรัน server

### 5. รันโปรเจกต์

```bash
# Development (auto-reload)
npm start

# Production
NODE_ENV=production node app.js
```

เปิด browser ที่ `http://localhost:3000`

---

## 📁 โครงสร้างโปรเจกต์

```
Project-Pth-X-P/
├── config/
│   └── db.js               # Database connection pool
├── controllers/             # Business logic แต่ละโมดูล
│   ├── authController.js
│   ├── patientController.js
│   ├── medicalController.js
│   ├── examinationController.js
│   ├── diagnosisController.js
│   ├── procedureController.js
│   ├── ptDataController.js
│   ├── billingController.js
│   ├── appointmentController.js
│   └── adminController.js
├── middleware/
│   └── authMiddleware.js    # ตรวจสอบสิทธิ์ผู้ใช้
├── models/                  # Database queries
├── routes/                  # Express routes
├── views/                   # EJS templates
├── public/                  # Static files (CSS, JS, images)
├── utils/                   # Helper functions
├── app.js                   # Entry point
└── package.json
```

---

## 🔍 Health Check

ระบบมี endpoint สำหรับตรวจสอบสถานะ server:

```
GET /health
```

ตัวอย่าง response:

```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 120.5,
  "environment": "production",
  "database": "connected",
  "memory": {
    "used": "45 MB",
    "total": "64 MB"
  }
}
```

---

## ⚙️ CI/CD Pipeline

โปรเจกต์นี้ใช้ **GitHub Actions** สำหรับ CI/CD อัตโนมัติ ประกอบด้วย 2 workflow:

### 🔍 CI — Lint & Syntax Check (`ci.yml`)

ทำงานทุกครั้งที่ **push ทุก branch** หรือเปิด **Pull Request เข้า main**

```
Push / PR → ติดตั้ง dependencies → ตรวจ syntax JS ทุกไฟล์ → ✅ หรือ ❌
```

### 🚀 CD — Deploy to Render (`cd.yml`)

ทำงานเฉพาะเมื่อ **push to `main`** เท่านั้น

```
Push to main → Trigger Render Deploy Hook → รอ 60s → Health Check /health → ✅ หรือ ❌
```

### 🔧 วิธีตั้งค่า

**1. วางไฟล์ workflow ลงใน repo**

```
.github/
└── workflows/
    ├── ci.yml
    └── cd.yml
```

**2. ตั้งค่า GitHub Secrets**

ไปที่ **Settings → Secrets and variables → Actions** แล้วเพิ่ม:

| Secret | ค่า |
|--------|-----|
| `RENDER_DEPLOY_HOOK_URL` | Deploy Hook URL จาก Render (Settings → Deploy Hook) |
| `APP_URL` | URL ของ app เช่น `https://project-pth-x-p.onrender.com` |

**3. สร้าง Web Service บน Render**

- สมัคร [render.com](https://render.com) → New → Web Service → เชื่อมกับ repo นี้
- ตั้งค่า Start Command: `node app.js`
- เพิ่ม Environment Variables ตามหัวข้อด้านบน
- Copy Deploy Hook URL มาใส่ใน GitHub Secrets

---

## 📄 License

ISC

---

> พัฒนาโดย **RAPEPAN** — โปรเจกต์ปริญญาตรี สาขา Information Technology for Digital Industry มหาวิทยาลัยบูรพา