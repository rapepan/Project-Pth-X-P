const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const { checkRole } = require('../middleware/authMiddleware');

// Patient routes
router.get("/", checkRole("user"), PatientController.searchPage);
router.get("/add", checkRole("user"), PatientController.showAddForm);
router.post("/add", checkRole("user"), PatientController.addPatient);
router.get("/:HN", checkRole("user"), PatientController.viewPatient);
module.exports = router;  