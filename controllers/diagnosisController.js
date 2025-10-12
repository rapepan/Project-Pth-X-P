const PatientModel = require('../models/patientModel');
const DiagnosisModel = require('../models/diagnosisModel');

class DiagnosisController {

  static showDiagnosisPage(req, res) {
    const HN = req.params.HN;

    if (!HN) {
      return res.render("diagnosis", {
        title: "วินิจฉัย",
        patient: null,
        user: req.user,
        errors: [],
        message: "กรุณาเลือกผู้ป่วยก่อน"
      });
    }

    PatientModel.getPatientByHN(HN, (err, results) => {
      if (err) {
        console.error("Error fetching patient:", err);
        return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
      }

      if (results.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      DiagnosisModel.getLatestDiagnosis(HN, (err, diagnosisResults) => {
        res.render("diagnosis", {
          title: "ระบบการวินิจฉัย",
          patient: results[0],
          latestDiagnosis: diagnosisResults.length > 0 ? diagnosisResults[0] : null,
          user: req.user,
          errors: [],
          message: null
        });
      });
    });
  }

  static saveDiagnosis(req, res) {
    const HN = req.params.HN;
    const diagnosisData = req.body;

    const errors = [];
    if (!diagnosisData.patientName || diagnosisData.patientName.trim() === '') {
      errors.push('กรุณากรอกชื่อผู้ป่วย');
    }

    if (errors.length > 0) {
      return res.status(400).send("ข้อมูลไม่ครบถ้วน");
    }

    // Process ICD-10 codes from form data
    const icd10Codes = [];
    if (diagnosisData.icd10Codes && Array.isArray(diagnosisData.icd10Codes)) {
      diagnosisData.icd10Codes.forEach(codeData => {
        if (codeData.code && codeData.description) {
          icd10Codes.push({
            code: codeData.code,
            description: codeData.description
          });
        }
      });
    }

    const saveData = {
      HN,
      patientName: diagnosisData.patientName,
      diagnosisDate: diagnosisData.diagnosisDate || new Date(),
      icd10Codes: icd10Codes, // Array of ICD-10 codes
      prognosis: diagnosisData.prognosis || '',
      treatmentPlan: diagnosisData.treatmentPlan || '',
      specialConsiderations: diagnosisData.specialConsiderations || '',
      createdBy: req.user ? req.user.fullname : null, // Use fullname instead of id since DB expects varchar
      notes: diagnosisData.notes || ''
    };

    DiagnosisModel.createDiagnosis(saveData, (err, result) => {
      if (err) {
        console.error("Error saving diagnosis:", err);
        return res.status(500).send("เกิดข้อผิดพลาด: " + err.message);
      }

      res.redirect(`/examinationroom/${HN}?success=diagnosis`);
    });
  }

  static showDiagnosisHistory(req, res) {
    const HN = req.params.HN;

    PatientModel.getPatientByHN(HN, (err, patientResults) => {
      if (err || patientResults.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      DiagnosisModel.getAllDiagnosisHistory(HN, (err, diagnosisResults) => {
        if (err) {
          return res.status(500).send("เกิดข้อผิดพลาด");
        }

        res.render("diagnosisHistory", {
          title: "ประวัติการวินิจฉัย",
          patient: patientResults[0],
          diagnoses: diagnosisResults,
          user: req.user
        });
      });
    });
  }

  static showDiagnosisDetail(req, res) {
    const { HN, diagnosisId } = req.params;

    PatientModel.getPatientByHN(HN, (err, patientResults) => {
      if (err || patientResults.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      DiagnosisModel.getDiagnosisById(diagnosisId, (err, diagnosisResults) => {
        if (err || diagnosisResults.length === 0) {
          return res.status(404).send("ไม่พบข้อมูลการวินิจฉัย");
        }

        res.render("diagnosisDetail", {
          title: "รายละเอียดการวินิจฉัย",
          patient: patientResults[0],
          diagnosis: diagnosisResults[0],
          user: req.user
        });
      });
    });
  }

  // API Methods
  static updateDiagnosis(req, res) {
    const diagnosisId = req.params.diagnosisId;
    const updateData = req.body;

    DiagnosisModel.updateDiagnosis(diagnosisId, updateData, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "อัปเดตเรียบร้อย" });
    });
  }

  static deleteDiagnosis(req, res) {
    const diagnosisId = req.params.diagnosisId;

    DiagnosisModel.deleteDiagnosis(diagnosisId, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "ลบเรียบร้อย" });
    });
  }

  static searchICD10(req, res) {
    const searchTerm = req.query.q || '';
    
    DiagnosisModel.searchICD10(searchTerm, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: results });
    });
  }

  static getFrequentICD10(req, res) {
    const limit = parseInt(req.query.limit) || 20;
    
    DiagnosisModel.getFrequentICD10(limit, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: results });
    });
  }

  static getDiagnosisStatistics(req, res) {
    const HN = req.params.HN;
    
    DiagnosisModel.getDiagnosisStatistics(HN, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: results[0] || {} });
    });
  }

  static getMonthlySummary(req, res) {
    const { year, month } = req.query;
    
    DiagnosisModel.getMonthlySummary(year, month, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: results });
    });
  }
}

module.exports = DiagnosisController;