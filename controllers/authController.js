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
      message: req.query.message || null 
    });
  }

  // แสดงหน้า register
  static showRegister(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect("/index");
    }
    res.render("register", { 
      title: "สมัครสมาชิก",
      message: null,
      errors: []
    });
  }

  // สมัครสมาชิก
  static register(req, res) {
    const { username, password, confirmPassword, email, fullname } = req.body;
    const errors = [];

    // Validation
    if (!username || username.trim() === '') {
      errors.push('กรุณากรอกชื่อผู้ใช้');
    }

    if (!password || password.length < 6) {
      errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    if (password !== confirmPassword) {
      errors.push('รหัสผ่านไม่ตรงกัน');
    }

    if (!email || !AuthController.isValidEmail(email)) {
      errors.push('กรุณากรอกอีเมลที่ถูกต้อง');
    }

    if (!fullname || fullname.trim() === '') {
      errors.push('กรุณากรอกชื่อ-นามสกุล');
    }

    if (errors.length > 0) {
      return res.render("register", {
        title: "สมัครสมาชิก",
        message: null,
        errors,
        formData: req.body
      });
    }

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const checkUserQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    db.query(checkUserQuery, [username, email], (err, results) => {
      if (err) {
        console.error("Error checking user:", err);
        return res.render("register", {
          title: "สมัครสมาชิก",
          message: "เกิดข้อผิดพลาดในระบบ",
          errors: [],
          formData: req.body
        });
      }

      if (results.length > 0) {
        const existingUser = results[0];
        let errorMessage = '';
        if (existingUser.username === username) {
          errorMessage = 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว';
        } else if (existingUser.email === email) {
          errorMessage = 'อีเมลนี้มีอยู่ในระบบแล้ว';
        }

        return res.render("register", {
          title: "สมัครสมาชิก",
          message: errorMessage,
          errors: [],
          formData: req.body
        });
      }

      // Hash password และบันทึกผู้ใช้ใหม่
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing password:", err);
          return res.render("register", {
            title: "สมัครสมาชิก",
            message: "เกิดข้อผิดพลาดในการสร้างรหัสผ่าน",
            errors: [],
            formData: req.body
          });
        }

        const insertUserQuery = `
          INSERT INTO users (username, password, email, fullname, role, created_at) 
          VALUES (?, ?, ?, ?, 'user', NOW())
        `;
        
        db.query(insertUserQuery, [username, hashedPassword, email, fullname], (err, result) => {
          if (err) {
            console.error("Error inserting user:", err);
            return res.render("register", {
              title: "สมัครสมาชิก",
              message: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
              errors: [],
              formData: req.body
            });
          }

          res.redirect("/login?message=สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ");
        });
      });
    });
  }

  // logout
  static logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/login?message=ออกจากระบบเรียบร้อยแล้ว");
    });
  }

  // แสดงหน้าหลัก
  static showIndex(req, res) {
    res.render("index", { 
      title: "PTN-X-P",
      user: req.user 
    });
  }

  // Helper function to validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get user profile
  static getUserProfile(req, res) {
    res.render("profile", {
      title: "ข้อมูลส่วนตัว",
      user: req.user
    });
  }

  // Update user profile
  static updateProfile(req, res) {
    const { email, fullname, currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;
    const errors = [];

    // Validation
    if (!email || !AuthController.isValidEmail(email)) {
      errors.push('กรุณากรอกอีเมลที่ถูกต้อง');
    }

    if (!fullname || fullname.trim() === '') {
      errors.push('กรุณากรอกชื่อ-นามสกุล');
    }

    // ถ้าต้องการเปลี่ยนรหัสผ่าน
    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        errors.push('กรุณากรอกรหัสผ่านปัจจุบัน');
      }

      if (!newPassword || newPassword.length < 6) {
        errors.push('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      }

      if (newPassword !== confirmNewPassword) {
        errors.push('รหัสผ่านใหม่ไม่ตรงกัน');
      }
    }

    if (errors.length > 0) {
      return res.render("profile", {
        title: "ข้อมูลส่วนตัว",
        user: req.user,
        errors,
        formData: req.body
      });
    }

    // ตรวจสอบอีเมลซ้ำ (ยกเว้นของตัวเอง)
    const checkEmailQuery = "SELECT * FROM users WHERE email = ? AND id != ?";
    db.query(checkEmailQuery, [email, userId], (err, results) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.render("profile", {
          title: "ข้อมูลส่วนตัว",
          user: req.user,
          errors: ['เกิดข้อผิดพลาดในระบบ'],
          formData: req.body
        });
      }

      if (results.length > 0) {
        return res.render("profile", {
          title: "ข้อมูลส่วนตัว",
          user: req.user,
          errors: ['อีเมลนี้มีอยู่ในระบบแล้ว'],
          formData: req.body
        });
      }

      // ถ้าต้องการเปลี่ยนรหัสผ่าน ตรวจสอบรหัสผ่านเก่า
      if (currentPassword) {
        bcrypt.compare(currentPassword, req.user.password, (err, isMatch) => {
          if (err) {
            console.error("Error comparing password:", err);
            return res.render("profile", {
              title: "ข้อมูลส่วนตัว",
              user: req.user,
              errors: ['เกิดข้อผิดพลาดในระบบ'],
              formData: req.body
            });
          }

          if (!isMatch) {
            return res.render("profile", {
              title: "ข้อมูลส่วนตัว",
              user: req.user,
              errors: ['รหัสผ่านปัจจุบันไม่ถูกต้อง'],
              formData: req.body
            });
          }

          // Hash รหัสผ่านใหม่และอัพเดท
          bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
              console.error("Error hashing password:", err);
              return res.render("profile", {
                title: "ข้อมูลส่วนตัว",
                user: req.user,
                errors: ['เกิดข้อผิดพลาดในการสร้างรหัสผ่าน'],
                formData: req.body
              });
            }

            const updateQuery = "UPDATE users SET email = ?, fullname = ?, password = ? WHERE id = ?";
            db.query(updateQuery, [email, fullname, hashedPassword, userId], (err, result) => {
              if (err) {
                console.error("Error updating user:", err);
                return res.render("profile", {
                  title: "ข้อมูลส่วนตัว",
                  user: req.user,
                  errors: ['เกิดข้อผิดพลาดในการอัพเดทข้อมูล'],
                  formData: req.body
                });
              }

              res.redirect("/profile?success=update");
            });
          });
        });
      } else {
        // อัพเดทเฉพาะอีเมลและชื่อ
        const updateQuery = "UPDATE users SET email = ?, fullname = ? WHERE id = ?";
        db.query(updateQuery, [email, fullname, userId], (err, result) => {
          if (err) {
            console.error("Error updating user:", err);
            return res.render("profile", {
              title: "ข้อมูลส่วนตัว",
              user: req.user,
              errors: ['เกิดข้อผิดพลาดในการอัพเดทข้อมูล'],
              formData: req.body
            });
          }

          res.redirect("/profile?success=update");
        });
      }
    });
  }
}

module.exports = AuthController;