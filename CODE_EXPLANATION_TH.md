# คำอธิบายการทำงานของโค้ดแต่ละส่วน
## ระบบจัดการคลินิกกายภาพบำบัด PTH-X-P

---

## สารบัญ

1. [การทำงานของไฟล์หลัก (app.js)](#1-การทำงานของไฟล์หลัก-appjs)
2. [ระบบฐานข้อมูล (Database Layer)](#2-ระบบฐานข้อมูล-database-layer)
3. [ระบบ Authentication](#3-ระบบ-authentication)
4. [Middleware และการตรวจสอบสิทธิ์](#4-middleware-และการตรวจสอบสิทธิ์)
5. [Model - Database Operations](#5-model---database-operations)
6. [Controller - Business Logic](#6-controller---business-logic)
7. [Routes - API Endpoints](#7-routes---api-endpoints)
8. [Views - Frontend Templates](#8-views---frontend-templates)
9. [Client-Side JavaScript](#9-client-side-javascript)
10. [ตัวอย่าง Flow การทำงานแบบสมบูรณ์](#10-ตัวอย่าง-flow-การทำงานแบบสมบูรณ์)

---

## 1. การทำงานของไฟล์หลัก (app.js)

### ภาพรวม
ไฟล์ `app.js` เป็นจุดเริ่มต้นของแอปพลิเคชัน ทำหน้าที่เป็นตัวกลางในการเชื่อมต่อทุกส่วนของระบบเข้าด้วยกัน

### โครงสร้างการทำงาน

```javascript
// ======================================
// 1. IMPORT MODULES
// ======================================
const express = require('express');           // Web Framework
const session = require('express-session');   // จัดการ Session
const passport = require('passport');         // Authentication
const flash = require('connect-flash');       // Flash Messages
const bodyParser = require('body-parser');    // Parse Request Body
const methodOverride = require('method-override'); // รองรับ PUT/DELETE
const db = require('./config/db');            // Database Connection
require('dotenv').config();                   // โหลด Environment Variables

// ======================================
// 2. สร้าง Express Application
// ======================================
const app = express();
const PORT = process.env.PORT || 3000;

// ======================================
// 3. MIDDLEWARE SETUP (ลำดับสำคัญมาก!)
// ======================================

// 3.1 View Engine Setup
app.set('view engine', 'ejs');                // ใช้ EJS เป็น Template Engine
app.set('views', './views');                  // กำหนดตำแหน่ง Views

// 3.2 Static Files
app.use(express.static('public'));            // เสิร์ฟไฟล์ CSS, JS, Images

// 3.3 Body Parser (รับข้อมูลจาก Form)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 3.4 Method Override (รองรับ PUT, DELETE)
app.use(methodOverride('_method'));

// 3.5 Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'PTHKey_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000,        // 24 ชั่วโมง
    httpOnly: true,          // ป้องกัน XSS
    secure: false,           // ใช้ true เมื่อมี HTTPS
    sameSite: 'strict'       // ป้องกัน CSRF
  }
}));

// 3.6 Passport Authentication
require('./config/passportConfig')(passport);  // โหลด Passport Config
app.use(passport.initialize());
app.use(passport.session());

// 3.7 Flash Messages
app.use(flash());

// 3.8 Global Variables (ส่งข้อมูลไปทุก View)
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
    warning: req.flash('warning'),
    info: req.flash('info')
  };
  next();
});

// ======================================
// 4. ROUTES SETUP
// ======================================
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRoutes = require('./routes/medicalRoutes');
const examinationRoutes = require('./routes/examinationRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const procedureRoutes = require('./routes/procedureRoutes');
const billingRoutes = require('./routes/billingRoutes');
const ptDataRoutes = require('./routes/ptDataRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// เชื่อมต่อ Routes
app.use('/', authRoutes);
app.use('/', patientRoutes);
app.use('/', appointmentRoutes);
app.use('/', medicalRoutes);
app.use('/', examinationRoutes);
app.use('/', diagnosisRoutes);
app.use('/', procedureRoutes);
app.use('/', billingRoutes);
app.use('/', ptDataRoutes);
app.use('/', adminRoutes);
app.use('/', userRoutes);

// ======================================
// 5. HEALTH CHECK ENDPOINT
// ======================================
app.get('/health', async (req, res) => {
  try {
    // ตรวจสอบการเชื่อมต่อฐานข้อมูล
    await db.queryAsync('SELECT 1');

    res.status(200).json({
      status: 'OK',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: 'Connected',
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// ======================================
// 6. ERROR HANDLING
// ======================================

// 404 Error
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'ไม่พบหน้าที่ต้องการ',
    message: 'ขอโทษครับ ไม่พบหน้าที่คุณต้องการ',
    error: { status: 404 }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Database Error
  if (err.code === 'ER_DUP_ENTRY') {
    req.flash('error', 'ข้อมูลซ้ำในระบบ');
    return res.redirect('back');
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    req.flash('error', 'ข้อมูลไม่ถูกต้อง');
    return res.redirect('back');
  }

  // Default Error
  res.status(err.status || 500);
  res.render('error', {
    title: 'เกิดข้อผิดพลาด',
    message: err.message || 'เกิดข้อผิดพลาดในระบบ',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ======================================
// 7. START SERVER
// ======================================
const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toLocaleString('th-TH')}`);
  console.log(`=================================`);
});

// ======================================
// 8. GRACEFUL SHUTDOWN
// ======================================
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.end(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.end(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
```

### อธิบายแต่ละส่วน

#### **ทำไมต้องเรียง Middleware ตามลำดับนี้?**

```
1. View Engine        → ต้องตั้งค่าก่อนเพื่อให้ Render ได้
2. Static Files       → ให้บราวเซอร์เข้าถึง CSS/JS ได้
3. Body Parser        → แปลงข้อมูลจาก Form ก่อนประมวลผล
4. Method Override    → รองรับ HTTP Methods
5. Session            → สร้าง Session ก่อน Authentication
6. Passport           → ต้องมี Session ก่อน
7. Flash Messages     → ต้องมี Session
8. Global Variables   → ส่งข้อมูลไปทุก View
9. Routes             → จัดการ Requests
10. Error Handling    → จับ Error สุดท้าย
```

---

## 2. ระบบฐานข้อมูล (Database Layer)

### ไฟล์: `config/db.js`

```javascript
const mysql = require('mysql2');
const util = require('util');
require('dotenv').config();

// ======================================
// 1. สร้าง Connection Pool
// ======================================
// Connection Pool คือการสร้างการเชื่อมต่อหลายๆ ตัวไว้ล่วงหน้า
// เพื่อให้หลายๆ Request ใช้งานพร้อมกันได้

const pool = mysql.createPool({
  // ข้อมูลการเชื่อมต่อ
  host: process.env.DB_HOST || '10.104.21.17',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'pth-x-p',

  // Character Set (รองรับภาษาไทย)
  charset: process.env.DB_CHARSET || 'utf8mb4',

  // Timezone
  timezone: process.env.DB_TIMEZONE || '+07:00',

  // Connection Pool Settings
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  waitForConnections: true,

  // Keep Alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Timeout
  connectTimeout: parseInt(process.env.DB_TIMEOUT) || 60000
});

// ======================================
// 2. แปลงเป็น Promise-based
// ======================================
// ทำให้ใช้ async/await ได้
pool.queryAsync = util.promisify(pool.query).bind(pool);

// ======================================
// 3. ทดสอบการเชื่อมต่อ
// ======================================
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.message);

    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }

    return;
  }

  if (connection) {
    console.log('✅ Database Connected Successfully');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🔗 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release(); // คืน Connection กลับ Pool
  }
});

// ======================================
// 4. Event Handlers
// ======================================

// เมื่อมี Connection ใหม่
pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

// เมื่อ Connection ถูกคืนกลับ Pool
pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

// เมื่อมี Error
pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    // Reconnect
    console.log('Attempting to reconnect...');
  }
});

// ======================================
// 5. Helper Functions
// ======================================

/**
 * ทดสอบการเชื่อมต่อ
 */
pool.ping = function(callback) {
  pool.query('SELECT 1', callback);
};

/**
 * ปิดการเชื่อมต่อทั้งหมด
 */
pool.closeAll = function(callback) {
  pool.end((err) => {
    if (err) {
      console.error('Error closing pool:', err);
      return callback(err);
    }
    console.log('All connections closed');
    callback();
  });
};

module.exports = pool;
```

### การใช้งาน Database Pool

```javascript
// ======================================
// วิธีที่ 1: Callback-based (แบบเก่า)
// ======================================
db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results);
});

