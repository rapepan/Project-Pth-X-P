const express = require('express');
const router = express.Router();
const MedicalController = require('../controllers/medicalController');

// Middleware for role checking
function checkRole(role) {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  };
}

// Examination room routes
router.get("/examinationroom/:HN?", checkRole("user"), MedicalController.showExaminationRoom);

// Medical form routes
router.get("/medicalFrom/:HN?", checkRole("user"), MedicalController.showMedicalForm);
router.post("/medicalFrom/:HN", checkRole("user"), MedicalController.saveMedicalForm);

// Medical history routes
router.get("/medicalHistory/:HN", checkRole("user"), MedicalController.showMedicalHistory);
router.get("/medicaHistorydate", checkRole("user"), MedicalController.showMedicalHistoryByDate);

module.exports = router;