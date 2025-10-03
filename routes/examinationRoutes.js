const express = require('express');
const router = express.Router();
const ExaminationController = require('../controllers/examinationController');
const { checkRole } = require('../middleware/authMiddleware');

// ==================== Main Examination Routes ====================

// แสดงฟอร์มตรวจร่างกาย
router.get("/patientexamination/:HN?", checkRole('user'), ExaminationController.showPatientExamination);

// บันทึกข้อมูลการตรวจร่างกาย
router.post("/patientexamination/:HN", checkRole('user'), ExaminationController.savePatientExamination);

// ==================== History Routes ====================

// แสดงประวัติการตรวจร่างกายทั้งหมดของผู้ป่วย
router.get("/examinationHistory/:HN", checkRole('user'), ExaminationController.showExaminationHistory);

// แสดงรายละเอียดการตรวจร่างกายแต่ละครั้ง
router.get("/examinationDetail/:HN/:examId", checkRole('user'), ExaminationController.showExaminationDetail);

// ==================== Print/Export Routes ====================

// พิมพ์รายงานการตรวจร่างกาย
router.get("/examinationPrint/:examId", checkRole('user'), ExaminationController.printExaminationReport);

// หมายเหตุ: ตัด endpoints API ที่ model ยังไม่รองรับออก เพื่อหลีกเลี่ยง 500

// ==================== Error Handling Middleware ====================

// Handle 404 for undefined routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "ไม่พบ endpoint ที่ร้องขอ"
  });
});

// Global error handler for this router
router.use((err, req, res, next) => {
  console.error("Examination Routes Error:", err.stack);
  
  res.status(500).json({
    success: false,
    message: "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;