// ======================================
// วิธีที่ 2: Promise-based (แนะนำ)
// ======================================
async function getUser(userId) {
  try {
    const results = await db.queryAsync('SELECT * FROM users WHERE id = ?', [userId]);
    return results[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ======================================
// วิธีที่ 3: Transaction
// ======================================
async function createBillWithItems() {
  const connection = await db.promise().getConnection();

  try {
    // เริ่ม Transaction
    await connection.beginTransaction();

    // Query 1: สร้างบิล
    const [billResult] = await connection.query(
      'INSERT INTO billing SET ?',
      { HN: '670001', total_amount: 1000 }
    );

    const billId = billResult.insertId;

    // Query 2: เพิ่มรายการบริการ
    await connection.query(
      'INSERT INTO bill_items SET ?',
      { bill_id: billId, service_name: 'กายภาพบำบัด', price: 1000 }
    );

    // Commit Transaction
    await connection.commit();
    console.log('Transaction completed successfully');

  } catch (error) {
    // Rollback ถ้ามี Error
    await connection.rollback();
    console.error('Transaction failed:', error);
    throw error;

  } finally {
    // คืน Connection กลับ Pool
    connection.release();
  }
}
```

### ทำไมต้องใช้ Connection Pool?

```
❌ ไม่ใช้ Pool:
Request 1 → สร้าง Connection → Query → ปิด Connection
Request 2 → สร้าง Connection → Query → ปิด Connection
Request 3 → สร้าง Connection → Query → ปิด Connection
(ช้า! สร้างใหม่ทุกครั้ง)

✅ ใช้ Pool:
สร้าง 10 Connections ไว้ล่วงหน้า
Request 1 → เอา Connection จาก Pool → Query → คืน Pool
Request 2 → เอา Connection จาก Pool → Query → คืน Pool
Request 3 → เอา Connection จาก Pool → Query → คืน Pool
(เร็ว! ใช้ซ้ำได้)
```

---

## 3. ระบบ Authentication

### ไฟล์: `config/passportConfig.js`

```javascript
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

module.exports = function(passport) {

  // ======================================
  // 1. LOCAL STRATEGY (Username/Password)
  // ======================================
  passport.use(new LocalStrategy(
    {
      usernameField: 'username',    // ชื่อ input field ในฟอร์ม
      passwordField: 'password'     // ชื่อ input field ในฟอร์ม
    },
    async (username, password, done) => {
      try {
        console.log(`🔐 Login attempt: ${username}`);

        // 1. ค้นหา User ในฐานข้อมูล
        const user = await UserModel.getUserByUsername(username);

        // 2. ตรวจสอบว่ามี User หรือไม่
        if (!user) {
          console.log(`❌ User not found: ${username}`);
          return done(null, false, {
            message: 'ไม่พบผู้ใช้นี้ในระบบ'
          });
        }

        // 3. เปรียบเทียบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          console.log(`❌ Invalid password for: ${username}`);
          return done(null, false, {
            message: 'รหัสผ่านไม่ถูกต้อง'
          });
        }

        // 4. Login สำเร็จ
        console.log(`✅ Login successful: ${username} (${user.role})`);
        return done(null, user);

      } catch (error) {
        console.error('❌ Authentication error:', error);
        return done(error);
      }
    }
  ));

  // ======================================
  // 2. SERIALIZE USER (บันทึกลง Session)
  // ======================================
  // เก็บเฉพาะ user.id ลง Session เพื่อประหยัดพื้นที่
  passport.serializeUser((user, done) => {
    console.log(`💾 Serializing user: ${user.id}`);
    done(null, user.id);
  });

  // ======================================
  // 3. DESERIALIZE USER (ดึงจาก Session)
  // ======================================
  // ดึงข้อมูล User เต็มจากฐานข้อมูลโดยใช้ id
  passport.deserializeUser(async (id, done) => {
    try {
      console.log(`📂 Deserializing user: ${id}`);
      const user = await UserModel.getUserById(id);

      if (!user) {
        console.log(`❌ User not found in deserialize: ${id}`);
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      console.error('❌ Deserialize error:', error);
      done(error);
    }
  });
};
```

### Flow การ Login

```
┌─────────────────────────────────────────────────────────┐
│ 1. User กรอก Username + Password                        │
│    ในฟอร์ม Login (views/login.ejs)                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. POST /login                                          │
│    passport.authenticate('local')                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. LocalStrategy.verify()                               │
│    ├─ getUserByUsername(username)                       │
│    ├─ bcrypt.compare(password, hashedPassword)          │
│    └─ return user or false                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. serializeUser(user)                                  │
│    ├─ บันทึก user.id ลง Session                        │
│    └─ req.session.passport.user = user.id               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Redirect to /index (Dashboard)                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Request ถัดไป (เช่น GET /patients)                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. deserializeUser(user.id)                             │
│    ├─ อ่าน user.id จาก Session                         │
│    ├─ getUserById(user.id)                              │
│    └─ req.user = user object                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 7. req.user พร้อมใช้งานในทุก Request                   │
└─────────────────────────────────────────────────────────┘
```

### การเข้ารหัสรหัสผ่าน

```javascript
// ======================================
// การสร้างรหัสผ่าน (Register/Create User)
// ======================================
const bcrypt = require('bcryptjs');

async function hashPassword(plainPassword) {
  // สร้าง Salt (ค่าสุ่มเพื่อความปลอดภัย)
  const salt = await bcrypt.genSalt(10);

  // เข้ารหัสรหัสผ่าน
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  return hashedPassword;
}

// ตัวอย่าง:
// plainPassword = "password123"
// salt = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
// hashedPassword = "$2a$10$N9qo8uLOickgx2ZMRZoMye92ldGxad68LJZdL17lhWy..."

// ======================================
// การตรวจสอบรหัสผ่าน (Login)
// ======================================
async function verifyPassword(plainPassword, hashedPassword) {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch; // true or false
}

// ตัวอย่าง:
// bcrypt.compare("password123", hashedPassword) → true
// bcrypt.compare("wrongpassword", hashedPassword) → false
```

### Session Storage

```javascript
// ข้อมูลที่เก็บใน Session:
req.session = {
  passport: {
    user: 5  // user.id
  },
  cookie: {
    originalMaxAge: 86400000,
    expires: "2024-01-02T10:00:00.000Z",
    httpOnly: true,
    path: "/"
  }
}

// ข้อมูลที่เก็บใน req.user (หลัง deserialize):
req.user = {
  id: 5,
  username: "therapist1",
  email: "therapist1@example.com",
  fullname: "สมชาย ใจดี",
  role: "physical_therapist",
  created_at: "2024-01-01T00:00:00.000Z"
}
```

---

## 4. Middleware และการตรวจสอบสิทธิ์

### ไฟล์: `middleware/authMiddleware.js`

```javascript
// ======================================
// 1. isAuthenticated - ตรวจสอบว่า Login แล้วหรือไม่
// ======================================
exports.isAuthenticated = (req, res, next) => {
  // Passport ให้ method req.isAuthenticated()
  if (req.isAuthenticated()) {
    console.log(`✅ Authenticated: ${req.user.username}`);
    return next(); // ผ่าน! ไปขั้นตอนต่อไป
  }

  console.log(`❌ Not authenticated - redirecting to /login`);
  req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
  res.redirect('/login');
};

// ======================================
// 2. redirectIfAuthenticated - ถ้า Login แล้วห้ามเข้า
// ======================================
exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    // Login แล้ว ส่งไป Dashboard
    return res.redirect('/index');
  }
  next(); // ยังไม่ Login ให้เข้าได้ (เช่นหน้า Login)
};

// ======================================
// 3. checkRole - ตรวจสอบสิทธิ์ตาม Role
// ======================================
exports.checkRole = (requiredRole) => {
  return (req, res, next) => {
    // ตรวจสอบว่า Login หรือยัง
    if (!req.isAuthenticated()) {
      req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
      return res.redirect('/login');
    }

    const userRole = req.user.role;

    // Admin เข้าถึงได้ทุกอย่าง
    if (userRole === 'admin') {
      console.log(`✅ Admin bypass: ${req.user.username}`);
      return next();
    }

    // ตรวจสอบ Role
    // requiredRole อาจเป็น String หรือ Array
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    if (allowedRoles.includes(userRole)) {
      console.log(`✅ Role authorized: ${userRole} → ${req.path}`);
      return next();
    }

    // ไม่มีสิทธิ์
    console.log(`❌ Unauthorized: ${userRole} → ${req.path}`);
    req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');

    // ตรวจสอบว่าเป็น API Request หรือไม่
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'คุณไม่มีสิทธิ์เข้าถึง'
      });
    }

    res.redirect('/index');
  };
};

