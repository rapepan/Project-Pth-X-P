const express = require('express');
const router = express.Router();
const MedicalController = require('../controllers/medicalController');
const { checkRole, checkStaff, checkNotStaff } = require('../middleware/authMiddleware');

// Examination room routes - Staff เข้าถึงได้
router.get("/examinationroom/:HN?", checkStaff, MedicalController.showExaminationRoom);

// Medical form routes - Staff เข้าถึงได้
router.get("/medicalFrom/:HN?", checkStaff, MedicalController.showMedicalForm);
router.post("/medicalFrom/:HN", checkStaff, MedicalController.saveMedicalForm);

// Medical history routes - Staff เข้าถึงได้
router.get("/medicalHistory/:HN", checkStaff, MedicalController.showMedicalHistory);
router.get("/medicaHistorydate", checkStaff, MedicalController.showMedicalHistoryByDate);
router.get("/medicaHistorydate/:HN", checkStaff, MedicalController.showMedicalHistoryByDate);

module.exports = router;  