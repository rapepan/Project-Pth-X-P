const express = require('express');
const router = express.Router();
const PTDataController = require('../controllers/ptDataController');
const { checkRole } = require('../middleware/authMiddleware');

// ==================== PT Data Management Routes ====================

// แสดงหน้า PT Data
router.get("/ptData/:HN?", checkRole('user'), PTDataController.showPTDataPage);

// บันทึก PT Data
router.post("/ptData/:HN", checkRole('user'), PTDataController.savePTData);

// แสดงประวัติ PT Data
router.get("/ptDataHistory/:HN", checkRole('user'), PTDataController.showPTDataHistory);

// แสดงรายละเอียด PT Data
router.get("/ptDataDetail/:HN/:dataId", checkRole('user'), PTDataController.showPTDataDetail);

// อัปเดต PT Data (ใช้ form submit)
router.post("/ptData/:HN/:dataId/update", checkRole(['admin', 'doctor']), PTDataController.updatePTData);

// ลบ PT Data (ใช้ form submit)
router.post("/ptData/:HN/:dataId/delete", checkRole('admin'), PTDataController.deletePTData);

// ติดตามความก้าวหน้า (ใช้ form submit)
router.post("/ptData/progress/:HN", checkRole('user'), PTDataController.getProgressTracking);

// เปรียบเทียบผลลัพธ์ (ใช้ form submit)
router.post("/ptData/compare", checkRole('user'), PTDataController.compareResults);

// บันทึกเป้าหมาย (ใช้ form submit)
router.post("/ptData/goals/:HN", checkRole('user'), PTDataController.saveGoals);

// ดูเป้าหมาย
router.get("/ptData/goals/:HN", checkRole('user'), PTDataController.getGoals);

// อัปเดตความก้าวหน้าเป้าหมาย (ใช้ form submit)
router.post("/ptData/goals/:goalId/update", checkRole('user'), PTDataController.updateGoalProgress);

module.exports = router;