const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');

// Middleware for role checking
function checkRole(role) {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  };
}

// Patient routes
router.get("/", checkRole("user"), PatientController.searchPage);
router.get("/add", checkRole("user"), PatientController.showAddForm);
router.post("/add", checkRole("user"), PatientController.addPatient);
router.get("/:HN", checkRole("user"), PatientController.viewPatient);
router.get("/:HN/edit", checkRole("user"), PatientController.showEditForm);
router.put("/:HN", checkRole("user"), PatientController.updatePatient);
router.delete("/:HN", checkRole("user"), PatientController.deletePatient);

module.exports = router;