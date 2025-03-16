const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ฟังก์ชันสำหรับการจัดการการเข้าสู่ระบบ
const loginUser = (req, res, next) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, result) => {
    if (err) {
      return next(err);
    }
    if (!result.length) {
      return res.redirect("/login"); // ถ้าไม่พบผู้ใช้
    }

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return next(err);
      }
      if (isMatch) {
        req.login(user, (err) => {
          if (err) return next(err);
          res.redirect("/index"); // ถ้าการเข้าสู่ระบบสำเร็จ
        });
      } else {
        return res.redirect("/login"); // ถ้ารหัสผ่านไม่ตรง
      }
    });
  });
};

// ฟังก์ชันสำหรับการสมัครสมาชิก
const registerUser = (req, res, next) => {
  const { username, password } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return next(err);
    }

    const query = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        return next(err);
      }
      res.redirect("/login"); // สมัครสมาชิกเสร็จแล้วให้ไปหน้าเข้าสู่ระบบ
    });
  });
};

module.exports = {
  loginUser,
  registerUser,
};
