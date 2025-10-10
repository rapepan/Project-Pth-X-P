const express = require('express');
const router = express.Router();
const ExaminationController = require('../controllers/examinationController');
const { checkRole } = require('../middleware/authMiddleware');

// ==================== Examination Management Routes ====================

// แสดงหน้าห้องตรวจ
router.get("/examinationroom/:HN?", checkRole('user'), ExaminationController.showExaminationRoom);

// แสดงหน้าระบบตรวจร่างกายผู้ป่วย
router.get("/patientexamination/:HN", checkRole('user'), ExaminationController.showPatientExamination);

// บันทึกการตรวจร่างกายผู้ป่วย
router.post("/patientexamination/:HN", checkRole('user'), ExaminationController.savePatientExamination);

// บันทึกการตรวจ
router.post("/examinationroom/:HN", checkRole('user'), ExaminationController.saveExamination);

// แสดงประวัติการตรวจ
router.get("/examinationHistory/:HN", checkRole('user'), ExaminationController.showExaminationHistory);

// แสดงรายละเอียดการตรวจ
router.get("/examinationDetail/:HN/:examId", checkRole('user'), ExaminationController.showExaminationDetail);

// แสดงหน้าการพิมพ์รายงานการตรวจ
router.get("/examinationPrint/:examId", checkRole('user'), ExaminationController.showExaminationPrint);

// แสดงการตรวจล่าสุด (ใช้ form submit)
router.post("/examination/latest/:HN", checkRole('user'), ExaminationController.getLatestExamination);

// แสดงการตรวจตามวันที่ (ใช้ form submit)
router.post("/examination/bydate", checkRole('user'), ExaminationController.getExaminationsByDate);

// แสดงวันที่ที่มีการตรวจ (ใช้ form submit)
router.post("/examination/dates/:HN", checkRole('user'), ExaminationController.getExaminationDates);

// ค้นหาการตรวจ (ใช้ form submit)
router.post("/examination/search", checkRole('user'), ExaminationController.searchExaminations);

// สถิติการตรวจ (ใช้ form submit)
router.post("/examination/statistics/:HN", checkRole('user'), ExaminationController.getExaminationStatistics);

// อัปเดตการตรวจ (ใช้ form submit)
router.post("/examination/:examId/update", checkRole(['admin', 'doctor']), ExaminationController.updateExamination);

// ลบการตรวจ (ใช้ form submit)
router.post("/examination/:examId/delete", checkRole('admin'), ExaminationController.deleteExamination);

// เปรียบเทียบการตรวจ (ใช้ form submit)
router.post("/examination/compare", checkRole('user'), ExaminationController.compareExaminations);

// สรุปการตรวจรายเดือน (ใช้ form submit)
router.post("/examination/summary/monthly", checkRole('user'), ExaminationController.getMonthlySummary);

// สรุปการตรวจรายปี (ใช้ form submit)
router.post("/examination/summary/yearly/:year", checkRole('user'), ExaminationController.getYearlySummary);

// ตรวจสอบความถูกต้อง (ใช้ form submit)
router.post("/examination/validate", checkRole('user'), ExaminationController.validateExamination);

// แสดงเทมเพลตการตรวจ
router.get("/examinationTemplates", checkRole('user'), ExaminationController.showExaminationTemplates);

// บันทึกเทมเพลตการตรวจ (ใช้ form submit)
router.post("/examinationTemplates", checkRole('user'), ExaminationController.saveExaminationTemplate);

// ติดตามความก้าวหน้า (ใช้ form submit)
router.post("/examination/progress/:HN", checkRole('user'), ExaminationController.getProgressTracking);

module.exports = router;