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
const flash = require('connect-flash');

// Import routes
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const medicalRoutes = require("./routes/medicalRoutes");
const examinationRoutes = require("./routes/examinationRoutes");
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const procedureRoutes = require("./routes/procedureRoutes");
const ptDataRoutes = require("./routes/ptDataRoutes");
const billingRoutes = require("./routes/billingRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Import middleware
const { checkRole } = require('./middleware/authMiddleware');

// Import database
const db = require("./config/db");

const app = express();

// ตั้งค่า Timezone
process.env.TZ = process.env.TZ || 'Asia/Bangkok';

// ตรวจสอบว่าเป็น production หรือไม่
const isProduction = process.env.NODE_ENV === 'production';

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
    secret: process.env.SESSION_SECRET || "PTHKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // เปลี่ยนเป็น false สำหรับ Melon Cloud
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Flash messages middleware
app.use(flash());

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

// Global middleware to make user and flash messages available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
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
app.use("/billing", billingRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {

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
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

// Server setup
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server started on port ${PORT}`);
});