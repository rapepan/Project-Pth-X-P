const express = require('express');
const router = express.Router();
const ExaminationController = require('../controllers/examinationController');

// Middleware for authentication and role checking
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Middleware for specific role checking
function checkRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }
    
    // Check if user has one of the allowed roles
    if (Array.isArray(allowedRoles)) {
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }
    } else if (req.user.role === allowedRoles) {
      return next();
    }
    
    // User doesn't have permission
    return res.status(403).render("error", {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้",
      user: req.user
    });
  };
}

// ==================== Main Examination Routes ====================

// แสดงฟอร์มตรวจร่างกาย
router.get("/patientexamination/:HN?", checkAuth, ExaminationController.showPatientExamination);

// บันทึกข้อมูลการตรวจร่างกาย
router.post("/patientexamination/:HN", checkAuth, ExaminationController.savePatientExamination);

// ==================== History Routes ====================

// แสดงประวัติการตรวจร่างกายทั้งหมดของผู้ป่วย
router.get("/examinationHistory/:HN", checkAuth, ExaminationController.showExaminationHistory);

// แสดงรายละเอียดการตรวจร่างกายแต่ละครั้ง
router.get("/examinationDetail/:HN/:examId", checkAuth, ExaminationController.showExaminationDetail);

// ==================== Print/Export Routes ====================

// พิมพ์รายงานการตรวจร่างกาย
router.get("/examinationPrint/:examId", checkAuth, ExaminationController.printExaminationReport);

// ==================== API Routes (for AJAX calls) ====================

// API: ดึงข้อมูลการตรวจร่างกายล่าสุด
router.get("/api/examination/latest/:HN", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const HN = req.params.HN;
  
  ExaminationModel.getLatestExaminationRecord(HN, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "ไม่สามารถดึงข้อมูลได้",
        error: err.message 
      });
    }
    
    res.json({
      success: true,
      data: results[0] || null
    });
  });
});

// API: ดึงประวัติการตรวจร่างกายตามวันที่
router.get("/api/examination/bydate", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const { hn, date } = req.query;
  
  if (!hn || !date) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุ HN และวันที่"
    });
  }
  
  ExaminationModel.getExaminationByDate(hn, date, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "ไม่สามารถดึงข้อมูลได้",
        error: err.message 
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// API: ดึงวันที่ที่มีการตรวจร่างกาย
router.get("/api/examination/dates/:HN", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const HN = req.params.HN;
  
  ExaminationModel.getAvailableExaminationDates(HN, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "ไม่สามารถดึงข้อมูลได้",
        error: err.message 
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// API: ค้นหาการตรวจร่างกาย
router.get("/api/examination/search", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุคำค้นหา"
    });
  }
  
  ExaminationModel.searchExamination(q, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "ไม่สามารถค้นหาได้",
        error: err.message 
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ต่อจากส่วน API: สถิติการตรวจร่างกาย
router.get("/api/examination/statistics/:HN", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const HN = req.params.HN;
  
  ExaminationModel.getExaminationStatistics(HN, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "ไม่สามารถดึงสถิติได้",
        error: err.message 
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ==================== Update/Delete Routes ====================

// อัปเดตข้อมูลการตรวจร่างกาย (สำหรับ admin หรือ doctor เท่านั้น)
router.put("/api/examination/:examId", checkRole(['admin', 'doctor']), (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const examId = req.params.examId;
  const updateData = req.body;
  
  ExaminationModel.updateExaminationRecord(examId, updateData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถอัปเดตข้อมูลได้",
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลการตรวจร่างกาย"
      });
    }
    
    res.json({
      success: true,
      message: "อัปเดตข้อมูลเรียบร้อยแล้ว"
    });
  });
});

// ลบข้อมูลการตรวจร่างกาย (สำหรับ admin เท่านั้น)
router.delete("/api/examination/:examId", checkRole('admin'), (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const examId = req.params.examId;
  
  ExaminationModel.deleteExaminationRecord(examId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถลบข้อมูลได้",
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลการตรวจร่างกาย"
      });
    }
    
    res.json({
      success: true,
      message: "ลบข้อมูลเรียบร้อยแล้ว"
    });
  });
});

// ==================== Comparison Routes ====================

