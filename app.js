// app.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes"); // ปิดใช้งานเพื่อหลีกเลี่ยงซ้ำกับ authRoutes
const patientRoutes = require("./routes/patientRoutes");
const medicalRoutes = require("./routes/medicalRoutes");
const examinationRoutes = require("./routes/examinationRoutes");
const { checkRole } = require("./middleware/authMiddleware");

// Import database
const db = require("./config/db");

const app = express();

// ตั้งค่า Timezone
process.env.TZ = process.env.TZ || 'Asia/Bangkok';

// ตรวจสอบว่าเป็น production หรือไม่
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy สำหรับ cloud deployment
if (process.env.TRUST_PROXY === 'true' || isProduction) {
  app.set('trust proxy', 1);
}

// Basic middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride('_method'));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session configuration - ปรับให้ฉลาดขึ้น
app.use(
  session({
    name: process.env.SESSION_NAME || 'connect.sid',
    secret: process.env.SESSION_SECRET || "PTHKey",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction || process.env.TRUST_PROXY === 'true',
    cookie: {
      // ปรับ secure อัตโนมัติตาม environment
      secure: isProduction && process.env.SESSION_SECURE !== 'false',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,
      sameSite: process.env.SESSION_SAME_SITE || 'lax'
    }
  })
);

// Passport configuration (centralized)
require("./config/passportConfig");
app.use(passport.initialize());
app.use(passport.session());

// ใช้ checkRole กลางจาก middleware/authMiddleware เพื่อบังคับสิทธิ์ตามบทบาท

// Global middleware to make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Function to format login notification
function formatLoginNotification(user, req) {
  const timestamp = new Date().toLocaleString('th-TH', { 
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip;
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                  🔐 USER LOGIN DETECTED                 ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║ 📅 Time     : ${timestamp}`);
  console.log(`║ 👤 Username : ${user.username}`);
  console.log(`║ 🆔 User ID  : ${user.id}`);
  console.log(`║ 🎭 Role     : ${user.role || 'user'}`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ [${timestamp}] Login: ${user.username} (${user.role || 'user'})`);
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    timezone: process.env.TZ,
    database: 'checking...',
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
    }
  };
  
  db.ping((err) => {
    if (err) {
      healthcheck.status = 'ERROR';
      healthcheck.database = 'disconnected';
      healthcheck.error = err.message;
      return res.status(503).json(healthcheck);
    }
    
    healthcheck.database = 'connected';
    res.status(200).json(healthcheck);
  });
});

// Root route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Routes
app.use("/", authRoutes);
app.use("/patients", patientRoutes);
app.use("/", medicalRoutes);
app.use("/", examinationRoutes);

// API Routes for AJAX calls
app.get("/api/patients/search", checkRole("user"), (req, res) => {
  const searchTerm = req.query.q || "";
  const searchType = req.query.type || "HN";

  if (!searchTerm) {
    return res.json([]);
  }

  const PatientModel = require('./models/patientModel');
  PatientModel.searchPatients(searchType, searchTerm, (err, results) => {
    if (err) {
      console.error("Error searching patients:", err);
      return res.status(500).json({ error: "ไม่สามารถค้นหาผู้ป่วยได้" });
    }
    res.json(results);
  });
});

// Middleware to track active sessions
let activeSessions = new Map();

app.use((req, res, next) => {
  if (req.user && req.sessionID) {
    if (!activeSessions.has(req.user.id)) {
      activeSessions.set(req.user.id, {
        username: req.user.username,
        role: req.user.role || 'user',
        loginTime: new Date(),
        lastActivity: new Date(),
        sessionID: req.sessionID
      });
    } else {
      activeSessions.get(req.user.id).lastActivity = new Date();
    }
  }
  next();
});

// Endpoint to view active sessions (for admin only)
app.get("/admin/sessions", checkRole("admin"), (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([userId, data]) => ({
    userId,
    ...data,
    duration: Math.floor((new Date() - data.loginTime) / 1000 / 60) + ' minutes'
  }));
  
  console.log('\n📊 Active Sessions:', sessions);
  res.json(sessions);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Application Error:', err.stack);
  
  const viewsPath = app.get('views');
  const fs = require('fs');
  const errorViewPath = path.join(viewsPath, 'error.ejs');
  
  if (fs.existsSync(errorViewPath)) {
    res.status(500).render('error', {
      title: "เกิดข้อผิดพลาด",
      message: "เกิดข้อผิดพลาดในระบบ",
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  } else {
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในระบบ",
      message: process.env.NODE_ENV === 'development' ? err.message : "Internal Server Error"
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  404 Not Found: ${req.method} ${req.url}`);
  
  const viewsPath = app.get('views');
  const fs = require('fs');
  const errorViewPath = path.join(viewsPath, 'error.ejs');
  
  if (fs.existsSync(errorViewPath)) {
    res.status(404).render('error', {
      title: "ไม่พบหน้าที่ต้องการ",
      message: "ไม่พบหน้าที่คุณต้องการ",
      error: null
    });
  } else {
    res.status(404).json({
      error: "ไม่พบหน้าที่ต้องการ",
      path: req.url
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  
  if (activeSessions.size > 0) {
    console.log('\n📊 Active sessions at shutdown:');
    activeSessions.forEach((session, userId) => {
      console.log(`  - ${session.username} (${session.role})`);
    });
  }
  
  db.end(() => {
    console.log('💾 Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received (Ctrl+C)');
  db.end(() => {
    console.log('👋 Goodbye!');
    process.exit(0);
  });
});

// Server setup
const PORT = process.env.PORT || 3000;

// Bind to all interfaces for cloud, localhost for local
const HOST = isProduction ? '0.0.0.0' : '10.104.21.17';

app.listen(PORT, HOST, () => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              🏥 PTN-X-P SERVER STARTED                  ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║ 🚀 Server Port  : ${PORT}                              `);
  console.log(`║ 🌍 Environment  : ${process.env.NODE_ENV || 'development'}                      `);
  console.log(`║ 📅 Started      : ${new Date().toLocaleString('th-TH')} `);
  console.log(`║ 🌐 Timezone     : ${process.env.TZ || 'Not set'}                    `);
  console.log(`║ 💾 Database     : ${process.env.DB_NAME}@${process.env.DB_HOST}  `);
  console.log(`║ 🔒 Session      : ${isProduction ? 'Secure' : 'Standard'}                           `);
  console.log(`║ 💡 ${process.env.DEVELOPED_BY || 'Developed by JIM'}                         ║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  // แสดงการตรวจสอบการตั้งค่า
  console.log('🔐 Configuration Status:');
  console.log('═══════════════════════════════════');
  
  const checks = [
    {
      name: 'Environment',
      value: process.env.NODE_ENV || 'development',
      ok: true
    },
    {
      name: 'Port',
      value: PORT,
      ok: PORT !== 3306
    },
    {
      name: 'Database',
      value: `${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`,
      ok: true
    },
    {
      name: 'Session Security',
      value: isProduction ? 'Enabled (Production)' : 'Disabled (Development)',
      ok: true
    },
    {
      name: 'Character Set',
      value: process.env.DB_CHARSET || 'Not set',
      ok: process.env.DB_CHARSET === 'utf8mb4'
    },
    {
      name: 'Timezone',
      value: process.env.TZ || 'Not set',
      ok: process.env.TZ === 'Asia/Bangkok'
    }
  ];
  
  checks.forEach(check => {
    const icon = check.ok ? '✅' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.value}`);
  });
});