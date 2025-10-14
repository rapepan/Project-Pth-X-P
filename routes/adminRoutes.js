const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { checkRole } = require('../middleware/authMiddleware');

// ใช้ middleware ตรวจสอบว่าเป็น Admin เท่านั้น
router.use(checkRole('admin'));

// ==================== User Management Routes ====================

// แสดงหน้ารายการผู้ใช้
router.get('/users', AdminController.showUsers);

// แสดงหน้าสร้างผู้ใช้ใหม่
router.get('/users/create', AdminController.showCreateUser);

// สร้างผู้ใช้ใหม่
router.post('/users/create', AdminController.createUser);

// แสดงหน้าแก้ไขผู้ใช้
router.get('/users/:id/edit', AdminController.showEditUser);

// อัปเดตข้อมูลผู้ใช้
router.post('/users/:id/edit', AdminController.updateUser);

// ลบผู้ใช้
router.post('/users/:id/delete', AdminController.deleteUser);

// ==================== Reports and Statistics Routes ====================

// แสดงหน้ารายงานและสถิติ
router.get('/reports', AdminController.showReports);

// สร้างรายงานผู้ป่วย
router.get('/reports/patients', AdminController.generatePatientReport);

// สร้างรายงานนัดหมาย
router.get('/reports/appointments', AdminController.generateAppointmentReport);

// สร้างรายงานการเงิน
router.get('/reports/financial', AdminController.generateFinancialReport);

// สร้างรายงานผู้ใช้งาน
router.get('/reports/users', AdminController.generateUserReport);

module.exports = router;
