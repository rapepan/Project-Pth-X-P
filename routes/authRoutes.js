const express = require("express");
const passport = require("passport");
const router = express.Router();

// หน้าเข้าสู่ระบบ
router.get("/login", (req, res) => {
  res.render("login");
});

// รับข้อมูลจากฟอร์มเข้าสู่ระบบ
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/index",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// ออกจากระบบ
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
});

module.exports = router;
