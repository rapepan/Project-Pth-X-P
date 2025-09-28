const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require('method-override');
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const medicalRoutes = require("./routes/medicalRoutes");

// Import database
const db = require("./config/db");

const app = express();

// Basic middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride('_method')); // For PUT/DELETE requests

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
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
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

// Middleware for role checking
function checkRole(role) {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  };
}

// Global middleware to make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Root route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Auth routes
app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/index");
  }
  res.render("login", { 
    title: "เข้าสู่ระบบ",
    message: req.query.message || null 
  });
});

app.post("/login", 
  passport.authenticate("local", {
    successRedirect: "/index",  
    failureRedirect: "/login?message=รหัสผ่านไม่ถูกต้อง",
    failureFlash: false
  })
);

app.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/index");
  }
  res.render("register", { 
    title: "สมัครสมาชิก",
    message: null 
  });
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/login?message=ออกจากระบบเรียบร้อยแล้ว");
  });
});

app.get("/index", checkRole('user'), (req, res) => {
  res.render("index", { 
    title: "PTN-X-P",
    user: req.user 
  });
});

// Routes - เปิดใช้งานทั้งหมด
app.use("/", userRoutes);
app.use("/patients", patientRoutes);  // เปิดใช้งาน patient routes
app.use("/", medicalRoutes);  // เปิดใช้งาน medical routes (ใช้ / เพราะ path อยู่ใน route แล้ว)

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: "เกิดข้อผิดพลาด",
    message: "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: "ไม่พบหน้าที่ต้องการ",
    message: "ไม่พบหน้าที่คุณต้องการ",
    error: null
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💡 Developed by JIM`);
});