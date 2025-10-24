const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const { checkStaff} = require('../middleware/authMiddleware');

// Patient routes
router.get("/", checkStaff, PatientController.searchPage);           
router.get("/add", checkStaff, PatientController.showAddForm);     
router.post("/add", checkStaff, PatientController.addPatient);      
router.get("/search", checkStaff, PatientController.searchPatientByHN); 
router.get("/:HN", checkStaff, PatientController.viewPatient);      
module.exports = router;  