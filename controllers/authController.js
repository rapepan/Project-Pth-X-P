const bcrypt = require("bcryptjs");
const db = require("../config/db");

class AuthController {
  // แสดงหน้า login
  static showLogin(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect("/index");
    }
    res.render("login", { 
      title: "เข้าสู่ระบบ",
      message: req.query.message || null,
      error: req.query.error || null
    });
  }

  // Register functions removed - only Admin can create users through /admin/users/create

  // แสดงหน้าหลัก
  static showIndex(req, res) {
    const StatsModel = require('../models/statsModel');
    
    // ดึงข้อมูลสถิติทั้งหมด
    StatsModel.getAllStats((err, stats) => {
      if (err) {
        console.error('Error fetching stats:', err);
        // ถ้าไม่มีข้อมูลสถิติ ให้ส่งข้อมูลว่าง
        stats = {
          totalPatients: 0,
          thisMonthNewPatients: 0,
          todayAppointments: 0,
          thisMonthExaminations: 0,
          thisMonthRevenue: 0,
          totalBilling: 0,
          thisMonthNewPatientsDuplicate: 0,
          monthlyRevenue: []
        };
      }

      res.render("index", {
        title: "ระบบบริหารจัดการคลินิกกายภาพบำบัด",
        user: req.user,
        userRole: req.user.role,
        stats: stats
      });
    });
  }

  // แสดงข้อมูลโปรไฟล์ผู้ใช้
  static getUserProfile(req, res) {
    res.render("profile", {
      title: "โปรไฟล์",
      user: req.user,
      userRole: req.user.role,
      errors: null,
      message: null
    });
  }

  // อัปเดตข้อมูลโปรไฟล์
  static updateProfile(req, res) {
    const { email, fullname, currentPassword, newPassword, confirmNewPassword } = req.body;
    console.log('🔍 ข้อมูลที่ส่งมา:', { email, fullname, newPassword, confirmNewPassword });
    const errors = [];

    // Validation - ยืดหยุ่นขึ้น
    if (email && email.trim() !== '' && !AuthController.isValidEmail(email)) {
      errors.push('กรุณากรอกอีเมลที่ถูกต้อง');
    }

    if (fullname && fullname.trim() === '') {
      errors.push('กรุณากรอกชื่อ-นามสกุล');
    }

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (newPassword && newPassword.length > 0) {
      if (newPassword.length < 8) {
        errors.push('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      }

      // ตรวจสอบความปลอดภัยของรหัสผ่าน
      const passwordValidation = AuthController.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }

      console.log('🔐 ตรวจสอบรหัสผ่าน:', { 
        newPassword, 
        confirmNewPassword, 
        isMatch: newPassword === confirmNewPassword 
      });
      
      if (newPassword !== confirmNewPassword) {
        errors.push('รหัสผ่านใหม่ไม่ตรงกัน');
      }
    }

    if (errors.length > 0) {
      return res.render("profile", {
        title: "โปรไฟล์",
        user: req.user,
        userRole: req.user.role,
        errors: errors,
        message: null
      });
    }

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (newPassword && newPassword.length > 0) {
      // เข้ารหัสรหัสผ่านใหม่
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.render("profile", {
            title: "โปรไฟล์",
            user: req.user,
            userRole: req.user.role,
            errors: ['เกิดข้อผิดพลาดในระบบ'],
            message: null
          });
        }

        // อัปเดตข้อมูล - ใช้ข้อมูลเดิมหากไม่ได้กรอกใหม่
        const finalEmail = email && email.trim() !== '' ? email : req.user.email;
        const finalFullname = fullname && fullname.trim() !== '' ? fullname : req.user.fullname;
        
        const updateQuery = "UPDATE users SET email = ?, fullname = ?, password = ? WHERE id = ?";
        db.query(updateQuery, [finalEmail, finalFullname, hashedPassword, req.user.id], (err, result) => {
          if (err) {
            console.error('Error updating profile:', err);
            return res.render("profile", {
              title: "โปรไฟล์",
              user: req.user,
              userRole: req.user.role,
              errors: ['เกิดข้อผิดพลาดในระบบ'],
              message: null
            });
          }

          res.render("profile", {
            title: "โปรไฟล์",
            user: { ...req.user, email: finalEmail, fullname: finalFullname },
            userRole: req.user.role,
            errors: null,
            message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว'
          });
        });
      });
    } else {
      // ไม่เปลี่ยนรหัสผ่าน - ใช้ข้อมูลเดิมหากไม่ได้กรอกใหม่
      const finalEmail = email && email.trim() !== '' ? email : req.user.email;
      const finalFullname = fullname && fullname.trim() !== '' ? fullname : req.user.fullname;
      
      const updateQuery = "UPDATE users SET email = ?, fullname = ? WHERE id = ?";
      db.query(updateQuery, [finalEmail, finalFullname, req.user.id], (err, result) => {
        if (err) {
          console.error('Error updating profile:', err);
          return res.render("profile", {
            title: "โปรไฟล์",
            user: req.user,
            userRole: req.user.role,
            errors: ['เกิดข้อผิดพลาดในระบบ'],
            message: null
          });
        }

        res.render("profile", {
          title: "โปรไฟล์",
          user: { ...req.user, email: finalEmail, fullname: finalFullname },
          userRole: req.user.role,
          errors: null,
          message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว'
        });
      });
    }
  }

  // ออกจากระบบ
  static logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/login?message=ออกจากระบบเรียบร้อยแล้ว");
    });
  }

  // ตรวจสอบ email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ตรวจสอบความปลอดภัยของรหัสผ่าน
  static validatePassword(password) {
    const errors = [];

    // ตรวจสอบความยาวขั้นต่ำ
    if (password.length < 8) {
      errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
    }

    // ตรวจสอบความยาวสูงสุด (ป้องกันการโจมตี)
    if (password.length > 128) {
      errors.push('รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร');
    }

    // ตรวจสอบตัวพิมพ์เล็ก
    if (!/[a-z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว');
    }

    // ตรวจสอบตัวพิมพ์ใหญ่
    if (!/[A-Z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว');
    }

    // ตรวจสอบตัวเลข
    if (!/[0-9]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว');
    }

    // ตรวจสอบอักขระพิเศษ
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push('รหัสผ่านต้องมีอักขระพิเศษ (!@#$%^&* ฯลฯ) อย่างน้อย 1 ตัว');
    }

    // ตรวจสอบว่ามีอักขระที่ไม่ได้รับอนุญาต
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+$/.test(password)) {
      errors.push('รหัสผ่านมีอักขระที่ไม่ได้รับอนุญาต');
    }

    // ตรวจสอบรหัสผ่านที่อ่อนแอ (common passwords)
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'root', 'user', 'test', 'guest', 'welcome', 'login',
      'letmein', 'master', 'secret', 'pass', '1234', '12345', '123456789',
      'password1', '1234567890', 'qwerty123', 'admin123', 'root123',
      '123456789', '987654321', '111111', '000000', '123123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('รหัสผ่านนี้ไม่ปลอดภัย กรุณาใช้รหัสผ่านที่ซับซ้อนกว่า');
    }

    // ตรวจสอบลำดับตัวอักษรที่ง่ายเดา
    const sequentialPatterns = [
      'abcdef', 'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321',
      'abcdefg', 'qwertyu', 'asdfghj', 'zxcvbnm', '1234567890',
      '0987654321', 'abcdefgh', 'qwertyui', 'asdfghjk'
    ];
    
    for (const pattern of sequentialPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errors.push('รหัสผ่านไม่ควรมีลำดับตัวอักษรที่ง่ายเดา');
        break;
      }
    }

    // ตรวจสอบการซ้ำของตัวอักษร
    if (/(.)\1{2,}/.test(password)) {
      errors.push('รหัสผ่านไม่ควรมีตัวอักษรซ้ำติดกันมากกว่า 2 ตัว');
    }

    // ตรวจสอบตัวเลขเรียงกัน
    if (/0123456789|9876543210|1234567890|0987654321/.test(password)) {
      errors.push('รหัสผ่านไม่ควรมีตัวเลขเรียงกัน');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = AuthController;