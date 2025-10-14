const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const { checkStaff} = require('../middleware/authMiddleware');

// Patient routes
router.get("/", checkStaff, PatientController.searchPage);           // ✅ ใช้งานได้
router.get("/add", checkStaff, PatientController.showAddForm);      // ✅ ใช้งานได้
router.post("/add", checkStaff, PatientController.addPatient);      // ✅ ใช้งานได้
router.get("/search", checkStaff, PatientController.searchPatientByHN); // ✅ ใช้งานได้
router.get("/:HN", checkStaff, PatientController.viewPatient);      // ✅ ใช้งานได้
module.exports = router;  