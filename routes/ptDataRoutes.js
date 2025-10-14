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
router.post("/ptData/:HN/:dataId/update", checkRole(['admin', 'doctor']), PTDataController.updatePTData);

// ลบ PT Data (ใช้ form submit)
router.post("/ptData/:HN/:dataId/delete", checkRole('admin'), PTDataController.deletePTData);

// ติดตามความก้าวหน้า (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/ptData/progress/:HN", checkNotStaff, PTDataController.getProgressTracking);

// เปรียบเทียบผลลัพธ์ (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/ptData/compare", checkNotStaff, PTDataController.compareResults);

// บันทึกเป้าหมาย (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/ptData/goals/:HN", checkNotStaff, PTDataController.saveGoals);

// ดูเป้าหมาย - Staff เข้าถึงไม่ได้
router.get("/ptData/goals/:HN", checkNotStaff, PTDataController.getGoals);

// อัปเดตความก้าวหน้าเป้าหมาย (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/ptData/goals/:goalId/update", checkNotStaff, PTDataController.updateGoalProgress);

module.exports = router;