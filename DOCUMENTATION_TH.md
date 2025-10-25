# เอกสารคู่มือระบบ PTH-X-P
## ระบบจัดการคลินิกกายภาพบำบัด (Physical Therapy Clinic Management System)

---

## สารบัญ

1. [ภาพรวมของระบบ](#1-ภาพรวมของระบบ)
2. [เทคโนโลยีที่ใช้](#2-เทคโนโลยีที่ใช้)
3. [โครงสร้างของระบบ](#3-โครงสร้างของระบบ)
4. [ฐานข้อมูล](#4-ฐานข้อมูล)
5. [โมเดลข้อมูล](#5-โมเดลข้อมูล)
6. [การทำงานของแต่ละโมดูล](#6-การทำงานของแต่ละโมดูล)
7. [ระบบ Authentication และสิทธิ์การใช้งาน](#7-ระบบ-authentication-และสิทธิ์การใช้งาน)
8. [ขั้นตอนการใช้งาน](#8-ขั้นตอนการใช้งาน)
9. [คู่มือสำหรับผู้พัฒนา](#9-คู่มือสำหรับผู้พัฒนา)
10. [การติดตั้งและ Deploy](#10-การติดตั้งและ-deploy)

---

## 1. ภาพรวมของระบบ

### 1.1 วัตถุประสงค์
ระบบ PTH-X-P เป็นระบบจัดการคลินิกกายภาพบำบัดแบบครบวงจร ที่พัฒนาขึ้นเพื่อช่วยให้การบริหารจัดการคลินิกกายภาพบำบัดเป็นไปอย่างมีประสิทธิภาพ ครอบคลุมตั้งแต่การลงทะเบียนผู้ป่วย การนัดหมาย การตรวจร่างกาย การวินิจฉัย การรักษา ไปจนถึงการเรียกเก็บเงิน

### 1.2 คุณสมบัติหลัก
- **การจัดการข้อมูลผู้ป่วย** - ลงทะเบียน ค้นหา และจัดเก็บข้อมูลผู้ป่วย
- **การนัดหมาย** - จัดการนัดหมายพร้อมตรวจสอบการชนกัน
- **ประวัติการรักษา** - บันทึกประวัติทางการแพทย์และอาการ
- **การตรวจร่างกาย** - บันทึกผลการตรวจแบบละเอียด (ROM, MMT, Sensory, etc.)
- **การวินิจฉัย** - บันทึกการวินิจฉัยพร้อม ICD-10 Code
- **ขั้นตอนการรักษา** - จัดการขั้นตอนการรักษาต่างๆ
- **ข้อมูล PT** - ข้อมูลการประเมินของนักกายภาพบำบัด
- **การเรียกเก็บเงิน** - สร้างบิลและติดตามสถานะการชำระเงิน
- **รายงานและสถิติ** - รายงานสรุปต่างๆ สำหรับผู้บริหาร
- **จัดการผู้ใช้** - ระบบบริหารจัดการผู้ใช้พร้อม Role-based Access Control

### 1.3 จำนวนโค้ด
- **โค้ดหลัก:** ประมาณ 6,345 บรรทัด
- **ไฟล์ Controller:** 11 ไฟล์ (4,127 บรรทัด)
- **ไฟล์ Model:** 11 ไฟล์ (2,048 บรรทัด)
- **ไฟล์ Route:** 11 ไฟล์ (563 บรรทัด)
- **ไฟล์ View (EJS):** 29 ไฟล์
- **CSS Files:** 26 ไฟล์ (412 KB)
- **JavaScript Files:** 9 ไฟล์ (112 KB)

---

## 2. เทคโนโลยีที่ใช้

### 2.1 Backend
| เทคโนโลยี | Version | หน้าที่ |
|----------|---------|---------|
| Node.js | - | Runtime Environment |
| Express.js | 4.21.2 | Web Framework |
| MySQL | 3.13.0 | ฐานข้อมูล |
| Passport.js | - | Authentication |
| bcryptjs | 3.0.2 | เข้ารหัสรหัสผ่าน |
| express-session | 1.18.1 | จัดการ Session |
| Puppeteer | 24.24.1 | สร้างไฟล์ PDF |
| dotenv | 16.4.7 | จัดการ Environment Variables |

### 2.2 Frontend
| เทคโนโลยี | หน้าที่ |
|----------|---------|
| EJS | Template Engine สำหรับ Render หน้าเว็บ |
| Vanilla JavaScript | การทำงานฝั่ง Client |
| CSS3 | การจัดรูปแบบและ Responsive Design |

### 2.3 Middleware & Utilities
- **method-override** (3.0.0) - รองรับ HTTP Method PUT/DELETE
- **body-parser** (2.2.0) - แปลงข้อมูลจาก Request
- **connect-flash** (0.1.1) - แสดง Flash Messages
- **Nodemon** (3.1.10) - Auto-reload ในโหมด Development

---

## 3. โครงสร้างของระบบ

### 3.1 สถาปัตยกรรม
ระบบใช้แบบ **MVC (Model-View-Controller)** แบ่งออกเป็น:

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Request
                       ↓
┌─────────────────────────────────────────────────────┐
│              Express.js Middleware                   │
│  ┌───────────────────────────────────────────────┐  │
│  │ Session Management (express-session)          │  │
│  │ Authentication (Passport.js)                  │  │
│  │ Authorization (authMiddleware)                │  │
│  │ Body Parser, Flash Messages                   │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│                   Routes Layer                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ authRoutes, patientRoutes, appointmentRoutes│    │
│  │ medicalRoutes, examinationRoutes, ...       │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│                Controllers Layer                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Business Logic & Data Processing            │    │
│  │ - authController, patientController         │    │
│  │ - examinationController, billingController  │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│                   Models Layer                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ Database Queries & Data Operations          │    │
│  │ - UserModel, PatientModel                   │    │
│  │ - ExaminationModel, BillingModel            │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│                 MySQL Database                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ Connection Pool (10 connections)            │    │
│  │ Host: 10.104.21.17:3306                     │    │
│  │ Database: pth-x-p                           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3.2 โครงสร้างไฟล์และโฟลเดอร์

```
Project Pth-X-P/
│
├── app.js                      # ไฟล์หลักของแอปพลิเคชัน
├── package.json                # ข้อมูล Dependencies
├── .env                        # ตั้งค่า Environment Variables
│
├── config/                     # ไฟล์ Configuration
│   ├── db.js                   # การเชื่อมต่อฐานข้อมูล
│   └── passportConfig.js       # ตั้งค่า Authentication
│
├── middleware/                 # Express Middleware
│   └── authMiddleware.js       # ตรวจสอบสิทธิ์และ Roles
│
├── models/                     # Data Models (11 ไฟล์)
│   ├── userModel.js            # จัดการข้อมูลผู้ใช้
│   ├── patientModel.js         # จัดการข้อมูลผู้ป่วย
│   ├── appointmentModel.js     # จัดการนัดหมาย
│   ├── medicalModel.js         # ประวัติการรักษา
│   ├── examinationModel.js     # ผลการตรวจร่างกาย
│   ├── diagnosisModel.js       # การวินิจฉัย
│   ├── procedureModel.js       # ขั้นตอนการรักษา
│   ├── billingModel.js         # การเรียกเก็บเงิน
│   ├── ptDataModel.js          # ข้อมูล PT
│   ├── statsModel.js           # สถิติต่างๆ
│   └── serviceModel.js         # บริการและราคา
│
├── controllers/                # Business Logic (11 ไฟล์)
│   ├── authController.js       # Login/Logout/Profile
│   ├── patientController.js    # จัดการผู้ป่วย
│   ├── appointmentController.js# จัดการนัดหมาย
│   ├── medicalController.js    # ประวัติการรักษา
│   ├── examinationController.js# การตรวจร่างกาย
│   ├── diagnosisController.js  # การวินิจฉัย
│   ├── procedureController.js  # การรักษา
│   ├── billingController.js    # การเรียกเก็บเงิน
│   ├── ptDataController.js     # ข้อมูล PT
│   ├── adminController.js      # Admin Panel
│   └── userController.js       # จัดการผู้ใช้
│
├── routes/                     # API Routes (11 ไฟล์)
│   ├── authRoutes.js           # เส้นทาง Authentication
│   ├── patientRoutes.js        # เส้นทางผู้ป่วย
│   ├── appointmentRoutes.js    # เส้นทางนัดหมาย
│   ├── medicalRoutes.js        # เส้นทางประวัติการรักษา
│   ├── examinationRoutes.js    # เส้นทางการตรวจ
│   ├── diagnosisRoutes.js      # เส้นทางการวินิจฉัย
│   ├── procedureRoutes.js      # เส้นทางการรักษา
│   ├── billingRoutes.js        # เส้นทางการเรียกเก็บเงิน
│   ├── ptDataRoutes.js         # เส้นทางข้อมูล PT
│   ├── adminRoutes.js          # เส้นทาง Admin
│   └── userRoutes.js           # เส้นทางผู้ใช้
│
├── views/                      # หน้าเว็บ EJS Templates (29 ไฟล์)
│   ├── admin/                  # หน้าจัดการระบบ
│   │   ├── users.ejs           # รายการผู้ใช้
│   │   ├── createUser.ejs      # สร้างผู้ใช้ใหม่
│   │   ├── editUser.ejs        # แก้ไขผู้ใช้
│   │   └── reports.ejs         # รายงาน
│   ├── login.ejs               # หน้า Login
│   ├── index.ejs               # Dashboard
│   ├── profile.ejs             # โปรไฟล์ผู้ใช้
│   ├── patients.ejs            # รายการผู้ป่วย
│   ├── patientForm.ejs         # ฟอร์มลงทะเบียนผู้ป่วย
│   ├── appointments.ejs        # รายการนัดหมาย
│   ├── appointmentForm.ejs     # ฟอร์มนัดหมาย
│   ├── appointmentDetail.ejs   # รายละเอียดนัดหมาย
│   ├── appointmentCard.ejs     # บัตรนัดหมาย
│   ├── medicalFrom.ejs         # ฟอร์มประวัติการรักษา
│   ├── medicaHistory.ejs       # ประวัติการรักษา
│   ├── examinationroom.ejs     # ห้องตรวจ
│   ├── patientexamination.ejs  # ผลการตรวจผู้ป่วย
│   ├── examinationHistory.ejs  # ประวัติการตรวจ
│   ├── examinationDetail.ejs   # รายละเอียดการตรวจ
│   ├── examinationPrint.ejs    # พิมพ์ผลการตรวจ
│   ├── billing.ejs             # ฟอร์มบิล
│   ├── billHistory.ejs         # ประวัติบิล
│   ├── billDetail.ejs          # รายละเอียดบิล
│   ├── diagnosis.ejs           # ฟอร์มการวินิจฉัย
│   ├── procedure.ejs           # ฟอร์มการรักษา
│   ├── ptData.ejs              # ฟอร์มข้อมูล PT
│   └── error.ejs               # หน้า Error
│
├── public/                     # Static Files
│   ├── css/                    # Stylesheets (26 ไฟล์)
│   │   ├── login.css
│   │   ├── index.css
│   │   ├── admin.css
│   │   ├── patients.css
│   │   ├── appointments.css
│   │   ├── billing.css
│   │   └── ...
│   └── js/                     # Client-side Scripts (9 ไฟล์)
│       ├── appointments.js
│       ├── billing.js
│       ├── patientexamination.js
│       └── ...
│
└── utils/                      # Helper Functions
    ├── pdfGenerator.js         # สร้าง PDF ด้วย Puppeteer
    └── billUtils.js            # ฟังก์ชันช่วยเรื่องบิล
```

---

## 4. ฐานข้อมูล

### 4.1 การเชื่อมต่อฐานข้อมูล

**ไฟล์:** `config/db.js`

**รายละเอียดการเชื่อมต่อ:**
- **Host:** 10.104.21.17
- **Port:** 3306
- **Database:** pth-x-p
- **Character Set:** utf8mb4 (รองรับภาษาไทย)
- **Timezone:** Asia/Bangkok (+07:00)
- **Connection Pool:** 10 connections
- **Timeout:** 60 วินาที

**คุณสมบัติ:**
```javascript
// Connection Pooling
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+07:00',
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000
});

// Promise-based queries
pool.queryAsync = util.promisify(pool.query);

// Transaction support
pool.beginTransaction((err) => { ... });
pool.commit((err) => { ... });
pool.rollback(() => { ... });

// Health check
pool.ping((err) => { ... });
```

### 4.2 ตารางในฐานข้อมูล

| ชื่อตาราง | จำนวนฟิลด์ | หน้าที่ |
|-----------|-----------|---------|
| users | 7 | เก็บข้อมูลผู้ใช้ระบบ |
| patient | ~15 | ข้อมูลผู้ป่วย |
| appointments | ~10 | ข้อมูลการนัดหมาย |
| medicalfrom | ~12 | ประวัติการรักษา |
| patient_examination | ~15 | ผลการตรวจร่างกาย (JSON) |
| diagnosis | ~8 | การวินิจฉัยโรค |
| procedures | ~10 | ขั้นตอนการรักษา |
| billing | ~12 | บิลและการชำระเงิน |
| pt_data | ~8 | ข้อมูลการประเมินของ PT |
| procedure_templates | - | Template การรักษา |
| service_items | - | รายการบริการและราคา |

---

## 5. โมเดลข้อมูล

### 5.1 User Model (`models/userModel.js`)

**ตาราง:** `users`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `username` - ชื่อผู้ใช้ (unique)
- `password` - รหัสผ่านที่เข้ารหัสแล้ว (bcrypt)
- `email` - อีเมล
- `fullname` - ชื่อ-นามสกุล
- `role` - บทบาท (admin, physical_therapist, staff)
- `created_at` - วันที่สร้าง

**Methods:**
```javascript
getUserByUsername(username)       // ค้นหาผู้ใช้ด้วย username
getUserById(id)                   // ค้นหาผู้ใช้ด้วย id
createUser(userData)              // สร้างผู้ใช้ใหม่
updateUser(id, userData)          // อัพเดทข้อมูลผู้ใช้
getAllUsers()                     // ดึงรายการผู้ใช้ทั้งหมด
deleteUser(id)                    // ลบผู้ใช้
checkUserExists(username, email)  // ตรวจสอบว่ามีผู้ใช้นี้แล้ว
```

### 5.2 Patient Model (`models/patientModel.js`)

**ตาราง:** `patient`

**ฟิลด์สำคัญ:**
- `HN` - Hospital Number (รูปแบบ: YY0001, YY = ปีพ.ศ. 2 หลักท้าย)
- `national_id` - เลขบัตรประชาชน (unique)
- `fname` - ชื่อ
- `lname` - นามสกุล
- `gender` - เพศ
- `dob` - วันเกิด
- `age` - อายุ
- `phone` - เบอร์โทร
- `email` - อีเมล
- `address` - ที่อยู่
- `emergency_contact` - ผู้ติดต่อฉุกเฉิน
- `emergency_phone` - เบอร์โทรฉุกเฉิน
- `created_at` - วันที่ลงทะเบียน

**Methods สำคัญ:**
```javascript
// การค้นหา
searchPatientByHN(HN)                 // ค้นหาด้วย HN
searchPatientsByName(name)            // ค้นหาด้วยชื่อ
searchPatientByNationalId(nationalId) // ค้นหาด้วยบัตรประชาชน
getAllPatients()                      // ดึงรายการผู้ป่วยทั้งหมด

// การจัดการ
createPatient(patientData)            // สร้างผู้ป่วยใหม่
updatePatient(HN, patientData)        // อัพเดทข้อมูล
deletePatient(HN)                     // ลบผู้ป่วย

// สถิติ
getTotalCount()                       // จำนวนผู้ป่วยทั้งหมด
getTodayCount()                       // จำนวนผู้ป่วยที่ลงทะเบียนวันนี้
getThisMonthCount()                   // จำนวนผู้ป่วยเดือนนี้
getMonthlyStats(year, month)          // สถิติรายเดือน

// อื่นๆ
generateNextHN()                      // สร้าง HN ใหม่ (Auto-increment)
```

**การสร้าง HN:**
```javascript
// รูปแบบ: YY + running number 4 หลัก
// เช่น ปี 2567 → 670001, 670002, 670003, ...
// ปี 2568 → 680001, 680002, ...
```

### 5.3 Appointment Model (`models/appointmentModel.js`)

**ตาราง:** `appointments`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `patient_name` - ชื่อผู้ป่วย
- `patient_phone` - เบอร์โทร
- `appointment_date` - วันที่นัด
- `appointment_time` - เวลานัด
- `status` - สถานะ (scheduled, confirmed, completed, cancelled, no_show)
- `notes` - หมายเหตุ
- `created_at` - วันที่สร้าง
- `updated_at` - วันที่อัพเดท

**Statuses:**
- `scheduled` - นัดหมายแล้ว
- `confirmed` - ยืนยันแล้ว
- `completed` - เสร็จสิ้น
- `cancelled` - ยกเลิก
- `no_show` - ไม่มาตามนัด

**Methods สำคัญ:**
```javascript
// การจัดการนัดหมาย
createAppointment(data)                      // สร้างนัดหมายใหม่
updateAppointment(id, data)                  // อัพเดทนัดหมาย
deleteAppointment(id)                        // ลบนัดหมาย
updateAppointmentStatus(id, status)          // เปลี่ยนสถานะ

// การค้นหา
getAppointmentById(id)                       // ค้นหาด้วย ID
getAppointmentsByHN(HN)                      // ค้นหาด้วย HN
getAllAppointments()                         // รายการนัดหมายทั้งหมด
getAppointmentsByDate(date)                  // นัดหมายตามวันที่
getAppointmentsByDateRange(startDate, endDate) // นัดหมายในช่วงเวลา
getAppointmentsByStatus(status)              // นัดหมายตามสถานะ

// การตรวจสอบ
checkTimeConflict(date, time, excludeId)     // ตรวจสอบเวลาชน

// สถิติ
getUpcomingAppointments()                    // นัดหมายที่กำลังจะมาถึง
getTodayAppointments()                       // นัดหมายวันนี้
getAppointmentStats()                        // สถิติการนัดหมาย
```

### 5.4 Medical Model (`models/medicalModel.js`)

**ตาราง:** `medicalfrom`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `weight` - น้ำหนัก (kg)
- `height` - ส่วนสูง (cm)
- `bloodPressure` - ความดันโลหิต
- `pulse` - ชีพจร
- `o2Sat` - ออกซิเจนในเลือด (%)
- `respiratoryRate` - อัตราการหายใจ
- `bmi` - ดัชนีมวลกาย (คำนวณอัตโนมัติ)
- `symptoms` - อาการ
- `currentHistory` - ประวัติปัจจุบัน
- `pastHistory` - ประวัติโรคในอดีต
- `created_at` - วันที่บันทึก

**Methods:**
```javascript
createMedicalRecord(data)           // สร้างบันทึกใหม่
getMedicalHistory(HN)               // ดึงประวัติทั้งหมด
getMedicalHistoryByDate(HN, date)   // ดึงประวัติตามวันที่
getLatestMedicalRecord(HN)          // ดึงบันทึกล่าสุด
```

### 5.5 Examination Model (`models/examinationModel.js`) - **โมเดลที่ซับซ้อนที่สุด**

**ตาราง:** `patient_examination`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `examination_date` - วันที่ตรวจ
- `observation` - การสังเกต
- `palpation` - การคลำ
- `rom` - Range of Motion (JSON)
- `mmt` - Manual Muscle Testing (JSON)
- `accessory` - Accessory Movement (JSON)
- `sensory` - Sensory Testing (JSON)
- `reflex` - Reflex Testing (JSON)
- `transfer` - Transfer Ability (JSON)
- `ambulation` - Ambulation (JSON)
- `notes` - หมายเหตุ
- `examiner` - ผู้ตรวจ
- `created_at` - วันที่บันทึก

**โครงสร้าง JSON ของฟิลด์:**

1. **ROM (Range of Motion):**
```json
{
  "neck": {"flexion": 50, "extension": 60, ...},
  "shoulder": {"flexion": 180, "extension": 60, ...},
  "elbow": {...},
  "wrist": {...},
  "hip": {...},
  "knee": {...},
  "ankle": {...}
}
```

2. **MMT (Manual Muscle Testing):**
```json
{
  "upperExtremity": {
    "shoulder": {"flexion": 5, "extension": 5, ...},
    "elbow": {...},
    ...
  },
  "lowerExtremity": {
    "hip": {...},
    "knee": {...},
    ...
  }
}
```

3. **Sensory Testing:**
```json
{
  "lightTouch": {...},
  "sharpDull": {...},
  "proprioception": {...},
  "vibration": {...}
}
```

**Methods สำคัญ (20+ methods):**
```javascript
// CRUD
createExaminationRecord(data)         // สร้างบันทึก
updateExamination(examId, data)       // อัพเดท
deleteExamination(examId)             // ลบ
getExaminationById(examId)            // ค้นหาด้วย ID

// ค้นหา
getExaminationHistory(HN)             // ประวัติการตรวจ
getExaminationsByDate(HN, date)       // ตามวันที่
getLatestExamination(HN)              // บันทึกล่าสุด
getExaminationDates(HN)               // วันที่ที่มีการตรวจ
searchExaminations(criteria)          // ค้นหาแบบกำหนดเงื่อนไข

// วิเคราะห์
compareExaminations(examIds)          // เปรียบเทียบผลการตรวจ
getMonthlySummary(HN, year, month)    // สรุปรายเดือน
getYearlySummary(HN, year)            // สรุปรายปี
getProgressTracking(HN)               // ติดตามความก้าวหน้า
getExaminationStatistics(HN)          // สถิติ

// Validation
validateExamination(data)             // ตรวจสอบความถูกต้อง

// Templates
getExaminationTemplates()             // ดึง Template
saveExaminationTemplate(data)         // บันทึก Template
```

### 5.6 Diagnosis Model (`models/diagnosisModel.js`)

**ตาราง:** `diagnosis`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `diagnosis_date` - วันที่วินิจฉัย
- `icd10_code` - รหัส ICD-10
- `icd10_description` - คำอธิบาย ICD-10
- `prognosis` - พยากรณ์โรค
- `treatment_plan` - แผนการรักษา
- `special_considerations` - ข้อควรระวัง
- `created_by` - ผู้บันทึก
- `created_at` - วันที่บันทึก

**Methods:**
```javascript
createDiagnosis(data)                 // สร้างการวินิจฉัยใหม่
updateDiagnosis(diagnosisId, data)    // อัพเดท
deleteDiagnosis(diagnosisId)          // ลบ
getDiagnosisHistory(HN)               // ประวัติการวินิจฉัย
getDiagnosisById(diagnosisId)         // ค้นหาด้วย ID
getLatestDiagnosis(HN)                // การวินิจฉัยล่าสุด
getDiagnosisByICD10(icd10Code)        // ค้นหาด้วยรหัส ICD-10
getDiagnosisByDate(HN, date)          // ตามวันที่
```

### 5.7 Procedure Model (`models/procedureModel.js`)

**ตาราง:** `procedures`, `procedure_templates`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `procedure_date` - วันที่รักษา
- `procedure_code` - รหัสขั้นตอน
- `procedure_name` - ชื่อขั้นตอน
- `technique` - เทคนิค
- `duration_minutes` - ระยะเวลา (นาที)
- `therapist_name` - ชื่อผู้รักษา
- `session_count` - จำนวนครั้ง
- `effectiveness` - ประสิทธิผล
- `notes` - หมายเหตุ
- `created_at` - วันที่บันทึก

**Methods:**
```javascript
// CRUD
createProcedure(data)                 // สร้างบันทึก
updateProcedure(procedureId, data)    // อัพเดท
deleteProcedure(procedureId)          // ลบ
getProcedureById(procedureId)         // ค้นหาด้วย ID

// ค้นหา
getProcedureHistory(HN)               // ประวัติการรักษา
getProceduresByDate(HN, date)         // ตามวันที่
getLatestProcedure(HN)                // บันทึกล่าสุด

// สถิติ
getProcedureStatistics(HN)            // สถิติการรักษา
getPopularProcedures()                // ขั้นตอนที่ใช้บ่อย
getSessionCounts(HN)                  // นับจำนวนครั้ง

// Templates
getProcedureTemplates()               // ดึง Template
saveProcedureTemplate(data)           // บันทึก Template
```

### 5.8 Billing Model (`models/billingModel.js`)

**ตาราง:** `billing`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `bill_number` - เลขที่บิล (รูปแบบ: BILL-YYYYMMDD-XXXX)
- `bill_date` - วันที่ออกบิล
- `service_items` - รายการบริการ (JSON)
- `subtotal` - ราคารวม
- `discount_amount` - ส่วนลด
- `tax_amount` - ภาษี
- `total_amount` - ราคาสุทธิ
- `payment_status` - สถานะการชำระ (pending, paid, cancelled)
- `payment_method` - วิธีชำระเงิน (cash, credit_card, transfer, insurance)
- `payment_date` - วันที่ชำระ
- `notes` - หมายเหตุ
- `created_by` - ผู้สร้างบิล
- `created_at` - วันที่สร้าง

**โครงสร้าง JSON ของ service_items:**
```json
[
  {
    "service_code": "PT001",
    "service_name": "กายภาพบำบัด",
    "quantity": 1,
    "unit_price": 500,
    "total_price": 500
  },
  {
    "service_code": "EXAM001",
    "service_name": "ตรวจร่างกาย",
    "quantity": 1,
    "unit_price": 300,
    "total_price": 300
  }
]
```

**Methods:**
```javascript
// CRUD
createBill(data)                      // สร้างบิลใหม่
updateBill(billId, data)              // อัพเดท
deleteBill(billId)                    // ลบ
getBillById(billId)                   // ค้นหาด้วย ID
getBillByNumber(billNumber)           // ค้นหาด้วยเลขที่บิล

// ค้นหา
getPatientBills(HN)                   // บิลของผู้ป่วย
getAllBills()                         // บิลทั้งหมด
getBillsByDate(date)                  // บิลตามวันที่
getBillsByDateRange(startDate, endDate) // บิลในช่วงเวลา
getBillsByStatus(status)              // บิลตามสถานะ

// การชำระเงิน
updatePaymentStatus(billId, status, paymentData) // อัพเดทสถานะการชำระ

// สถิติ
getDailySales()                       // ยอดขายรายวัน
getMonthlyRevenue(year, month)        // รายได้รายเดือน
getUnpaidBills()                      // บิลที่ยังไม่ชำระ
getRevenueStats()                     // สถิติรายได้

// ฟังก์ชันช่วย
generateBillNumber()                  // สร้างเลขที่บิล
```

### 5.9 PT Data Model (`models/ptDataModel.js`)

**ตาราง:** `pt_data`

**ฟิลด์สำคัญ:**
- `id` - Primary Key
- `HN` - Hospital Number (FK)
- `assessment_type` - ประเภทการประเมิน
- `observations` - ข้อสังเกต
- `assessment_date` - วันที่ประเมิน
- `session_number` - ครั้งที่
- `assessor` - ผู้ประเมิน
- `notes` - หมายเหตุ
- `created_at` - วันที่บันทึก

**Methods:**
```javascript
createPTData(data)                    // สร้างข้อมูล PT
updatePTData(dataId, data)            // อัพเดท
deletePTData(dataId)                  // ลบ
getPTDataHistory(HN)                  // ประวัติข้อมูล PT
getPTDataById(dataId)                 // ค้นหาด้วย ID
getLatestPTData(HN)                   // ข้อมูลล่าสุด
```

### 5.10 Stats Model (`models/statsModel.js`)

**หน้าที่:** รวบรวมสถิติจากทุกโมดูล

**Methods (15+ methods):**
```javascript
// สถิติผู้ป่วย
getTotalPatients()                    // จำนวนผู้ป่วยทั้งหมด
getTodayPatients()                    // ผู้ป่วยวันนี้
getMonthlyPatients(year, month)       // ผู้ป่วยรายเดือน

// สถิติการตรวจ
getTotalExaminations()                // จำนวนการตรวจทั้งหมด
getTodayExaminations()                // การตรวจวันนี้
getMonthlyExaminations(year, month)   // การตรวจรายเดือน

// สถิติบิล
getTotalRevenue()                     // รายได้ทั้งหมด
getTodayRevenue()                     // รายได้วันนี้
getMonthlyRevenue(year, month)        // รายได้รายเดือน
getPendingBills()                     // บิลค้างชำระ

// สถิตินัดหมาย
getTodayAppointments()                // นัดหมายวันนี้
getUpcomingAppointments()             // นัดหมายที่กำลังจะมาถึง
getAppointmentStats()                 // สถิติการนัดหมาย

// Dashboard
getDashboardStats()                   // สถิติสำหรับ Dashboard
```

### 5.11 Service Model (`models/serviceModel.js`)

**หน้าที่:** จัดการบริการและราคา

---

## 6. การทำงานของแต่ละโมดูล

### 6.1 โมดูล Authentication (Login/Logout)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/authController.js`
- Routes: `routes/authRoutes.js`
- Config: `config/passportConfig.js`
- Middleware: `middleware/authMiddleware.js`
- View: `views/login.ejs`, `views/index.ejs`, `views/profile.ejs`

**การทำงาน:**

1. **Login Process:**
```
User กรอก username/password
  ↓
POST /login
  ↓
Passport LocalStrategy
  ↓
UserModel.getUserByUsername(username)
  ↓
bcrypt.compare(password, hashedPassword)
  ↓
ถ้าถูกต้อง → Serialize user to session
  ↓
Redirect to /index (Dashboard)
```

2. **Session Management:**
```javascript
// ตั้งค่า Session
express-session({
  secret: 'PTHKey_2024_SecureRandomString',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000, // 24 ชั่วโมง
    httpOnly: true,
    secure: false, // true ในโหมด production
    sameSite: 'strict'
  }
})
```

3. **Logout Process:**
```
GET /logout
  ↓
req.logout()
  ↓
Destroy session
  ↓
Redirect to /login
```

4. **Profile Management:**
```
GET /profile → แสดงโปรไฟล์
POST /profile → อัพเดทโปรไฟล์ (ชื่อ, อีเมล, รหัสผ่าน)
```

**Routes:**
```
GET  /login              # หน้า Login (public)
POST /login              # ส่งข้อมูล Login
GET  /logout             # Logout
GET  /index              # Dashboard (ต้อง login)
GET  /profile            # หน้าโปรไฟล์
POST /profile            # อัพเดทโปรไฟล์
```

### 6.2 โมดูลจัดการผู้ป่วย (Patient Management)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/patientController.js`
- Model: `models/patientModel.js`
- Routes: `routes/patientRoutes.js`
- Views: `views/patients.ejs`, `views/patientForm.ejs`

**การทำงาน:**

1. **ลงทะเบียนผู้ป่วยใหม่:**
```
GET /patients/add → แสดงฟอร์ม
  ↓
กรอกข้อมูล (ชื่อ, นามสกุล, เลขบัตร, เพศ, วันเกิด, ...)
  ↓
POST /patients/add
  ↓
ตรวจสอบว่ามีเลขบัตรซ้ำหรือไม่
  ↓
สร้าง HN อัตโนมัติ (เช่น 670001)
  ↓
บันทึกลงฐานข้อมูล
  ↓
Redirect ไปหน้า /patients/:HN
```

2. **ค้นหาผู้ป่วย:**
```
GET /patients → หน้าค้นหา
  ↓
GET /patients/search?query=xxx
  ↓
ค้นหาจาก:
  - HN
  - ชื่อ-นามสกุล
  - เลขบัตรประชาชน
  ↓
แสดงผลลัพธ์
```

3. **ดูข้อมูลผู้ป่วย:**
```
GET /patients/:HN
  ↓
ดึงข้อมูล:
  - ข้อมูลส่วนตัว
  - ประวัติการนัดหมาย
  - ประวัติการรักษา
  - บิล
  ↓
แสดงหน้า Patient Profile
```

**Routes:**
```
GET  /patients/          # หน้าค้นหา
GET  /patients/add       # ฟอร์มลงทะเบียน
POST /patients/add       # บันทึกผู้ป่วยใหม่
GET  /patients/search    # ค้นหาผู้ป่วย
GET  /patients/:HN       # ข้อมูลผู้ป่วย
```

### 6.3 โมดูลการนัดหมาย (Appointment Management)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/appointmentController.js`
- Model: `models/appointmentModel.js`
- Routes: `routes/appointmentRoutes.js`
- Views: `views/appointments.ejs`, `views/appointmentForm.ejs`
- Client JS: `public/js/appointments.js`

**การทำงาน:**

1. **สร้างนัดหมาย:**
```
GET /appointments/create → แสดงฟอร์ม
  ↓
เลือกผู้ป่วย (HN)
กำหนดวันที่และเวลา
  ↓
POST /appointments/create
  ↓
ตรวจสอบว่าเวลาชนกับนัดอื่นหรือไม่
  ↓
บันทึกนัดหมาย (status: scheduled)
  ↓
Redirect to /appointments
```

2. **แก้ไขนัดหมาย:**
```
GET /appointments/:id/edit → ฟอร์มแก้ไข
  ↓
POST /appointments/:id/edit
  ↓
อัพเดทข้อมูล
```

3. **เปลี่ยนสถานะ:**
```
POST /appointments/:id/status
  ↓
เปลี่ยนเป็น: confirmed, completed, cancelled, no_show
```

4. **สร้างบัตรนัด (PDF):**
```
GET /appointments/:id/card
  ↓
ดึงข้อมูลนัดหมาย
  ↓
Render EJS template (appointmentCard.ejs)
  ↓
Puppeteer แปลงเป็น PDF
  ↓
Download ไฟล์ PDF
```

**Routes:**
```
GET    /appointments/               # รายการนัดหมาย
GET    /appointments/create         # ฟอร์มสร้างนัดหมาย
POST   /appointments/create         # บันทึกนัดหมาย
GET    /appointments/:id/edit       # ฟอร์มแก้ไข
POST   /appointments/:id/edit       # อัพเดท
GET    /appointments/:id            # รายละเอียด
POST   /appointments/:id/status     # เปลี่ยนสถานะ
DELETE /appointments/:id            # ลบ
GET    /appointments/:id/card       # Download บัตรนัด PDF
```

### 6.4 โมดูลประวัติการรักษา (Medical History)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/medicalController.js`
- Model: `models/medicalModel.js`
- Routes: `routes/medicalRoutes.js`
- Views: `views/medicalFrom.ejs`, `views/medicaHistory.ejs`

**การทำงาน:**

1. **บันทึกประวัติ:**
```
GET /medicalFrom/:HN → แสดงฟอร์ม
  ↓
กรอกข้อมูล:
  - Vital Signs (น้ำหนัก, ส่วนสูง, ความดัน, ชีพจร, O2Sat)
  - อาการปัจจุบัน
  - ประวัติโรค
  ↓
คำนวณ BMI อัตโนมัติ
  ↓
POST /medicalFrom/:HN
  ↓
บันทึกลงฐานข้อมูล
```

2. **ดูประวัติ:**
```
GET /medicalHistory/:HN
  ↓
แสดงประวัติทั้งหมดเรียงตามวันที่
```

**Routes:**
```
GET  /examinationroom/:HN      # ห้องตรวจ
GET  /medicalFrom/:HN          # ฟอร์มบันทึก
POST /medicalFrom/:HN          # บันทึก
GET  /medicalHistory/:HN       # ประวัติ
GET  /medicaHistorydate/:HN    # ประวัติตามวันที่
```

### 6.5 โมดูลการตรวจร่างกาย (Physical Examination)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/examinationController.js`
- Model: `models/examinationModel.js`
- Routes: `routes/examinationRoutes.js`
- Views: `views/examinationroom.ejs`, `views/patientexamination.ejs`
- Client JS: `public/js/patientexamination.js`

**การทำงาน:**

1. **บันทึกผลการตรวจ:**
```
GET /examinationroom/:HN → หน้าห้องตรวจ
  ↓
กรอกข้อมูล:
  - Observation (การสังเกต)
  - Palpation (การคลำ)
  - ROM (Range of Motion) - แต่ละข้อต่อ
  - MMT (Manual Muscle Testing) - ความแข็งแรงกล้ามเนื้อ
  - Accessory Movement
  - Sensory (การรับความรู้สึก)
  - Reflex (ปฏิกิริยาตอบสนอง)
  - Transfer (การย้ายตัว)
  - Ambulation (การเดิน)
  ↓
POST /patientexamination/:HN
  ↓
แปลงข้อมูลเป็น JSON (ROM, MMT, etc.)
  ↓
บันทึกลงฐานข้อมูล
```

2. **ดูประวัติการตรวจ:**
```
GET /examinationHistory/:HN
  ↓
แสดงรายการการตรวจทั้งหมด
  ↓
คลิกดูรายละเอียด
  ↓
GET /examinationDetail/:HN/:examId
```

3. **เปรียบเทียบผลการตรวจ:**
```
POST /examination/compare
  ↓
เลือก 2-3 ครั้งที่ต้องการเปรียบเทียบ
  ↓
แสดงผลเปรียบเทียบ ROM, MMT แบบ side-by-side
```

4. **พิมพ์รายงาน:**
```
GET /examinationPrint/:examId
  ↓
Render template
  ↓
Puppeteer แปลงเป็น PDF
  ↓
Download
```

**Routes (20+ endpoints):**
```
GET  /examinationroom/:HN                  # ห้องตรวจ
GET  /patientexamination/:HN               # ฟอร์มตรวจ
POST /patientexamination/:HN               # บันทึก
GET  /examinationHistory/:HN               # ประวัติ
GET  /examinationDetail/:HN/:examId        # รายละเอียด
GET  /examinationPrint/:examId             # พิมพ์
POST /examination/latest/:HN               # ดึงข้อมูลล่าสุด
POST /examination/bydate                   # ดึงตามวันที่
POST /examination/dates/:HN                # ดึงวันที่ทั้งหมด
POST /examination/search                   # ค้นหา
POST /examination/statistics/:HN           # สถิติ
POST /examination/:examId/update           # อัพเดท
POST /examination/:examId/delete           # ลบ
POST /examination/compare                  # เปรียบเทียบ
POST /examination/summary/monthly          # สรุปรายเดือน
POST /examination/summary/yearly/:year     # สรุปรายปี
POST /examination/validate                 # Validate
GET  /examinationTemplates                 # ดึง Templates
POST /examinationTemplates                 # บันทึก Template
POST /examination/progress/:HN             # ติดตามความก้าวหน้า
```

### 6.6 โมดูลการวินิจฉัย (Diagnosis)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/diagnosisController.js`
- Model: `models/diagnosisModel.js`
- Routes: `routes/diagnosisRoutes.js`
- Views: `views/diagnosis.ejs`
- Client JS: `public/js/diagnosis.js`

**การทำงาน:**

```
GET /diagnosis/:HN → ฟอร์ม
  ↓
กรอกข้อมูล:
  - ICD-10 Code
  - คำอธิบายการวินิจฉัย
  - พยากรณ์โรค (Prognosis)
  - แผนการรักษา
  - ข้อควรระวัง
  ↓
POST /diagnosis/:HN
  ↓
บันทึกลงฐานข้อมูล
```

**Routes:**
```
GET  /diagnosis/:HN                     # ฟอร์ม
POST /diagnosis/:HN                     # บันทึก
GET  /diagnosisHistory/:HN              # ประวัติ
GET  /diagnosisDetail/:HN/:diagnosisId  # รายละเอียด
POST /diagnosis/:HN/:diagnosisId/update # อัพเดท
POST /diagnosis/:HN/:diagnosisId/delete # ลบ
```

### 6.7 โมดูลการรักษา (Procedure)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/procedureController.js`
- Model: `models/procedureModel.js`
- Routes: `routes/procedureRoutes.js`
- Views: `views/procedure.ejs`
- Client JS: `public/js/procedure.js`

**การทำงาน:**

```
GET /procedure/:HN → ฟอร์ม
  ↓
กรอกข้อมูล:
  - ชื่อขั้นตอนการรักษา
  - เทคนิค
  - ระยะเวลา (นาที)
  - ผู้รักษา
  - จำนวนครั้ง
  - ประสิทธิผล
  ↓
POST /procedure/:HN
  ↓
บันทึก
```

**Routes:**
```
GET  /procedure/:HN                      # ฟอร์ม
POST /procedure/:HN                      # บันทึก
GET  /procedureHistory/:HN               # ประวัติ
GET  /procedureDetail/:HN/:procedureId   # รายละเอียด
POST /procedure/:HN/:procedureId/update  # อัพเดท
POST /procedure/:HN/:procedureId/delete  # ลบ
GET  /procedureTemplates                 # Templates
POST /procedureTemplates                 # บันทึก Template
POST /procedure/statistics/:HN           # สถิติ
POST /procedure/popular                  # ขั้นตอนยอดนิยม
```

### 6.8 โมดูลข้อมูล PT (PT Data)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/ptDataController.js`
- Model: `models/ptDataModel.js`
- Routes: `routes/ptDataRoutes.js`
- Views: `views/ptData.ejs`
- Client JS: `public/js/ptData.js`

**การทำงาน:**

```
GET /ptData/:HN → ฟอร์ม
  ↓
กรอกข้อมูลการประเมิน PT
  ↓
POST /ptData/:HN
  ↓
บันทึก
```

**Routes:**
```
GET  /ptData/:HN                  # ฟอร์ม
POST /ptData/:HN                  # บันทึก
GET  /ptDataHistory/:HN           # ประวัติ
GET  /ptDataDetail/:HN/:dataId    # รายละเอียด
POST /ptData/:HN/:dataId/update   # อัพเดท
POST /ptData/:HN/:dataId/delete   # ลบ
```

### 6.9 โมดูลการเรียกเก็บเงิน (Billing)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/billingController.js`
- Model: `models/billingModel.js`
- Routes: `routes/billingRoutes.js`
- Views: `views/billing.ejs`, `views/billDetail.ejs`
- Client JS: `public/js/billing.js`
- Utils: `utils/billUtils.js`

**การทำงาน:**

1. **สร้างบิล:**
```
GET /billing/:HN → ฟอร์มสร้างบิล
  ↓
เลือกรายการบริการ (Service Items)
  - รหัสบริการ
  - ชื่อบริการ
  - จำนวน
  - ราคาต่อหน่วย
  ↓
คำนวณ:
  - Subtotal
  - Discount
  - Tax
  - Total
  ↓
POST /billing/:HN
  ↓
สร้างเลขที่บิล (BILL-YYYYMMDD-XXXX)
  ↓
บันทึกลงฐานข้อมูล (status: pending)
  ↓
Redirect to /billing/detail/:billId
```

2. **ชำระเงิน:**
```
GET /billing/detail/:billId → แสดงรายละเอียดบิล
  ↓
คลิก "ชำระเงิน"
  ↓
POST /billing/payment/:billId
  ↓
อัพเดท:
  - payment_status = 'paid'
  - payment_date = วันที่ปัจจุบัน
  - payment_method = เลือก (cash/credit_card/etc.)
```

3. **ดูประวัติบิล:**
```
GET /billing/history/:HN
  ↓
แสดงบิลทั้งหมดของผู้ป่วย
```

**Routes:**
```
GET  /billing/:HN              # ฟอร์มสร้างบิล
POST /billing/:HN              # บันทึกบิล
GET  /billing/detail/:billId   # รายละเอียดบิล
POST /billing/payment/:billId  # อัพเดทการชำระเงิน
GET  /billing/history/:HN      # ประวัติบิล
```

### 6.10 โมดูล Admin (Administration)

**ไฟล์เกี่ยวข้อง:**
- Controller: `controllers/adminController.js`
- Routes: `routes/adminRoutes.js`
- Views: `views/admin/users.ejs`, `views/admin/createUser.ejs`, `views/admin/reports.ejs`

**การทำงาน:**

1. **จัดการผู้ใช้:**
```
GET /admin/users → รายการผู้ใช้
  ↓
GET /admin/users/create → ฟอร์มสร้างผู้ใช้
  ↓
POST /admin/users/create
  ↓
ตรวจสอบ username ซ้ำ
  ↓
เข้ารหัสรหัสผ่านด้วย bcrypt
  ↓
บันทึก
```

2. **แก้ไขผู้ใช้:**
```
GET /admin/users/:id/edit → ฟอร์ม
  ↓
POST /admin/users/:id/edit
  ↓
อัพเดท (ไม่เปลี่ยนรหัสผ่านถ้าไม่กรอก)
```

3. **ลบผู้ใช้:**
```
POST /admin/users/:id/delete
  ↓
ลบจากฐานข้อมูล
```

4. **รายงาน:**
```
GET /admin/reports → หน้ารายงาน
  ↓
เลือกประเภทรายงาน:
  - รายงานผู้ป่วย
  - รายงานนัดหมาย
  - รายงานการเงิน
  - รายงานผู้ใช้
  ↓
GET /admin/reports/patients
GET /admin/reports/appointments
GET /admin/reports/financial
GET /admin/reports/users
```

**Routes:**
```
GET  /admin/users                        # รายการผู้ใช้
GET  /admin/users/create                 # ฟอร์มสร้าง
POST /admin/users/create                 # บันทึก
GET  /admin/users/:id/edit               # ฟอร์มแก้ไข
POST /admin/users/:id/edit               # อัพเดท
POST /admin/users/:id/delete             # ลบ
GET  /admin/reports                      # หน้ารายงาน
GET  /admin/reports/patients             # รายงานผู้ป่วย
GET  /admin/reports/appointments         # รายงานนัดหมาย
GET  /admin/reports/financial            # รายงานการเงิน
GET  /admin/reports/users                # รายงานผู้ใช้
```

---

## 7. ระบบ Authentication และสิทธิ์การใช้งาน

### 7.1 การเข้ารหัสรหัสผ่าน

**Algorithm:** bcrypt
**Rounds:** 10

```javascript
// การเข้ารหัส
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// การตรวจสอบ
const isMatch = await bcrypt.compare(password, hashedPassword);
```

### 7.2 Session Management

**ตั้งค่า:**
```javascript
{
  secret: 'PTHKey_2024_SecureRandomString_ChangeMeInProduction',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000,      // 24 ชั่วโมง
    httpOnly: true,        // ป้องกัน XSS
    secure: false,         // true ใน production (HTTPS)
    sameSite: 'strict'     // ป้องกัน CSRF
  }
}
```

### 7.3 บทบาทผู้ใช้ (User Roles)

| Role | ชื่อเต็ม | สิทธิ์ |
|------|---------|-------|
| `admin` | ผู้ดูแลระบบ | เข้าถึงได้ทุกอย่าง |
| `physical_therapist` | นักกายภาพบำบัด | ตรวจ, วินิจฉัย, รักษา, บิล |
| `staff` | เจ้าหน้าที่ | ลงทะเบียนผู้ป่วย, นัดหมาย, ประวัติ |

### 7.4 Middleware สำหรับตรวจสอบสิทธิ์

**ไฟล์:** `middleware/authMiddleware.js`

**Functions:**

1. **isAuthenticated()**
```javascript
// ตรวจสอบว่า login แล้วหรือไม่
if (!req.isAuthenticated()) {
  return res.redirect('/login');
}
```

2. **checkRole(requiredRole)**
```javascript
// ตรวจสอบ Role
// Admin สามารถเข้าถึงทุกอย่าง
// requiredRole สามารถเป็น string หรือ array
checkRole(['physical_therapist', 'admin'])
```

3. **checkAdminOnly()**
```javascript
// เฉพาะ Admin เท่านั้น
```

4. **checkPhysicalTherapist()**
```javascript
// PT หรือ Admin
```

5. **checkStaff()**
```javascript
// Staff, PT, หรือ Admin
```

6. **checkStaffOnly()**
```javascript
// เฉพาะ Staff
```

7. **checkNotStaff()**
```javascript
// PT หรือ Admin (ไม่รวม Staff)
```

**การใช้งาน:**
```javascript
// ใน Routes
router.get('/admin/users',
  isAuthenticated,
  checkAdminOnly,
  adminController.showUsers
);

router.get('/examinationroom/:HN',
  isAuthenticated,
  checkRole(['physical_therapist', 'admin']),
  examinationController.showExaminationRoom
);
```

### 7.5 Passport Configuration

**ไฟล์:** `config/passportConfig.js`

**LocalStrategy:**
```javascript
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      // ค้นหาผู้ใช้
      const user = await UserModel.getUserByUsername(username);

      if (!user) {
        return done(null, false, { message: 'ไม่พบผู้ใช้' });
      }

      // ตรวจสอบรหัสผ่าน
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return done(null, false, { message: 'รหัสผ่านไม่ถูกต้อง' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
```

---

## 8. ขั้นตอนการใช้งาน

### 8.1 สำหรับเจ้าหน้าที่ (Staff)

**1. Login**
```
1. เปิดเว็บไซต์
2. กรอก username และ password
3. คลิก "เข้าสู่ระบบ"
4. จะเข้าสู่หน้า Dashboard
```

**2. ลงทะเบียนผู้ป่วยใหม่**
```
1. คลิก "ผู้ป่วย" > "ลงทะเบียนผู้ป่วยใหม่"
2. กรอกข้อมูล:
   - ชื่อ-นามสกุล
   - เลขบัตรประชาชน
   - เพศ
   - วันเกิด
   - เบอร์โทร
   - ที่อยู่
   - ผู้ติดต่อฉุกเฉิน
3. คลิก "บันทึก"
4. ระบบจะสร้าง HN อัตโนมัติ
```

**3. สร้างนัดหมาย**
```
1. คลิก "นัดหมาย" > "สร้างนัดหมายใหม่"
2. ค้นหาผู้ป่วย (กรอก HN หรือชื่อ)
3. เลือกวันที่และเวลา
4. กรอกหมายเหตุ (ถ้ามี)
5. คลิก "บันทึก"
6. สามารถพิมพ์บัตรนัดได้
```

**4. บันทึกประวัติการรักษา**
```
1. ค้นหาผู้ป่วย
2. คลิก "ประวัติการรักษา"
3. กรอกข้อมูล Vital Signs
4. กรอกอาการและประวัติโรค
5. คลิก "บันทึก"
```

### 8.2 สำหรับนักกายภาพบำบัด (Physical Therapist)

**1. ตรวจร่างกาย**
```
1. ค้นหาผู้ป่วย
2. คลิก "ห้องตรวจ"
3. กรอกข้อมูล:
   - Observation
   - Palpation
   - ROM (ทุกข้อต่อ)
   - MMT (กล้ามเนื้อทุกส่วน)
   - Sensory
   - Reflex
   - Transfer
   - Ambulation
4. คลิก "บันทึก"
```

**2. วินิจฉัย**
```
1. ค้นหาผู้ป่วย
2. คลิก "วินิจฉัย"
3. กรอก:
   - ICD-10 Code
   - คำอธิบาย
   - พยากรณ์โรค
   - แผนการรักษา
4. คลิก "บันทึก"
```

**3. บันทึกการรักษา**
```
1. ค้นหาผู้ป่วย
2. คลิก "การรักษา"
3. กรอกขั้นตอนการรักษา
4. กรอกเทคนิคและระยะเวลา
5. คลิก "บันทึก"
```

**4. สร้างบิล**
```
1. ค้นหาผู้ป่วย
2. คลิก "เรียกเก็บเงิน"
3. เพิ่มรายการบริการ
4. กรอกจำนวนและราคา
5. ระบบจะคำนวณยอดรวมอัตโนมัติ
6. คลิก "สร้างบิล"
7. สามารถพิมพ์บิลได้
```

**5. รับชำระเงิน**
```
1. คลิกที่บิลที่ต้องการ
2. คลิก "รับชำระเงิน"
3. เลือกวิธีชำระ (เงินสด/บัตร/โอน)
4. คลิก "ยืนยัน"
5. สถานะจะเปลี่ยนเป็น "ชำระแล้ว"
```

### 8.3 สำหรับผู้ดูแลระบบ (Admin)

**1. จัดการผู้ใช้**
```
1. คลิก "ผู้ดูแลระบบ" > "จัดการผู้ใช้"
2. สร้างผู้ใช้ใหม่:
   - คลิก "สร้างผู้ใช้ใหม่"
   - กรอก username, password, ชื่อ, อีเมล
   - เลือกบทบาท (admin/physical_therapist/staff)
   - คลิก "บันทึก"
3. แก้ไขผู้ใช้:
   - คลิก "แก้ไข"
   - เปลี่ยนข้อมูล
   - คลิก "บันทึก"
4. ลบผู้ใช้:
   - คลิก "ลบ"
   - ยืนยัน
```

**2. ดูรายงาน**
```
1. คลิก "รายงาน"
2. เลือกประเภทรายงาน:
   - รายงานผู้ป่วย
   - รายงานนัดหมาย
   - รายงานการเงิน
   - รายงานผู้ใช้
3. เลือกช่วงวันที่
4. คลิก "ดูรายงาน"
5. สามารถ Export เป็น PDF ได้
```

---

## 9. คู่มือสำหรับผู้พัฒนา

### 9.1 การติดตั้งโปรเจกต์

**1. Requirements:**
```
- Node.js (แนะนำเวอร์ชันล่าสุด)
- MySQL Server
- Git
```

**2. Clone โปรเจกต์:**
```bash
git clone <repository-url>
cd Project\ Pth-X-P
```

**3. ติดตั้ง Dependencies:**
```bash
npm install
```

**4. ตั้งค่า Environment Variables:**

สร้างไฟล์ `.env`:
```env
# Database
DB_HOST=10.104.21.17
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=pth-x-p
DB_CHARSET=utf8mb4
DB_TIMEZONE=+07:00
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
DB_TIMEOUT=60000

# Application
NODE_ENV=development
TZ=Asia/Bangkok
PORT=3000

# Session
SESSION_SECRET=PTHKey_2024_SecureRandomString_ChangeMeInProduction
SESSION_MAX_AGE=86400000
SESSION_NAME=pth-session
SESSION_SECURE=false
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# Security
BCRYPT_ROUNDS=10
TRUST_PROXY=true

# Logging
LOG_LEVEL=info

# Meta
DEVELOPED_BY=Your Name
```

**5. สร้างฐานข้อมูล:**
```sql
CREATE DATABASE `pth-x-p` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**6. Import Database Schema:**
```bash
mysql -u username -p pth-x-p < database/schema.sql
```

**7. รันโปรเจกต์:**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 9.2 โครงสร้างโค้ด

**การเพิ่มโมดูลใหม่:**

1. **สร้าง Model** (`models/newModel.js`):
```javascript
const db = require('../config/db');

class NewModel {
  static async create(data) {
    const query = 'INSERT INTO table_name SET ?';
    const result = await db.queryAsync(query, data);
    return result;
  }

  static async getById(id) {
    const query = 'SELECT * FROM table_name WHERE id = ?';
    const results = await db.queryAsync(query, [id]);
    return results[0];
  }
}

module.exports = NewModel;
```

2. **สร้าง Controller** (`controllers/newController.js`):
```javascript
const NewModel = require('../models/newModel');

exports.showForm = async (req, res) => {
  try {
    res.render('newForm', {
      user: req.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    await NewModel.create(data);
    req.flash('success', 'สร้างสำเร็จ');
    res.redirect('/success-page');
  } catch (error) {
    console.error(error);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/error-page');
  }
};
```

3. **สร้าง Routes** (`routes/newRoutes.js`):
```javascript
const express = require('express');
const router = express.Router();
const newController = require('../controllers/newController');
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');

router.get('/new', isAuthenticated, checkRole(['admin']), newController.showForm);
router.post('/new', isAuthenticated, checkRole(['admin']), newController.create);

module.exports = router;
```

4. **เพิ่มใน app.js:**
```javascript
const newRoutes = require('./routes/newRoutes');
app.use('/', newRoutes);
```

5. **สร้าง View** (`views/newForm.ejs`):
```html
<!DOCTYPE html>
<html>
<head>
  <title>New Form</title>
  <link rel="stylesheet" href="/css/newForm.css">
</head>
<body>
  <form action="/new" method="POST">
    <!-- Form fields -->
    <button type="submit">บันทึก</button>
  </form>
  <script src="/js/newForm.js"></script>
</body>
</html>
```

### 9.3 Database Queries

**การใช้งาน Connection Pool:**

**Callback-based:**
```javascript
db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
  if (err) throw err;
  console.log(results);
});
```

**Promise-based (แนะนำ):**
```javascript
const results = await db.queryAsync('SELECT * FROM users WHERE id = ?', [userId]);
```

**Transaction:**
```javascript
db.beginTransaction(async (err) => {
  if (err) throw err;

  try {
    await db.queryAsync('INSERT INTO table1 SET ?', data1);
    await db.queryAsync('UPDATE table2 SET ? WHERE id = ?', [data2, id]);

    db.commit((err) => {
      if (err) {
        return db.rollback(() => {
          throw err;
        });
      }
      console.log('Transaction Complete!');
    });
  } catch (error) {
    db.rollback(() => {
      throw error;
    });
  }
});
```

### 9.4 การสร้าง PDF

**ใช้ Puppeteer:**

```javascript
const pdfGenerator = require('../utils/pdfGenerator');

// HTML to PDF
const html = `
  <html>
    <head>
      <style>
        body { font-family: 'Sarabun', sans-serif; }
      </style>
    </head>
    <body>
      <h1>ใบเสร็จ</h1>
      <p>เลขที่: ${billNumber}</p>
    </body>
  </html>
`;

const pdfBuffer = await pdfGenerator.generatePDF(html, {
  format: 'A4',
  margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
});

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="bill-${billNumber}.pdf"`);
res.send(pdfBuffer);
```

### 9.5 Flash Messages

**การใช้งาน:**

```javascript
// ใน Controller
req.flash('success', 'บันทึกสำเร็จ');
req.flash('error', 'เกิดข้อผิดพลาด');
req.flash('warning', 'คำเตือน');
req.flash('info', 'ข้อมูล');

// ใน View (EJS)
<% if (messages.success) { %>
  <div class="alert alert-success">
    <%= messages.success %>
  </div>
<% } %>
```

### 9.6 การ Debug

**1. Console Logging:**
```javascript
console.log('Debug:', variable);
console.error('Error:', error);
```

**2. Error Handling:**
```javascript
try {
  // Code
} catch (error) {
  console.error('Error in functionName:', error);
  res.status(500).json({ error: error.message });
}
```

**3. Database Query Logging:**
```javascript
console.log('Query:', query);
console.log('Params:', params);
const results = await db.queryAsync(query, params);
console.log('Results:', results);
```

---

## 10. การติดตั้งและ Deploy

### 10.1 การติดตั้งบนเซิร์ฟเวอร์

**1. เตรียมเซิร์ฟเวอร์:**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Git
sudo apt install -y git

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

**2. Clone และติดตั้ง:**
```bash
cd /var/www
git clone <repository-url> pth-x-p
cd pth-x-p
npm install --production
```

**3. ตั้งค่า Environment:**
```bash
cp .env.example .env
nano .env
# แก้ไขค่าต่างๆ ให้เหมาะสม
```

**4. ตั้งค่าฐานข้อมูล:**
```bash
mysql -u root -p
CREATE DATABASE `pth-x-p` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pth_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON `pth-x-p`.* TO 'pth_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

mysql -u pth_user -p pth-x-p < database/schema.sql
```

**5. รันด้วย PM2:**
```bash
pm2 start app.js --name pth-x-p
pm2 save
pm2 startup
```

### 10.2 การตั้งค่า Nginx (Reverse Proxy)

**ไฟล์:** `/etc/nginx/sites-available/pth-x-p`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pth-x-p /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10.3 SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

### 10.4 Backup ฐานข้อมูล

**สร้าง Cron Job:**
```bash
crontab -e
```

**เพิ่มบรรทัด:**
```
0 2 * * * /usr/bin/mysqldump -u pth_user -p'password' pth-x-p > /var/backups/pth-x-p-$(date +\%Y\%m\%d).sql
```

### 10.5 Monitoring

**PM2 Monitoring:**
```bash
pm2 status
pm2 logs pth-x-p
pm2 monit
```

**System Monitoring:**
```bash
# CPU & Memory
htop

# Disk Space
df -h

# Database
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### 10.6 Update โปรเจกต์

```bash
cd /var/www/pth-x-p
git pull origin main
npm install --production
pm2 restart pth-x-p
```

---

## สรุป

ระบบ PTH-X-P เป็นระบบจัดการคลินิกกายภาพบำบัดที่ครบวงจร พัฒนาด้วย Node.js + Express.js + MySQL โดยมีโครงสร้างแบบ MVC ที่ชัดเจน รองรับการทำงานของบุคลากร 3 ระดับ (Admin, Physical Therapist, Staff) พร้อมระบบรักษาความปลอดภัยที่แข็งแรงด้วย Passport.js และ bcrypt

**คุณสมบัติเด่น:**
- ✅ ระบบ Role-based Access Control
- ✅ การจัดเก็บข้อมูลแบบ JSON สำหรับข้อมูลที่ซับซ้อน
- ✅ การสร้าง PDF อัตโนมัติ (บัตรนัด, บิล, รายงาน)
- ✅ ระบบค้นหาและกรองข้อมูลที่ยืดหยุ่น
- ✅ Dashboard และสถิติแบบ Real-time
- ✅ รองรับภาษาไทยเต็มรูปแบบ (UTF-8 MB4)
- ✅ Connection Pooling สำหรับประสิทธิภาพ
- ✅ Session Management ที่ปลอดภัย

**จำนวนโค้ดรวม:** 6,345+ บรรทัด
**จำนวนโมดูล:** 11 โมดูลหลัก
**จำนวนหน้าเว็บ:** 29 หน้า

เอกสารนี้ครอบคลุมทุกส่วนของระบบตั้งแต่โครงสร้าง การทำงาน การใช้งาน ไปจนถึงการติดตั้งและ Deploy บนเซิร์ฟเวอร์จริง
