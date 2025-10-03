const express = require('express');
const router = express.Router();
const passport = require('passport');
const AuthController = require('../controllers/authController');
const { checkRole, redirectIfAuthenticated } = require('../middleware/authMiddleware');

// Auth routes
router.get("/login", redirectIfAuthenticated, AuthController.showLogin);
router.post("/login", 
  passport.authenticate("local", {
    successRedirect: "/index",  
    failureRedirect: "/login?message=รหัสผ่านไม่ถูกต้อง",
    failureFlash: false
  })
);

router.get("/register", redirectIfAuthenticated, AuthController.showRegister);
router.post("/register", AuthController.register);

router.get("/logout", AuthController.logout);

router.get("/index", checkRole('user'), AuthController.showIndex);

// Profile routes
router.get("/profile", checkRole('user'), AuthController.getUserProfile);
router.post("/profile", checkRole('user'), AuthController.updateProfile);

module.exports = router;