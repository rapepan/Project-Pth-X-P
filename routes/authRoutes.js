const express = require('express');
const router = express.Router();
const passport = require('passport');
const AuthController = require('../controllers/authController');
const { checkRole, redirectIfAuthenticated } = require('../middleware/authMiddleware');

// Auth routes
router.get("/login", redirectIfAuthenticated, AuthController.showLogin);
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error('❌ Login Error:', err);
      return next(err);
    }
    
    if (!user) {
      const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
      console.log(`⚠️  [${timestamp}] Failed login attempt: ${req.body.username} from ${clientIP}`);
      
      // แยกแยะระหว่าง "ไม่พบผู้ใช้" และ "รหัสผ่านไม่ถูกต้อง"
      const errorMessage = info.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      return res.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('❌ Session Error:', err);
        return next(err);
      }
      
      // Log successful login
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
      
      // Log to file if in production
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        const fs = require('fs');
        const logEntry = `[${new Date().toISOString()}] LOGIN - User: ${user.username}, Role: ${user.role || 'user'}, IP: ${req.ip}\n`;
        fs.appendFile('login.log', logEntry, (err) => {
          if (err) console.error('Failed to write to log file:', err);
        });
      }
      
      return res.redirect("/index");
    });
  })(req, res, next);
});

router.get("/register", redirectIfAuthenticated, AuthController.showRegister);
router.post("/register", AuthController.register);

router.get("/logout", (req, res, next) => {
  if (req.user) {
    const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const username = req.user.username;
    const role = req.user.role || 'user';
    
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                  🚪 USER LOGOUT                         ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║ 📅 Time     : ${timestamp}`);
    console.log(`║ 👤 Username : ${username}`);
    console.log(`║ 🎭 Role     : ${role}`);
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    console.log(`👋 [${timestamp}] Logout: ${username} (${role})`);
  }
  
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/login?error=ออกจากระบบเรียบร้อยแล้ว");
  });
});

router.get("/index", checkRole('user'), AuthController.showIndex);

// Profile routes
router.get("/profile", checkRole('user'), AuthController.getUserProfile);
router.post("/profile", checkRole('user'), AuthController.updateProfile);

module.exports = router;