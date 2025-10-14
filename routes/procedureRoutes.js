const express = require('express');
const router = express.Router();
const ProcedureController = require('../controllers/procedureController');
const { checkRole, checkStaff, checkNotStaff } = require('../middleware/authMiddleware');

// ==================== Procedure Management Routes ====================

// แสดงหน้าการรักษา - Staff เข้าถึงไม่ได้
router.get("/procedure/:HN?", checkNotStaff, ProcedureController.showProcedurePage);

// บันทึกการรักษา - Staff เข้าถึงไม่ได้
router.post("/procedure/:HN", checkNotStaff, ProcedureController.saveProcedure);

// แสดงประวัติการรักษา - Staff เข้าถึงไม่ได้
router.get("/procedureHistory/:HN", checkNotStaff, ProcedureController.showProcedureHistory);

// แสดงรายละเอียดการรักษา - Staff เข้าถึงไม่ได้
router.get("/procedureDetail/:HN/:procedureId", checkNotStaff, ProcedureController.showProcedureDetail);

// อัปเดตการรักษา (ใช้ form submit)
router.post("/procedure/:HN/:procedureId/update", checkRole('physical_therapist'), ProcedureController.updateProcedure);

// ลบการรักษา (ใช้ form submit)
router.post("/procedure/:HN/:procedureId/delete", checkRole('admin'), ProcedureController.deleteProcedure);

// แสดงเทมเพลตการรักษา - Staff เข้าถึงไม่ได้
router.get("/procedureTemplates", checkNotStaff, ProcedureController.showProcedureTemplates);

// บันทึกเทมเพลตการรักษา (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/procedureTemplates", checkNotStaff, ProcedureController.saveProcedureTemplate);

// สถิติการรักษา (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/procedure/statistics/:HN", checkNotStaff, ProcedureController.getProcedureStatistics);

// การรักษาที่นิยม (ใช้ form submit) - Staff เข้าถึงไม่ได้
router.post("/procedure/popular", checkNotStaff, ProcedureController.getPopularProcedures);

module.exports = router;