// ======================================
// 4. checkAdminOnly - เฉพาะ Admin
// ======================================
exports.checkAdminOnly = exports.checkRole('admin');

// ======================================
// 5. checkPhysicalTherapist - PT หรือ Admin
// ======================================
exports.checkPhysicalTherapist = exports.checkRole(['physical_therapist', 'admin']);

// ======================================
// 6. checkStaff - Staff, PT หรือ Admin
// ======================================
exports.checkStaff = exports.checkRole(['staff', 'physical_therapist', 'admin']);

// ======================================
// 7. checkStaffOnly - เฉพาะ Staff
// ======================================
exports.checkStaffOnly = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    return res.redirect('/login');
  }

  if (req.user.role === 'staff') {
    return next();
  }

  req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
  res.redirect('/index');
};

// ======================================
// 8. checkNotStaff - PT หรือ Admin (ไม่รวม Staff)
// ======================================
exports.checkNotStaff = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    return res.redirect('/login');
  }

  const userRole = req.user.role;

  if (userRole === 'physical_therapist' || userRole === 'admin') {
    return next();
  }

  req.flash('error', 'เฉพาะนักกายภาพบำบัดเท่านั้นที่เข้าถึงได้');
  res.redirect('/index');
};

// ======================================
// 9. makeUserAvailable - ส่ง User ไปทุก View
// ======================================
exports.makeUserAvailable = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
};
```

### ตัวอย่างการใช้งาน Middleware

```javascript
// ในไฟล์ routes/examinationRoutes.js

const express = require('express');
const router = express.Router();
const examinationController = require('../controllers/examinationController');
const {
  isAuthenticated,
  checkRole,
  checkPhysicalTherapist
} = require('../middleware/authMiddleware');

// Route ที่ต้อง Login เท่านั้น
router.get('/examinationroom/:HN',
  isAuthenticated,  // Middleware 1: ต้อง Login
  examinationController.showExaminationRoom
);

// Route ที่ต้องเป็น PT หรือ Admin
router.post('/patientexamination/:HN',
  isAuthenticated,           // Middleware 1: ต้อง Login
  checkPhysicalTherapist,    // Middleware 2: ต้องเป็น PT หรือ Admin
  examinationController.savePatientExamination
);

// Route ที่รองรับหลาย Role
router.get('/examinationHistory/:HN',
  isAuthenticated,
  checkRole(['physical_therapist', 'admin', 'staff']), // PT, Admin, หรือ Staff
  examinationController.showExaminationHistory
);

// Route สำหรับ Admin เท่านั้น
router.delete('/examination/:examId/delete',
  isAuthenticated,
  checkRole('admin'),  // เฉพาะ Admin
  examinationController.deleteExamination
);
```

### Flow การทำงานของ Middleware

```
Request: GET /examinationroom/670001

┌─────────────────────────────────────┐
│ 1. Express Middleware Stack         │
│    ├─ Body Parser                   │
│    ├─ Session                       │
│    ├─ Passport                      │
│    └─ Global Variables              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Route Middleware (ตามลำดับ)      │
│    ├─ isAuthenticated()             │
│    │   ├─ req.isAuthenticated()?    │
│    │   ├─ Yes → next()              │
│    │   └─ No → redirect('/login')   │
│    │                                 │
│    ├─ checkPhysicalTherapist()      │
│    │   ├─ req.user.role?            │
│    │   ├─ admin → next()            │
│    │   ├─ PT → next()               │
│    │   └─ staff → redirect + error  │
│    │                                 │
│    └─ Controller Function           │
│        showExaminationRoom()        │
└─────────────────────────────────────┘
```

---

## 5. Model - Database Operations

### ตัวอย่าง: Patient Model (`models/patientModel.js`)

```javascript
const db = require('../config/db');

class PatientModel {

