// app.js - ระบบคลินิกกายภาพบำบัด (PTN-X-P)
require("dotenv").config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require('method-override');

// Import routes
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const medicalRoutes = require("./routes/medicalRoutes");
const examinationRoutes = require("./routes/examinationRoutes");
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const procedureRoutes = require("./routes/procedureRoutes");
const ptDataRoutes = require("./routes/ptDataRoutes");
const billingRoutes = require("./routes/billingRoutes");

// Import middleware
const { checkRole } = require('./middleware/authMiddleware');

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

// Session configuration
app.use(
  session({
    name: process.env.SESSION_NAME || 'connect.sid',
    secret: process.env.SESSION_SECRET || "PTHKey",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction || process.env.TRUST_PROXY === 'true',
    cookie: {
      secure: isProduction && process.env.SESSION_SECURE !== 'false',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,
      sameSite: process.env.SESSION_SAME_SITE || 'lax'
    }
  })
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport LocalStrategy
passport.use(
  new LocalStrategy((username, password, done) => {
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, results) => {
      if (err) return done(err);
      if (results.length === 0) return done(null, false, { message: "ไม่พบผู้ใช้" });

      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "รหัสผ่านไม่ถูกต้อง" });
        }
      });
    });
  })
);

// Passport serialize/deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) return done(err);
    done(null, results[0]);
  });
});

// Global middleware to make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

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
app.use("/", diagnosisRoutes);
app.use("/", procedureRoutes);
app.use("/", ptDataRoutes);
app.use("/", billingRoutes);

// ไม่ใช้ API - ใช้ form submit แทน

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  404 Not Found: ${req.method} ${req.url}`);

  // ไม่ใช้ API แล้ว - redirect ไปหน้า login

  // สำหรับ page requests
  res.status(404).render('error', {
    title: "ไม่พบหน้าที่ต้องการ",
    message: `ไม่พบหน้า ${req.url}`,
    error: null,
    statusCode: 404
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Application Error:', err.stack);

  const statusCode = err.status || err.statusCode || 500;

  // ไม่ใช้ API แล้ว

  // สำหรับ page requests
  res.status(statusCode).render('error', {
    title: "เกิดข้อผิดพลาด",
    message: err.message || "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err : null,
    statusCode: statusCode
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
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
const HOST = isProduction ? '0.0.0.0' : 'localhost';

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