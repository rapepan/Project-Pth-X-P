const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route สำหรับแสดงฟอร์มลงทะเบียน
router.get("/register", (req, res) => {
  res.render("register", { message: null });
});

// Route สำหรับเพิ่มผู้ใช้ใหม่
router.post("/register", userController.addUser);  // ฟังก์ชัน addUser ต้องได้รับการกำหนดใน userController.js

// Route สำหรับการเข้าสู่ระบบ
router.post("/login", userController.loginUser); // ฟังก์ชัน loginUser ต้องได้รับการกำหนดใน userController.js

module.exports = router;
