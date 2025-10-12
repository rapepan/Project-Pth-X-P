const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// ใช้ middleware สำหรับตรวจสอบการล็อกอิน
router.use(isAuthenticated);

// แสดงหน้า billing สำหรับผู้ป่วย
router.get('/:HN', BillingController.showBillingPage);

// สร้างใบเสร็จใหม่
router.post('/:HN', BillingController.createBill);

// แสดงรายละเอียดใบเสร็จ
router.get('/detail/:billId', BillingController.showBillDetail);

// อัปเดตสถานะการชำระเงิน
router.post('/payment/:billId', BillingController.updatePaymentStatus);

// แสดงประวัติใบเสร็จของผู้ป่วย
router.get('/history/:HN', BillingController.getPatientBills);

module.exports = router;
