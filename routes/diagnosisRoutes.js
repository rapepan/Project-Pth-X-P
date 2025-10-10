const express = require('express');
const router = express.Router();
const DiagnosisController = require('../controllers/diagnosisController');
const { checkRole } = require('../middleware/authMiddleware');

// ==================== Diagnosis Management Routes ====================

// แสดงหน้าการวินิจฉัย
router.get("/diagnosis/:HN?", checkRole('user'), DiagnosisController.showDiagnosisPage);

// บันทึกการวินิจฉัย
router.post("/diagnosis/:HN", checkRole('user'), DiagnosisController.saveDiagnosis);

// แสดงประวัติการวินิจฉัย
router.get("/diagnosisHistory/:HN", checkRole('user'), DiagnosisController.showDiagnosisHistory);

// แสดงรายละเอียดการวินิจฉัย
router.get("/diagnosisDetail/:HN/:diagnosisId", checkRole('user'), DiagnosisController.showDiagnosisDetail);

// อัปเดตการวินิจฉัย (ใช้ form submit)
router.post("/diagnosis/:HN/:diagnosisId/update", checkRole(['admin', 'doctor']), DiagnosisController.updateDiagnosis);

// ลบการวินิจฉัย (ใช้ form submit)
router.post("/diagnosis/:HN/:diagnosisId/delete", checkRole('admin'), DiagnosisController.deleteDiagnosis);

module.exports = router;