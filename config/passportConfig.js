const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require('./db'); // เชื่อมต่อกับฐานข้อมูล
const bcrypt = require("bcryptjs");

passport.use(
  new LocalStrategy((username, password, done) => {
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, results) => {
      if (err) return done(err);
      if (results.length === 0) {
        return done(null, false, { message: "ไม่พบผู้ใช้" });
      }

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

// การ serialize และ deserialize
passport.serializeUser((user, done) => {
  done(null, user.id); // เก็บ ID ของผู้ใช้ในการเก็บใน session
});

passport.deserializeUser((id, done) => {
  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [id], (err, user) => {
    done(err, user[0]);
  });
});
