const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

// Route สำหรับดึงข้อมูลผู้ป่วย
router.get("/", patientController.getPatients);

// Route สำหรับเพิ่มข้อมูลผู้ป่วย
router.get("/add", (req, res) => {
  res.render("add", { title: "เพิ่มข้อมูลผู้ป่วย" });
});

router.post("/add", patientController.addPatient);

module.exports = router;
