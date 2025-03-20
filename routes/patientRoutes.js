const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController"); // เชื่อมกับ patientController

// หน้าแสดงข้อมูลผู้ป่วย
router.get("/patients", checkRole("user"), patientController.showPatients);

// หน้าแสดงฟอร์มสำหรับเพิ่มข้อมูลผู้ป่วยใหม่
router.get("/patients/add", checkRole('user'), (req, res) => {
  res.render("patientForm");
});

router.post("/patients/add", checkRole('user'), patientController.addPatient);

module.exports = router;