  // ======================================
  // 1. CREATE - สร้างผู้ป่วยใหม่
  // ======================================
  static async createPatient(patientData) {
    try {
      // สร้าง HN อัตโนมัติ
      const HN = await this.generateNextHN();

      // เพิ่ม HN เข้าไปใน patientData
      patientData.HN = HN;

      // SQL Query
      const query = `
        INSERT INTO patient (
          HN, fname, lname, national_id, gender, dob, age,
          phone, email, address, emergency_contact, emergency_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        patientData.HN,
        patientData.fname,
        patientData.lname,
        patientData.national_id,
        patientData.gender,
        patientData.dob,
        patientData.age,
        patientData.phone,
        patientData.email,
        patientData.address,
        patientData.emergency_contact,
        patientData.emergency_phone
      ];

      // Execute Query
      const result = await db.queryAsync(query, params);

      console.log(`✅ Patient created: ${HN}`);

      return {
        success: true,
        HN: HN,
        insertId: result.insertId
      };

    } catch (error) {
      console.error('❌ Error creating patient:', error);

      // ตรวจสอบ Error ประเภทต่างๆ
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('national_id')) {
          throw new Error('เลขบัตรประชาชนนี้มีในระบบแล้ว');
        }
        throw new Error('ข้อมูลซ้ำในระบบ');
      }

      throw error;
    }
  }

  // ======================================
  // 2. READ - ค้นหาผู้ป่วย
  // ======================================

  /**
   * ค้นหาด้วย HN
   */
  static async searchPatientByHN(HN) {
    try {
      const query = 'SELECT * FROM patient WHERE HN = ?';
      const results = await db.queryAsync(query, [HN]);

      if (results.length === 0) {
        return null;
      }

      return results[0];

    } catch (error) {
      console.error('Error searching patient by HN:', error);
      throw error;
    }
  }

  /**
   * ค้นหาด้วยชื่อ
   */
  static async searchPatientsByName(name) {
    try {
      const query = `
        SELECT * FROM patient
        WHERE fname LIKE ? OR lname LIKE ?
        ORDER BY created_at DESC
      `;

      const searchTerm = `%${name}%`;
      const results = await db.queryAsync(query, [searchTerm, searchTerm]);

      return results;

    } catch (error) {
      console.error('Error searching patients by name:', error);
      throw error;
    }
  }

  /**
   * ค้นหาด้วยเลขบัตรประชาชน
   */
  static async searchPatientByNationalId(nationalId) {
    try {
      const query = 'SELECT * FROM patient WHERE national_id = ?';
      const results = await db.queryAsync(query, [nationalId]);

      if (results.length === 0) {
        return null;
      }

      return results[0];

    } catch (error) {
      console.error('Error searching patient by national ID:', error);
      throw error;
    }
  }

  /**
   * ดึงผู้ป่วยทั้งหมด
   */
  static async getAllPatients(limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM patient
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const results = await db.queryAsync(query, [limit, offset]);
      return results;

    } catch (error) {
      console.error('Error getting all patients:', error);
      throw error;
    }
  }

  // ======================================
  // 3. UPDATE - อัพเดทข้อมูล
  // ======================================
  static async updatePatient(HN, patientData) {
    try {
      const query = `
        UPDATE patient
        SET fname = ?, lname = ?, gender = ?, dob = ?, age = ?,
            phone = ?, email = ?, address = ?,
            emergency_contact = ?, emergency_phone = ?
        WHERE HN = ?
      `;

      const params = [
        patientData.fname,
        patientData.lname,
        patientData.gender,
        patientData.dob,
        patientData.age,
        patientData.phone,
        patientData.email,
        patientData.address,
        patientData.emergency_contact,
        patientData.emergency_phone,
        HN
      ];

      const result = await db.queryAsync(query, params);

      if (result.affectedRows === 0) {
        throw new Error('ไม่พบผู้ป่วยที่ต้องการอัพเดท');
      }

      console.log(`✅ Patient updated: ${HN}`);
      return { success: true };

    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  // ======================================
  // 4. DELETE - ลบข้อมูล
  // ======================================
  static async deletePatient(HN) {
    try {
      const query = 'DELETE FROM patient WHERE HN = ?';
      const result = await db.queryAsync(query, [HN]);

      if (result.affectedRows === 0) {
        throw new Error('ไม่พบผู้ป่วยที่ต้องการลบ');
      }

      console.log(`✅ Patient deleted: ${HN}`);
      return { success: true };

    } catch (error) {
      console.error('Error deleting patient:', error);

      // ตรวจสอบ Foreign Key Constraint
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new Error('ไม่สามารถลบได้ เนื่องจากมีข้อมูลที่เกี่ยวข้องในระบบ');
      }

      throw error;
    }
  }

  // ======================================
  // 5. STATISTICS - สถิติ
  // ======================================

  /**
   * นับจำนวนผู้ป่วยทั้งหมด
   */
  static async getTotalCount() {
    try {
      const query = 'SELECT COUNT(*) as total FROM patient';
      const results = await db.queryAsync(query);
      return results[0].total;
    } catch (error) {
      console.error('Error getting total count:', error);
      throw error;
    }
  }

  /**
   * นับจำนวนผู้ป่วยที่ลงทะเบียนวันนี้
   */
  static async getTodayCount() {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM patient
        WHERE DATE(created_at) = CURDATE()
      `;
      const results = await db.queryAsync(query);
      return results[0].total;
    } catch (error) {
      console.error('Error getting today count:', error);
      throw error;
    }
  }

  /**
   * สถิติรายเดือน
   */
  static async getMonthlyStats(year, month) {
    try {
      const query = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM patient
        WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const results = await db.queryAsync(query, [year, month]);
      return results;
    } catch (error) {
      console.error('Error getting monthly stats:', error);
      throw error;
    }
  }

  // ======================================
  // 6. HELPER FUNCTIONS
  // ======================================

