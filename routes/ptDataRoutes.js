const express = require('express');
const router = express.Router();
const PTDataController = require('../controllers/ptDataController');
const { checkRole, checkStaff, checkNotStaff } = require('../middleware/authMiddleware');

// ==================== PT Data Management Routes ====================

// แสดงหน้า PT Data - Staff เข้าถึงไม่ได้
router.get("/ptData/:HN?", checkNotStaff, PTDataController.showPTDataPage);

// บันทึก PT Data - Staff เข้าถึงไม่ได้
router.post("/ptData/:HN", checkNotStaff, PTDataController.savePTData);

// แสดงประวัติ PT Data - Staff เข้าถึงไม่ได้
router.get("/ptDataHistory/:HN", checkNotStaff, PTDataController.showPTDataHistory);

// แสดงรายละเอียด PT Data - Staff เข้าถึงไม่ได้
router.get("/ptDataDetail/:HN/:dataId", checkNotStaff, PTDataController.showPTDataDetail);

// อัปเดต PT Data (ใช้ form submit)
router.post("/ptData/:HN/:dataId/update", checkRole(['admin', 'physical_therapist']), PTDataController.updatePTData);

// ลบ PT Data (ใช้ form submit)
router.post("/ptData/:HN/:dataId/delete", checkRole('admin'), PTDataController.deletePTData);

module.exports = router;