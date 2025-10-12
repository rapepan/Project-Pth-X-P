const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const { checkRole } = require('../middleware/authMiddleware');

// ==================== Billing Management Routes ====================

// แสดงหน้าจัดการค่าใช้จ่าย
router.get("/billing/:HN?", checkRole('user'), BillingController.showBillingPage);

// สร้างใบเสร็จใหม่
router.post("/billing/:HN", checkRole('user'), BillingController.createBill);

// แสดงรายละเอียดใบเสร็จ
router.get("/billingDetail/:billId", checkRole('user'), BillingController.showBillDetail);

// อัปเดตสถานะการชำระเงิน (ใช้ form submit)
router.post("/billing/:billId/status", checkRole(['admin', 'user']), BillingController.updatePaymentStatus);

// ยกเลิกใบเสร็จ (ใช้ form submit)
router.post("/billing/:billId/cancel", checkRole('admin'), BillingController.cancelBill);

// แสดงรายการราคา
router.get("/billingPricelist", checkRole('user'), BillingController.showPriceList);

// อัปเดตราคาบริการ (ใช้ form submit)
router.post("/billingPricelist/:serviceId/update", checkRole('admin'), BillingController.updateServicePrice);

// เพิ่มบริการใหม่ (ใช้ form submit)
router.post("/billingPricelist/add", checkRole('admin'), BillingController.addNewService);

// คำนวณส่วนลด (ใช้ form submit)
router.post("/billing/discount", checkRole('user'), BillingController.calculateDiscount);

// ตรวจสอบประกัน (ใช้ form submit)
router.post("/billing/insurance/:HN", checkRole('user'), BillingController.checkInsurance);

// ยื่นเคลมประกัน (ใช้ form submit)
router.post("/billing/claim", checkRole('user'), BillingController.submitInsuranceClaim);

// รายงานรายวัน
router.get("/billingReport/daily", checkRole(['admin', 'user']), BillingController.getDailyReport);

// รายงานรายเดือน
router.get("/billingReport/monthly", checkRole(['admin', 'user']), BillingController.getMonthlyReport);

// รายงานรายปี
router.get("/billingReport/yearly/:year", checkRole(['admin', 'user']), BillingController.getYearlyReport);

// รายงานลูกหนี้
router.get("/billingReport/outstanding", checkRole(['admin', 'user']), BillingController.getOutstandingReport);

// ดาวน์โหลดใบแจ้งหนี้
router.get("/billing/:billId/download/invoice", checkRole('user'), BillingController.downloadInvoice);

// ดาวน์โหลดใบเสร็จ
router.get("/billing/:billId/download/receipt", checkRole('user'), BillingController.downloadReceipt);

module.exports = router;