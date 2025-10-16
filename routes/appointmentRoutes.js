const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');

// แสดงหน้ารายการนัดหมาย
router.get('/', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.showAppointments);

// แสดงหน้าสร้างนัดหมาย
router.get('/create', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.showCreateAppointment);

// สร้างนัดหมายใหม่
router.post('/create', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.createAppointment);

// แสดงหน้าแก้ไขนัดหมาย
router.get('/:id/edit', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.showEditAppointment);

// อัปเดตข้อมูลนัดหมาย
router.post('/:id/edit', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.updateAppointment);

// แสดงหน้ารายละเอียดนัดหมาย
router.get('/:id', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.showAppointmentDetail);

// อัปเดตสถานะนัดหมาย (API)
router.post('/:id/status', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.updateAppointmentStatus);

// ลบนัดหมาย
router.delete('/:id', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.deleteAppointment);

// สร้างใบนัดหมาย (PDF)
router.get('/:id/card', isAuthenticated, checkRole(['admin', 'staff', 'physical_therapist']), AppointmentController.generateAppointmentCard);

module.exports = router;

