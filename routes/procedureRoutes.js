const express = require('express');
const router = express.Router();
const ProcedureController = require('../controllers/procedureController');
const { checkRole } = require('../middleware/authMiddleware');

// ==================== Procedure Management Routes ====================

// แสดงหน้าการรักษา
router.get("/procedure/:HN?", checkRole('user'), ProcedureController.showProcedurePage);

// บันทึกการรักษา
router.post("/procedure/:HN", checkRole('user'), ProcedureController.saveProcedure);

// แสดงประวัติการรักษา
router.get("/procedureHistory/:HN", checkRole('user'), ProcedureController.showProcedureHistory);

// แสดงรายละเอียดการรักษา
router.get("/procedureDetail/:HN/:procedureId", checkRole('user'), ProcedureController.showProcedureDetail);

// อัปเดตการรักษา (ใช้ form submit)
router.post("/procedure/:HN/:procedureId/update", checkRole(['admin', 'doctor']), ProcedureController.updateProcedure);

// ลบการรักษา (ใช้ form submit)
router.post("/procedure/:HN/:procedureId/delete", checkRole('admin'), ProcedureController.deleteProcedure);

// แสดงเทมเพลตการรักษา
router.get("/procedureTemplates", checkRole('user'), ProcedureController.showProcedureTemplates);

// บันทึกเทมเพลตการรักษา (ใช้ form submit)
router.post("/procedureTemplates", checkRole('user'), ProcedureController.saveProcedureTemplate);

// สถิติการรักษา (ใช้ form submit)
router.post("/procedure/statistics/:HN", checkRole('user'), ProcedureController.getProcedureStatistics);

// การรักษาที่นิยม (ใช้ form submit)
router.post("/procedure/popular", checkRole('user'), ProcedureController.getPopularProcedures);

module.exports = router;