  /**
   * สร้าง HN ใหม่
   * รูปแบบ: YY0001 (YY = ปีพ.ศ. 2 หลักท้าย)
   */
  static async generateNextHN() {
    try {
      // ดึงปีปัจจุบัน (พ.ศ.)
      const now = new Date();
      const buddhistYear = now.getFullYear() + 543;
      const yearPrefix = buddhistYear.toString().slice(-2); // เอา 2 หลักท้าย

      // หา HN ล่าสุดในปีนี้
      const query = `
        SELECT HN
        FROM patient
        WHERE HN LIKE ?
        ORDER BY HN DESC
        LIMIT 1
      `;

      const results = await db.queryAsync(query, [`${yearPrefix}%`]);

      let nextNumber = 1;

      if (results.length > 0) {
        // แยกเอาตัวเลขออกมา
        const lastHN = results[0].HN;
        const lastNumber = parseInt(lastHN.substring(2));
        nextNumber = lastNumber + 1;
      }

      // Format เป็น 4 หลัก (0001, 0002, ...)
      const HN = yearPrefix + nextNumber.toString().padStart(4, '0');

      console.log(`Generated HN: ${HN}`);
      return HN;

    } catch (error) {
      console.error('Error generating HN:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่ามีเลขบัตรประชาชนนี้แล้วหรือไม่
   */
  static async checkNationalIdExists(nationalId) {
    try {
      const query = 'SELECT HN FROM patient WHERE national_id = ?';
      const results = await db.queryAsync(query, [nationalId]);
      return results.length > 0;
    } catch (error) {
      console.error('Error checking national ID:', error);
      throw error;
    }
  }
}

module.exports = PatientModel;
```

### การทำงานของ SQL Queries

```javascript
// ======================================
// INSERT - เพิ่มข้อมูล
// ======================================
const query = 'INSERT INTO table_name SET ?';
const data = { name: 'John', age: 30 };
await db.queryAsync(query, data);
// SQL: INSERT INTO table_name (name, age) VALUES ('John', 30)

// ======================================
// SELECT - ดึงข้อมูล
// ======================================
const query = 'SELECT * FROM users WHERE id = ?';
const results = await db.queryAsync(query, [5]);
// SQL: SELECT * FROM users WHERE id = 5

// ======================================
// UPDATE - อัพเดทข้อมูล
// ======================================
const query = 'UPDATE users SET name = ? WHERE id = ?';
await db.queryAsync(query, ['John Doe', 5]);
// SQL: UPDATE users SET name = 'John Doe' WHERE id = 5

// ======================================
// DELETE - ลบข้อมูล
// ======================================
const query = 'DELETE FROM users WHERE id = ?';
await db.queryAsync(query, [5]);
// SQL: DELETE FROM users WHERE id = 5

// ======================================
// JOIN - เชื่อมตาราง
// ======================================
const query = `
  SELECT p.*, a.appointment_date
  FROM patient p
  LEFT JOIN appointments a ON p.HN = a.HN
  WHERE p.HN = ?
`;
const results = await db.queryAsync(query, ['670001']);

// ======================================
// COUNT - นับจำนวน
// ======================================
const query = 'SELECT COUNT(*) as total FROM patient';
const results = await db.queryAsync(query);
const total = results[0].total;

// ======================================
// LIKE - ค้นหาแบบไม่แน่นอน
// ======================================
const query = 'SELECT * FROM patient WHERE fname LIKE ?';
await db.queryAsync(query, ['%สม%']);
// ค้นหาชื่อที่มีคำว่า "สม" (เช่น สมชาย, สมหญิง, ประสม)
```

---

## 6. Controller - Business Logic

### ตัวอย่าง: Patient Controller (`controllers/patientController.js`)

```javascript
const PatientModel = require('../models/patientModel');

// ======================================
// 1. แสดงหน้าค้นหาผู้ป่วย
// ======================================
exports.searchPage = async (req, res) => {
  try {
    res.render('patients', {
      title: 'ค้นหาผู้ป่วย',
      user: req.user,
      patients: []
    });
  } catch (error) {
    console.error('Error in searchPage:', error);
    res.status(500).send('เกิดข้อผิดพลาด');
  }
};

// ======================================
// 2. แสดงฟอร์มเพิ่มผู้ป่วยใหม่
// ======================================
exports.showAddForm = async (req, res) => {
  try {
    res.render('patientForm', {
      title: 'ลงทะเบียนผู้ป่วยใหม่',
      user: req.user,
      action: 'add',
      patient: null  // ไม่มีข้อมูลเดิม (สร้างใหม่)
    });
  } catch (error) {
    console.error('Error in showAddForm:', error);
    res.status(500).send('เกิดข้อผิดพลาด');
  }
};

// ======================================
// 3. บันทึกผู้ป่วยใหม่
// ======================================
exports.addPatient = async (req, res) => {
  try {
    // 1. รับข้อมูลจากฟอร์ม
    const patientData = {
      fname: req.body.fname,
      lname: req.body.lname,
      national_id: req.body.national_id,
      gender: req.body.gender,
      dob: req.body.dob,
      age: req.body.age,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      emergency_contact: req.body.emergency_contact,
      emergency_phone: req.body.emergency_phone
    };

    // 2. Validation
    if (!patientData.fname || !patientData.lname) {
      req.flash('error', 'กรุณากรอกชื่อ-นามสกุล');
      return res.redirect('/patients/add');
    }

    if (!patientData.national_id) {
      req.flash('error', 'กรุณากรอกเลขบัตรประชาชน');
      return res.redirect('/patients/add');
    }

    // 3. ตรวจสอบว่ามีเลขบัตรซ้ำหรือไม่
    const exists = await PatientModel.checkNationalIdExists(patientData.national_id);

    if (exists) {
      req.flash('error', 'เลขบัตรประชาชนนี้มีในระบบแล้ว');
      return res.redirect('/patients/add');
    }

    // 4. บันทึกข้อมูล
    const result = await PatientModel.createPatient(patientData);

    // 5. แสดงข้อความสำเร็จ
    req.flash('success', `ลงทะเบียนผู้ป่วยสำเร็จ HN: ${result.HN}`);

    // 6. Redirect ไปหน้าข้อมูลผู้ป่วย
    res.redirect(`/patients/${result.HN}`);

  } catch (error) {
    console.error('Error in addPatient:', error);
    req.flash('error', error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    res.redirect('/patients/add');
  }
};

// ======================================
// 4. ค้นหาผู้ป่วย
// ======================================
exports.searchPatientByHN = async (req, res) => {
  try {
    const query = req.query.query; // รับค่าจาก ?query=xxx

    if (!query) {
      return res.render('patients', {
        title: 'ค้นหาผู้ป่วย',
        user: req.user,
        patients: []
      });
    }

    let patients = [];

    // ตรวจสอบว่าเป็น HN หรือชื่อ
    if (query.match(/^\d{6}$/)) {
      // เป็นตัวเลข 6 หลัก → ค้นหาด้วย HN
      const patient = await PatientModel.searchPatientByHN(query);
      if (patient) {
        patients = [patient];
      }
    } else {
      // ไม่ใช่ตัวเลข → ค้นหาด้วยชื่อ
      patients = await PatientModel.searchPatientsByName(query);
    }

    res.render('patients', {
      title: 'ค้นหาผู้ป่วย',
      user: req.user,
      patients: patients,
      query: query
    });

  } catch (error) {
    console.error('Error in searchPatientByHN:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการค้นหา');
    res.redirect('/patients');
  }
};

// ======================================
// 5. แสดงข้อมูลผู้ป่วย
// ======================================
exports.viewPatient = async (req, res) => {
  try {
    const HN = req.params.HN;

    // 1. ดึงข้อมูลผู้ป่วย
    const patient = await PatientModel.searchPatientByHN(HN);

    if (!patient) {
      req.flash('error', 'ไม่พบผู้ป่วยที่ต้องการ');
      return res.redirect('/patients');
    }

    // 2. ดึงข้อมูลเพิ่มเติม (ถ้าต้องการ)
    // const appointments = await AppointmentModel.getAppointmentsByHN(HN);
    // const medicalHistory = await MedicalModel.getMedicalHistory(HN);

    // 3. Render หน้า
    res.render('patientDetail', {
      title: `ข้อมูลผู้ป่วย - ${patient.fname} ${patient.lname}`,
      user: req.user,
      patient: patient
      // appointments: appointments,
      // medicalHistory: medicalHistory
    });

  } catch (error) {
    console.error('Error in viewPatient:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    res.redirect('/patients');
  }
};
```

### Flow การทำงานของ Controller

```
User กรอกฟอร์มลงทะเบียนผู้ป่วย
┌───────────────────────────────────────┐
│ POST /patients/add                    │
│ Body: {                               │
│   fname: "สมชาย",                     │
│   lname: "ใจดี",                      │
│   national_id: "1234567890123",       │
│   ...                                 │
│ }                                     │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│ Controller: addPatient()              │
│                                       │
│ 1. รับข้อมูลจาก req.body             │
│    patientData = {                    │
│      fname: req.body.fname,           │
│      lname: req.body.lname,           │
│      ...                              │
│    }                                  │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│ 2. Validation                         │
│    if (!fname || !lname) {            │
│      req.flash('error', 'กรอกข้อมูล') │
│      return redirect('/patients/add') │
│    }                                  │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│ 3. ตรวจสอบข้อมูลซ้ำ                  │
│    exists = await                     │
│      PatientModel.checkNationalId()   │
│    if (exists) {                      │
│      flash error + redirect           │
│    }                                  │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│ 4. เรียก Model                        │
│    result = await                     │
│      PatientModel.createPatient()     │
│    ↓                                  │
│    Model สร้าง HN                     │
│    Model INSERT ลงฐานข้อมูล           │
│    Model return { HN: '670001' }      │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│ 5. Flash Message                      │
│    req.flash('success',               │
│      'ลงทะเบียนสำเร็จ HN: 670001')   │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│ 6. Redirect                           │
│    res.redirect('/patients/670001')   │
└───────────────────────────────────────┘
```

---

## 7. Routes - API Endpoints

### ตัวอย่าง: Examination Routes (`routes/examinationRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const examinationController = require('../controllers/examinationController');
const {
  isAuthenticated,
  checkPhysicalTherapist
} = require('../middleware/authMiddleware');

// ======================================
// GET ROUTES
// ======================================

// หน้าห้องตรวจ
router.get('/examinationroom/:HN',
  isAuthenticated,
  checkPhysicalTherapist,
  examinationController.showExaminationRoom
);

// ฟอร์มตรวจผู้ป่วย
router.get('/patientexamination/:HN',
  isAuthenticated,
  checkPhysicalTherapist,
  examinationController.showPatientExamination
);

// ประวัติการตรวจ
router.get('/examinationHistory/:HN',
  isAuthenticated,
  examinationController.showExaminationHistory
);

// รายละเอียดการตรวจ
router.get('/examinationDetail/:HN/:examId',
  isAuthenticated,
  examinationController.showExaminationDetail
);

// พิมพ์รายงาน
router.get('/examinationPrint/:examId',
  isAuthenticated,
  examinationController.showExaminationPrint
);

// ======================================
// POST ROUTES (API-style)
// ======================================

// บันทึกผลการตรวจ
router.post('/patientexamination/:HN',
  isAuthenticated,
  checkPhysicalTherapist,
  examinationController.savePatientExamination
);

// ดึงข้อมูลล่าสุด
router.post('/examination/latest/:HN',
  isAuthenticated,
  examinationController.getLatestExamination
);

// ดึงตามวันที่
router.post('/examination/bydate',
  isAuthenticated,
  examinationController.getExaminationsByDate
);

// ดึงวันที่ทั้งหมด
router.post('/examination/dates/:HN',
  isAuthenticated,
  examinationController.getExaminationDates
);

// ค้นหา
router.post('/examination/search',
  isAuthenticated,
  examinationController.searchExaminations
);

// สถิติ
router.post('/examination/statistics/:HN',
  isAuthenticated,
  examinationController.getExaminationStatistics
);

// อัพเดท
router.post('/examination/:examId/update',
  isAuthenticated,
  checkPhysicalTherapist,
  examinationController.updateExamination
);

// ลบ
router.post('/examination/:examId/delete',
  isAuthenticated,
  checkPhysicalTherapist,
  examinationController.deleteExamination
);

// เปรียบเทียบ
router.post('/examination/compare',
  isAuthenticated,
  examinationController.compareExaminations
);

// สรุปรายเดือน
router.post('/examination/summary/monthly',
  isAuthenticated,
  examinationController.getMonthlySummary
);

// สรุปรายปี
router.post('/examination/summary/yearly/:year',
  isAuthenticated,
  examinationController.getYearlySummary
);

module.exports = router;
```

### ประเภทของ Routes

```javascript
// ======================================
// 1. HTML Routes (ส่ง HTML กลับไป)
// ======================================
router.get('/patients', (req, res) => {
  res.render('patients', { ... });
});

// ======================================
// 2. JSON API Routes (ส่ง JSON กลับไป)
// ======================================
router.post('/api/patients/search', (req, res) => {
  res.json({
    success: true,
    data: patients
  });
});

// ======================================
// 3. Redirect Routes
// ======================================
router.post('/patients/add', async (req, res) => {
  // บันทึกข้อมูล
  res.redirect('/patients/670001');
});

// ======================================
// 4. Download Routes
// ======================================
router.get('/reports/pdf/:id', async (req, res) => {
  const pdfBuffer = await generatePDF();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdfBuffer);
});
```

---

## 8. Views - Frontend Templates

### ตัวอย่าง: Login Page (`views/login.ejs`)

```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>เข้าสู่ระบบ - PTH-X-P</title>
  <link rel="stylesheet" href="/css/login.css">
</head>
<body>
  <div class="login-container">
    <div class="login-box">
      <h1>ระบบจัดการคลินิกกายภาพบำบัด</h1>
      <h2>PTH-X-P</h2>

      <!-- Flash Messages -->
      <% if (messages.error && messages.error.length > 0) { %>
        <div class="alert alert-error">
          <%= messages.error %>
        </div>
      <% } %>

      <% if (messages.success && messages.success.length > 0) { %>
        <div class="alert alert-success">
          <%= messages.success %>
        </div>
      <% } %>

      <!-- Login Form -->
      <form action="/login" method="POST">
        <div class="form-group">
          <label for="username">ชื่อผู้ใช้</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            autofocus
            autocomplete="username"
          >
        </div>

        <div class="form-group">
          <label for="password">รหัสผ่าน</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autocomplete="current-password"
          >
        </div>

        <button type="submit" class="btn btn-primary">
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  </div>

  <script>
    // ฟังก์ชันซ่อนข้อความหลัง 5 วินาที
    setTimeout(() => {
      const alerts = document.querySelectorAll('.alert');
      alerts.forEach(alert => {
        alert.style.display = 'none';
      });
    }, 5000);
  </script>
</body>
</html>
```

### EJS Syntax และการใช้งาน

```html
<!-- ======================================
     1. แสดงค่าตัวแปร (Escaped HTML)
     ====================================== -->
<p>ชื่อผู้ใช้: <%= user.username %></p>
<!-- Output: ชื่อผู้ใช้: therapist1 -->

<!-- ======================================
     2. แสดงค่าตัวแปร (Unescaped HTML)
     ====================================== -->
<div><%- htmlContent %></div>
<!-- ใช้เมื่อต้องการแสดง HTML -->

<!-- ======================================
     3. JavaScript Control Flow
     ====================================== -->
<% if (user.role === 'admin') { %>
  <a href="/admin">Admin Panel</a>
<% } else { %>
  <span>ไม่มีสิทธิ์</span>
<% } %>

<!-- ======================================
     4. Loop
     ====================================== -->
<ul>
  <% patients.forEach(patient => { %>
    <li><%= patient.fname %> <%= patient.lname %></li>
  <% }); %>
</ul>

<!-- ======================================
     5. Include ไฟล์อื่น
     ====================================== -->
<%- include('partials/header') %>
<div class="content">
  <!-- Content here -->
</div>
<%- include('partials/footer') %>

<!-- ======================================
     6. ตรวจสอบค่า undefined
     ====================================== -->
<% if (typeof patient !== 'undefined' && patient) { %>
  <p>HN: <%= patient.HN %></p>
<% } %>

<!-- ======================================
     7. ใช้ Helper Functions
     ====================================== -->
<p>วันที่: <%= new Date().toLocaleDateString('th-TH') %></p>
```

---

## 9. Client-Side JavaScript

### ตัวอย่าง: Billing Form (`public/js/billing.js`)

```javascript
// ======================================
// 1. เริ่มต้นเมื่อโหลดหน้า
// ======================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Billing page loaded');

  // เรียกฟังก์ชันต่างๆ
  initServiceItemTable();
  attachEventListeners();
  calculateTotal();
});

// ======================================
// 2. สร้างตารางรายการบริการ
// ======================================
function initServiceItemTable() {
  const table = document.getElementById('service-items-table');

  if (!table) {
    console.error('Table not found');
    return;
  }

  // เพิ่มแถวแรก
  addServiceItemRow();
}

// ======================================
// 3. เพิ่มแถวรายการบริการ
// ======================================
function addServiceItemRow() {
  const tbody = document.querySelector('#service-items-table tbody');
  const rowCount = tbody.querySelectorAll('tr').length + 1;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${rowCount}</td>
    <td>
      <input type="text"
             name="service_code[]"
             class="form-control"
             placeholder="รหัสบริการ">
    </td>
    <td>
      <input type="text"
             name="service_name[]"
             class="form-control"
             placeholder="ชื่อบริการ"
             required>
    </td>
    <td>
      <input type="number"
             name="quantity[]"
             class="form-control quantity"
             value="1"
             min="1"
             required>
    </td>
    <td>
      <input type="number"
             name="unit_price[]"
             class="form-control unit-price"
             value="0"
             min="0"
             step="0.01"
             required>
    </td>
    <td>
      <input type="number"
             name="total_price[]"
             class="form-control total-price"
             value="0"
             readonly>
    </td>
    <td>
      <button type="button"
              class="btn btn-danger btn-sm remove-row"
              onclick="removeServiceItemRow(this)">
        ลบ
      </button>
    </td>
  `;

  tbody.appendChild(row);

  // Attach event listeners สำหรับแถวใหม่
  attachRowEventListeners(row);
}

// ======================================
// 4. ลบแถว
// ======================================
function removeServiceItemRow(button) {
  const row = button.closest('tr');
  const tbody = row.parentElement;

  // ต้องเหลืออย่างน้อย 1 แถว
  if (tbody.querySelectorAll('tr').length > 1) {
    row.remove();
    updateRowNumbers();
    calculateTotal();
  } else {
    alert('ต้องมีรายการบริการอย่างน้อย 1 รายการ');
  }
}

// ======================================
// 5. อัพเดทเลขที่แถว
// ======================================
function updateRowNumbers() {
  const rows = document.querySelectorAll('#service-items-table tbody tr');
  rows.forEach((row, index) => {
    row.querySelector('td:first-child').textContent = index + 1;
  });
}

// ======================================
// 6. คำนวณราคารวมของแต่ละแถว
// ======================================
function calculateRowTotal(row) {
  const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
  const unitPrice = parseFloat(row.querySelector('.unit-price').value) || 0;
  const totalPrice = quantity * unitPrice;

  row.querySelector('.total-price').value = totalPrice.toFixed(2);

  calculateTotal();
}

// ======================================
// 7. คำนวณยอดรวมทั้งหมด
// ======================================
function calculateTotal() {
  let subtotal = 0;

  // รวมราคาทุกแถว
  document.querySelectorAll('.total-price').forEach(input => {
    subtotal += parseFloat(input.value) || 0;
  });

  // ดึงค่า Discount และ Tax
  const discountAmount = parseFloat(document.getElementById('discount_amount')?.value) || 0;
  const taxRate = parseFloat(document.getElementById('tax_rate')?.value) || 0;

  // คำนวณ Tax
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);

  // คำนวณยอดสุทธิ
  const totalAmount = subtotal - discountAmount + taxAmount;

  // แสดงผล
  document.getElementById('subtotal').value = subtotal.toFixed(2);
  document.getElementById('tax_amount').value = taxAmount.toFixed(2);
  document.getElementById('total_amount').value = totalAmount.toFixed(2);

  // แสดงเป็นตัวหนา
  document.getElementById('display-subtotal').textContent = subtotal.toFixed(2);
  document.getElementById('display-discount').textContent = discountAmount.toFixed(2);
  document.getElementById('display-tax').textContent = taxAmount.toFixed(2);
  document.getElementById('display-total').textContent = totalAmount.toFixed(2);
}

// ======================================
// 8. Attach Event Listeners
// ======================================
function attachEventListeners() {
  // ปุ่มเพิ่มแถว
  const addButton = document.getElementById('add-service-item');
  if (addButton) {
    addButton.addEventListener('click', addServiceItemRow);
  }

  // Discount และ Tax
  const discountInput = document.getElementById('discount_amount');
  const taxRateInput = document.getElementById('tax_rate');

  if (discountInput) {
    discountInput.addEventListener('input', calculateTotal);
  }

  if (taxRateInput) {
    taxRateInput.addEventListener('input', calculateTotal);
  }
}

function attachRowEventListeners(row) {
  // เมื่อเปลี่ยนจำนวนหรือราคา
  const quantityInput = row.querySelector('.quantity');
  const unitPriceInput = row.querySelector('.unit-price');

  quantityInput.addEventListener('input', () => calculateRowTotal(row));
  unitPriceInput.addEventListener('input', () => calculateRowTotal(row));
}

// ======================================
// 9. Validation ก่อน Submit
// ======================================
function validateBillForm() {
  const rows = document.querySelectorAll('#service-items-table tbody tr');

  if (rows.length === 0) {
    alert('กรุณาเพิ่มรายการบริการอย่างน้อย 1 รายการ');
    return false;
  }

  // ตรวจสอบแต่ละแถว
  for (let row of rows) {
    const serviceName = row.querySelector('[name="service_name[]"]').value;
    const quantity = row.querySelector('[name="quantity[]"]').value;
    const unitPrice = row.querySelector('[name="unit_price[]"]').value);

    if (!serviceName || quantity <= 0 || unitPrice <= 0) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return false;
    }
  }

  return true;
}

// ======================================
// 10. AJAX - บันทึกบิล
// ======================================
async function saveBill(HN) {
  // รวบรวมข้อมูล
  const formData = {
    HN: HN,
    service_items: [],
    subtotal: document.getElementById('subtotal').value,
    discount_amount: document.getElementById('discount_amount').value,
    tax_amount: document.getElementById('tax_amount').value,
    total_amount: document.getElementById('total_amount').value,
    payment_method: document.getElementById('payment_method').value,
    notes: document.getElementById('notes').value
  };

  // เก็บรายการบริการ
  const rows = document.querySelectorAll('#service-items-table tbody tr');
  rows.forEach(row => {
    formData.service_items.push({
      service_code: row.querySelector('[name="service_code[]"]').value,
      service_name: row.querySelector('[name="service_name[]"]').value,
      quantity: row.querySelector('[name="quantity[]"]').value,
      unit_price: row.querySelector('[name="unit_price[]"]').value,
      total_price: row.querySelector('[name="total_price[]"]').value
    });
  });

  try {
    // ส่งข้อมูลไปยัง Server
    const response = await fetch(`/billing/${HN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      alert('บันทึกบิลสำเร็จ');
      window.location.href = `/billing/detail/${result.billId}`;
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.message);
    }

  } catch (error) {
    console.error('Error saving bill:', error);
    alert('เกิดข้อผิดพลาดในการบันทึก');
  }
}
```

---

## 10. ตัวอย่าง Flow การทำงานแบบสมบูรณ์

### สถานการณ์: นักกายภาพบำบัดบันทึกผลการตรวจร่างกาย

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User เปิดเว็บไซต์และ Login                                │
│    URL: http://localhost:3000/login                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /login                                              │
│    ├─ Body: { username: "therapist1", password: "***" }    │
│    ├─ passport.authenticate('local')                        │
│    ├─ LocalStrategy.verify()                                │
│    │   ├─ getUserByUsername("therapist1")                   │
│    │   ├─ bcrypt.compare(password, hashedPassword)          │
│    │   └─ return user                                       │
│    ├─ serializeUser(user)                                   │
│    │   └─ session.passport.user = 5                         │
│    └─ res.redirect('/index')                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GET /index (Dashboard)                                   │
│    ├─ deserializeUser(5)                                    │
│    │   └─ req.user = { id: 5, username: "therapist1", ... } │
│    ├─ StatsModel.getDashboardStats()                        │
│    └─ res.render('index', { user, stats })                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User ค้นหาผู้ป่วย                                        │
│    URL: /patients/search?query=670001                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. GET /patients/search?query=670001                        │
│    ├─ isAuthenticated ✓                                     │
│    ├─ patientController.searchPatientByHN()                 │
│    │   ├─ const query = req.query.query // "670001"         │
│    │   ├─ PatientModel.searchPatientByHN("670001")          │
│    │   │   └─ db.query('SELECT * FROM patient WHERE HN=?')  │
│    │   └─ return patient                                    │
│    └─ res.render('patients', { patient })                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User คลิก "ห้องตรวจ"                                     │
│    URL: /examinationroom/670001                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. GET /examinationroom/670001                              │
│    ├─ isAuthenticated ✓                                     │
│    ├─ checkPhysicalTherapist ✓                              │
│    │   └─ req.user.role === 'physical_therapist' ✓          │
│    ├─ examinationController.showExaminationRoom()           │
│    │   ├─ const HN = req.params.HN // "670001"              │
│    │   ├─ PatientModel.searchPatientByHN(HN)                │
│    │   ├─ ExaminationModel.getLatestExamination(HN)         │
│    │   └─ return { patient, lastExam }                      │
│    └─ res.render('examinationroom', { patient, lastExam })  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. User กรอกฟอร์มการตรวจ                                   │
│    ├─ Observation: "ผู้ป่วยเดินได้"                        │
│    ├─ ROM Shoulder Flexion: 180                             │
│    ├─ MMT Shoulder: 5                                       │
│    └─ คลิก "บันทึก"                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. POST /patientexamination/670001                          │
│    ├─ isAuthenticated ✓                                     │
│    ├─ checkPhysicalTherapist ✓                              │
│    ├─ req.body = {                                          │
│    │    observation: "ผู้ป่วยเดินได้",                     │
│    │    rom_shoulder_flexion: 180,                          │
│    │    mmt_shoulder: 5,                                    │
│    │    ...                                                 │
│    │  }                                                     │
│    └─ examinationController.savePatientExamination()        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Controller Processing                                   │
│     ├─ const HN = req.params.HN                             │
│     ├─ const data = {                                       │
│     │    HN: "670001",                                      │
│     │    observation: req.body.observation,                 │
│     │    rom: JSON.stringify({                              │
│     │      shoulder: { flexion: 180, ... },                 │
│     │      ...                                              │
│     │    }),                                                │
│     │    mmt: JSON.stringify({ ... }),                      │
│     │    examiner: req.user.fullname                        │
│     │  }                                                    │
│     └─ ExaminationModel.createExaminationRecord(data)       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Model Processing                                        │
│     ├─ const query = `                                      │
│     │    INSERT INTO patient_examination SET ?`             │
│     ├─ const result = await db.queryAsync(query, data)      │
│     └─ return { examId: result.insertId }                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. Database Execution                                      │
│     MySQL executes:                                         │
│     INSERT INTO patient_examination (                       │
│       HN, observation, rom, mmt, examiner, created_at       │
│     ) VALUES (                                              │
│       '670001',                                             │
│       'ผู้ป่วยเดินได้',                                    │
│       '{"shoulder":{"flexion":180}}',                       │
│       '{"shoulder":5}',                                     │
│       'สมชาย ใจดี',                                         │
│       NOW()                                                 │
│     )                                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 13. Response                                                │
│     ├─ req.flash('success', 'บันทึกผลการตรวจสำเร็จ')       │
│     └─ res.redirect('/examinationHistory/670001')           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 14. GET /examinationHistory/670001                          │
│     ├─ ExaminationModel.getExaminationHistory("670001")     │
│     │   └─ SELECT * FROM patient_examination               │
│     │       WHERE HN = '670001'                             │
│     │       ORDER BY created_at DESC                        │
│     └─ res.render('examinationHistory', { exams })          │
└─────────────────────────────────────────────────────────────┘
```

