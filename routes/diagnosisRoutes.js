const express = require('express');
const router = express.Router();
const DiagnosisController = require('../controllers/diagnosisController');
const { checkRole, checkStaff, checkNotStaff } = require('../middleware/authMiddleware');

// ==================== Diagnosis Management Routes ====================

// แสดงหน้าการวินิจฉัย - Staff เข้าถึงไม่ได้
router.get("/diagnosis/:HN?", checkNotStaff, DiagnosisController.showDiagnosisPage);

// บันทึกการวินิจฉัย - Staff เข้าถึงไม่ได้
router.post("/diagnosis/:HN", checkNotStaff, DiagnosisController.saveDiagnosis);

// แสดงประวัติการวินิจฉัย - Staff เข้าถึงไม่ได้
router.get("/diagnosisHistory/:HN", checkNotStaff, DiagnosisController.showDiagnosisHistory);

// แสดงรายละเอียดการวินิจฉัย - Staff เข้าถึงไม่ได้
router.get("/diagnosisDetail/:HN/:diagnosisId", checkNotStaff, DiagnosisController.showDiagnosisDetail);

// อัปเดตการวินิจฉัย (ใช้ form submit)
router.post("/diagnosis/:HN/:diagnosisId/update", checkRole('physical_therapist'), DiagnosisController.updateDiagnosis);

// ลบการวินิจฉัย (ใช้ form submit)
router.post("/diagnosis/:HN/:diagnosisId/delete", checkRole('admin'), DiagnosisController.deleteDiagnosis);

module.exports = router;