const express = require('express');
const router = express.Router();
const ExaminationController = require('../controllers/examinationController');
const { checkRole, checkStaff, checkNotStaff } = require('../middleware/authMiddleware');

// ==================== Examination Management Routes ====================

// แสดงหน้าห้องตรวจ - Staff เข้าถึงได้
router.get("/examinationroom/:HN?", checkStaff, ExaminationController.showExaminationRoom);

// แสดงหน้าระบบตรวจร่างกายผู้ป่วย - Staff เข้าถึงไม่ได้
router.get("/patientexamination/:HN", checkNotStaff, ExaminationController.showPatientExamination);

// บันทึกการตรวจร่างกายผู้ป่วย - Staff เข้าถึงไม่ได้
router.post("/patientexamination/:HN", checkNotStaff, ExaminationController.savePatientExamination);

// บันทึกการตรวจ - Staff เข้าถึงไม่ได้
router.post("/examinationroom/:HN", checkNotStaff, ExaminationController.saveExamination);

// แสดงประวัติการตรวจ - Staff เข้าถึงไม่ได้
router.get("/examinationHistory/:HN", checkNotStaff, ExaminationController.showExaminationHistory);

// แสดงรายละเอียดการตรวจ - Staff เข้าถึงไม่ได้
router.get("/examinationDetail/:HN/:examId", checkNotStaff, ExaminationController.showExaminationDetail);

// แสดงหน้าการพิมพ์รายงานการตรวจ - Staff เข้าถึงไม่ได้
router.get("/examinationPrint/:examId", checkNotStaff, ExaminationController.showExaminationPrint);

// แสดงการตรวจล่าสุด (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/latest/:HN", checkNotStaff, ExaminationController.getLatestExamination);

// แสดงการตรวจตามวันที่ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/bydate", checkNotStaff, ExaminationController.getExaminationsByDate);

// แสดงวันที่ที่มีการตรวจ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/dates/:HN", checkNotStaff, ExaminationController.getExaminationDates);

// ค้นหาการตรวจ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/search", checkNotStaff, ExaminationController.searchExaminations);

// สถิติการตรวจ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/statistics/:HN", checkNotStaff, ExaminationController.getExaminationStatistics);

// อัปเดตการตรวจ (ใช้ form submit) - Physical Therapist หรือ Admin เท่านั้น
router.post("/examination/:examId/update", checkRole('physical_therapist'), ExaminationController.updateExamination);

// ลบการตรวจ (ใช้ form submit) - Admin เท่านั้น
router.post("/examination/:examId/delete", checkRole('admin'), ExaminationController.deleteExamination);

// เปรียบเทียบการตรวจ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/compare", checkNotStaff, ExaminationController.compareExaminations);

// สรุปการตรวจรายเดือน (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/summary/monthly", checkNotStaff, ExaminationController.getMonthlySummary);

// สรุปการตรวจรายปี (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/summary/yearly/:year", checkNotStaff, ExaminationController.getYearlySummary);

// ตรวจสอบความถูกต้อง (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/validate", checkNotStaff, ExaminationController.validateExamination);

// แสดงเทมเพลตการตรวจ - Staff เข้าถึงไม่ได้
router.get("/examinationTemplates", checkNotStaff, ExaminationController.showExaminationTemplates);

// บันทึกเทมเพลตการตรวจ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examinationTemplates", checkNotStaff, ExaminationController.saveExaminationTemplate);

// ติดตามความก้าวหน้า (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/examination/progress/:HN", checkNotStaff, ExaminationController.getProgressTracking);

module.exports = router;