---

## สรุป

### การทำงานของระบบแบบง่าย

```
User (Browser)
    ↓
    ├─ ส่ง Request (GET/POST)
    ↓
Express Middleware
    ├─ Parse Body
    ├─ Check Session
    ├─ Authenticate
    ↓
Routes
    ├─ Match URL Pattern
    ├─ Check Authorization
    ↓
Controller
    ├─ รับข้อมูลจาก req
    ├─ Validate
    ├─ เรียก Model
    ↓
Model
    ├─ สร้าง SQL Query
    ├─ Execute ผ่าน Connection Pool
    ↓
Database
    ├─ ประมวลผล Query
    ├─ ส่งผลลัพธ์กลับ
    ↓
Model
    ├─ แปลงข้อมูล
    ├─ return ไป Controller
    ↓
Controller
    ├─ ประมวลผลข้อมูล
    ├─ เตรียมข้อมูลสำหรับ View
    ├─ res.render() หรือ res.json()
    ↓
View (EJS)
    ├─ รับข้อมูลจาก Controller
    ├─ Render HTML
    ↓
User (Browser)
    └─ แสดงผล
```

### คำแนะนำในการอธิบายกับอาจารย์

1. **เริ่มจากภาพรวม** - อธิบายว่าระบบเป็น MVC Architecture
2. **แสดง Flow Diagram** - วาดภาพการทำงานตั้งแต่ต้นจนจบ
3. **ยกตัวอย่างจริง** - เช่น การลงทะเบียนผู้ป่วย, การบันทึกผลการตรวจ
4. **อธิบาย Middleware** - ว่าทำไมต้องมีการตรวจสอบสิทธิ์
5. **โชว์โค้ดสำคัญ** - Model, Controller, Route ของโมดูลหนึ่งๆ
6. **อธิบายฐานข้อมูล** - Connection Pool, Transaction, JSON Storage
7. **บอก Security** - bcrypt, Session, CSRF Protection

เอกสารนี้ครอบคลุมทุกส่วนของโค้ดและอธิบายการทำงานอย่างละเอียด พร้อมตัวอย่างและ Flow Diagram ที่สามารถนำไปอธิบายกับอาจารย์ได้เลยครับ!