// เปรียบเทียบผลการตรวจร่างกายระหว่าง 2 ครั้ง
router.get("/api/examination/compare", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const { exam1, exam2 } = req.query;
  
  if (!exam1 || !exam2) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุ ID ของการตรวจร่างกายที่ต้องการเปรียบเทียบ"
    });
  }
  
  ExaminationModel.compareExaminations(exam1, exam2, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถเปรียบเทียบข้อมูลได้",
        error: err.message
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ==================== Export Routes ====================

// Export ข้อมูลการตรวจร่างกายเป็น PDF
router.get("/api/examination/export/pdf/:HN", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const HN = req.params.HN;
  const { startDate, endDate } = req.query;
  
  ExaminationModel.getExaminationForExport(HN, startDate, endDate, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถ export ข้อมูลได้",
        error: err.message
      });
    }
    
    // TODO: Generate PDF using results
    // This would typically use a PDF generation library like puppeteer or pdfkit
    
    res.json({
      success: true,
      message: "PDF generation endpoint - implementation pending",
      data: results
    });
  });
});

// Export ข้อมูลการตรวจร่างกายเป็น Excel
router.get("/api/examination/export/excel/:HN", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const HN = req.params.HN;
  const { startDate, endDate } = req.query;
  
  ExaminationModel.getExaminationForExport(HN, startDate, endDate, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถ export ข้อมูลได้",
        error: err.message
      });
    }
    
    // TODO: Generate Excel using results
    // This would typically use an Excel generation library like exceljs
    
    res.json({
      success: true,
      message: "Excel generation endpoint - implementation pending",
      data: results
    });
  });
});

// ==================== Summary Routes ====================

// สรุปผลการตรวจร่างกายรายเดือน
router.get("/api/examination/summary/monthly", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const { year, month } = req.query;
  
  if (!year || !month) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุปีและเดือน"
    });
  }
  
  ExaminationModel.getMonthlySummary(year, month, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงสรุปรายเดือนได้",
        error: err.message
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// สรุปผลการตรวจร่างกายรายปี
router.get("/api/examination/summary/yearly/:year", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const year = req.params.year;
  
  ExaminationModel.getYearlySummary(year, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงสรุปรายปีได้",
        error: err.message
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ==================== Validation Routes ====================

// ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
router.post("/api/examination/validate", checkAuth, (req, res) => {
  const data = req.body;
  const errors = [];
  
  // Validate required fields
  if (!data.patientName || data.patientName.trim() === '') {
    errors.push('กรุณากรอกชื่อผู้ป่วย');
  }
  
  if (!data.observation || data.observation.trim() === '') {
    errors.push('กรุณากรอก Observation');
  }
  
  if (!data.palpation || data.palpation.trim() === '') {
    errors.push('กรุณากรอก Palpation');
  }
  
  // Validate logical consistency
  if (data.romWNL && data.romWeakness) {
    errors.push('ROM ไม่สามารถเป็น WNL และ Weakness พร้อมกันได้');
  }
  
  if (data.mmtNormal && data.mmtLimited) {
    errors.push('MMT ไม่สามารถเป็น Normal และ Limited พร้อมกันได้');
  }
  
  if (data.transferIndependent && data.transferDependent) {
    errors.push('Transfer ไม่สามารถเป็น Independent และ Dependent พร้อมกันได้');
  }
  
  if (data.ambulationIndependent && data.ambulationDependent) {
    errors.push('Ambulation ไม่สามารถเป็น Independent และ Dependent พร้อมกันได้');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors
    });
  }
  
  res.json({
    success: true,
    message: "ข้อมูลถูกต้อง"
  });
});

// ==================== Template Routes ====================

// ดึง template การตรวจร่างกายที่บันทึกไว้
router.get("/api/examination/templates", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  
  ExaminationModel.getExaminationTemplates(req.user.id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึง templates ได้",
        error: err.message
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// บันทึก template การตรวจร่างกาย
router.post("/api/examination/templates", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const templateData = {
    ...req.body,
    userId: req.user.id
  };
  
  ExaminationModel.saveExaminationTemplate(templateData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถบันทึก template ได้",
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: "บันทึก template เรียบร้อยแล้ว",
      templateId: result.insertId
    });
  });
});

// ==================== Progress Tracking Routes ====================

// ติดตามความก้าวหน้าของผู้ป่วย
router.get("/api/examination/progress/:HN", checkAuth, (req, res) => {
  const ExaminationModel = require('../models/examinationModel');
  const HN = req.params.HN;
  const { limit = 10 } = req.query;
  
  ExaminationModel.getPatientProgress(HN, limit, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงข้อมูลความก้าวหน้าได้",
        error: err.message
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ==================== Error Handling Middleware ====================

// Handle 404 for undefined routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "ไม่พบ endpoint ที่ร้องขอ"
  });
});

// Global error handler for this router
router.use((err, req, res, next) => {
  console.error("Examination Routes Error:", err.stack);
  
  res.status(500).json({
    success: false,
    message: "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;