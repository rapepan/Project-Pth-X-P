const PatientModel = require('../models/patientModel');
const ExaminationModel = require('../models/examinationModel');

class ExaminationController {
  // แสดงฟอร์มตรวจร่างกาย
  static showPatientExamination(req, res) {
    const HN = req.params.HN;

    if (!HN) {
      return res.render("patientexamination", {
        title: "ระบบตรวจร่างกายผู้ป่วย",
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

      res.render("patientexamination", {
        title: "ระบบตรวจร่างกายผู้ป่วย",
        patient: results[0],
        user: req.user,
        errors: [],
        message: null
      });
    });
  }

// บันทึกข้อมูลการตรวจร่างกาย
static savePatientExamination(req, res) {
  const HN = req.params.HN;
  const examinationData = req.body;

  console.log("Received examination data:", examinationData);

  const errors = [];
  if (!examinationData.patientName || examinationData.patientName.trim() === '') {
    errors.push('กรุณากรอกชื่อผู้ป่วย');
  }
  if (!examinationData.observation || examinationData.observation.trim() === '') {
    errors.push('กรุณากรอก Observation');
  }
  if (!examinationData.palpation || examinationData.palpation.trim() === '') {
    errors.push('กรุณากรอก Palpation');
  }

  if (errors.length > 0) {
    return PatientModel.getPatientByHN(HN, (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).send("เกิดข้อผิดพลาด");
      }
      return res.render("patientexamination", {
        title: "ระบบตรวจร่างกายผู้ป่วย",
        patient: results[0],
        user: req.user,
        errors,
        message: null,
        formData: examinationData
      });
    });
  }

  const saveData = {
    HN,
    patientName: examinationData.patientName,
    observation: examinationData.observation,
    palpation: examinationData.palpation,

    rom: {
      WNL: examinationData.romWNL === '1' || examinationData.romWNL === true,
      Weakness: examinationData.romWeakness === '1' || examinationData.romWeakness === true,
      note: examinationData.romNotes || ''
    },
    mmt: {
      Normal: examinationData.mmtNormal === '1' || examinationData.mmtNormal === true,
      Limited: examinationData.mmtLimited === '1' || examinationData.mmtLimited === true,
      note: examinationData.mmtNotes || ''
    },
    accessory: {
      Normal: examinationData.accessoryNormal === '1' || examinationData.accessoryNormal === true,
      Hypermobility: examinationData.accessoryHypermobility === '1' || examinationData.accessoryHypermobility === true,
      note: examinationData.accessoryNotes || ''
    },
    sensory: {
      Pinprick: examinationData.pinprick === '1' || examinationData.pinprick === true,
      LightTouch: examinationData.lightTouch === '1' || examinationData.lightTouch === true,
      note: examinationData.sensoryTest || ''
    },
    reflex: {
      Normal: examinationData.normalReflex === '1' || examinationData.normalReflex === true,
      Abnormal: examinationData.abnormalReflex === '1' || examinationData.abnormalReflex === true,
      note: examinationData.deepTendonReflex || ''
    },
    transfer: {
      Independent: examinationData.transferIndependent === '1' || examinationData.transferIndependent === true,
      Dependent: examinationData.transferDependent === '1' || examinationData.transferDependent === true,
      note: examinationData.transferNotes || ''
    },
    ambulation: {
      Independent: examinationData.ambulationIndependent === '1' || examinationData.ambulationIndependent === true,
      Dependent: examinationData.ambulationDependent === '1' || examinationData.ambulationDependent === true,
      note: examinationData.ambulationNotes || ''
    },
    notes: examinationData.notes || ''
  };

  console.log("Saving examination record with data:", saveData);

  ExaminationModel.createExaminationRecord(saveData, (err, result) => {
    if (err) {
      console.error("Database error saving examination record:", err);
      return PatientModel.getPatientByHN(HN, (err, results) => {
        if (err || results.length === 0) {
          return res.status(500).send("เกิดข้อผิดพลาด");
        }
        return res.render("patientexamination", {
          title: "ระบบตรวจร่างกายผู้ป่วย",
          patient: results[0],
          user: req.user,
          errors: ['เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message],
          message: null,
          formData: examinationData
        });
      });
    }

    console.log("Examination record saved successfully:", result.insertId);
    res.redirect(`/examinationroom/${HN}?success=examination`);
  });
}

  // แสดงประวัติการตรวจร่างกาย
  static showExaminationHistory(req, res) {
    const HN = req.params.HN;

    PatientModel.getPatientByHN(HN, (err, patientResults) => {
      if (err) {
        console.error("Error fetching patient:", err);
        return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
      }

      if (patientResults.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      ExaminationModel.getAllExaminationHistory(HN, (err, examinationResults) => {
        if (err) {
          console.error("Error fetching examination history:", err);
          return res.status(500).send("ไม่สามารถดึงประวัติการตรวจร่างกายได้");
        }

        res.render("examinationHistory", {
          title: "ประวัติการตรวจร่างกาย",
          patient: patientResults[0],
          examinations: examinationResults,
          user: req.user
        });
      });
    });
  }

  // แสดงรายละเอียดการตรวจร่างกายตาม ID
  static showExaminationDetail(req, res) {
    const { HN, examId } = req.params;

    PatientModel.getPatientByHN(HN, (err, patientResults) => {
      if (err || patientResults.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      ExaminationModel.getExaminationById(examId, (err, examResults) => {
        if (err || examResults.length === 0) {
          return res.status(404).send("ไม่พบข้อมูลการตรวจร่างกาย");
        }

        res.render("examinationDetail", {
          title: "รายละเอียดการตรวจร่างกาย",
          patient: patientResults[0],
          examination: examResults[0],
          user: req.user
        });
      });
    });
  }

  // พิมพ์รายงานการตรวจร่างกาย
  static printExaminationReport(req, res) {
    const examId = req.params.examId;

    ExaminationModel.getExaminationById(examId, (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลการตรวจร่างกาย");
      }

      res.render("examinationPrint", {
        title: "พิมพ์รายงานการตรวจร่างกาย",
        examination: results[0],
        layout: false // No layout for print view
      });
    });
  }
}

module.exports = ExaminationController;