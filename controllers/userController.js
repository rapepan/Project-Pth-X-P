const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ฟังก์ชันเพิ่มผู้ใช้ใหม่
const addUser = (req, res) => {
  const { username, password, role } = req.body;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send("Error in hashing password");

    const query =
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    db.query(query, [username, hashedPassword, role], (err, result) => {
      if (err) return res.status(500).send("Error adding user");
      res.redirect("/login");
    });
  });
};

// ฟังก์ชันล็อกอิน
const loginUser = (req, res, next) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) return next(err);
    if (results.length === 0) return res.status(401).send("User not found");

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return next(err);
      if (isMatch) {
        req.login(user, (err) => {
          if (err) return next(err);
          return res.redirect("/dashboard"); // ส่งผู้ใช้ไปหน้า dashboard
        });
      } else {
        return res.status(401).send("Incorrect password");
      }
    });
  });
};

module.exports = { addUser, loginUser };
