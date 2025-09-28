const db = require('../config/db');
const MedicalModel = require('../models/medicalModel');
const PatientModel = require('../models/patientModel');

class MedicalController {
  // แสดงห้องตรวจ
  static showExaminationRoom(req, res) {
    const HN = req.params.HN;

    if (!HN) {
      return res.render("examinationroom", {
        title: "ห้องตรวจ",
        patient: null,
        user: req.user
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

      res.render("examinationroom", {
        title: "ห้องตรวจ",
        patient: results[0],
        user: req.user
      });
    });
  }

  // แสดงฟอร์มซักประวัติ
  static showMedicalForm(req, res) {
    const HN = req.params.HN;

    if (!HN) {
      return res.render("medicalFrom", {
        title: "ซักประวัติ",
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

      res.render("medicalFrom", {
        title: "ซักประวัติ",
        patient: results[0],
        user: req.user,
        errors: [],
        message: null
      });
    });
  }

  // แสดงฟอร์มตรวจร่างกาย - เพิ่มใหม่
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

  // บันทึกข้อมูลการตรวจร่างกาย - เพิ่มใหม่
  static savePatientExamination(req, res) {
    const HN = req.params.HN;
    const examinationData = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    const errors = [];
    if (!examinationData.patientName) errors.push('กรุณากรอกชื่อผู้ป่วย');

    if (errors.length > 0) {
      PatientModel.getPatientByHN(HN, (err, results) => {
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
      return;
    }

    // เตรียมข้อมูลสำหรับบันทึก
    examinationData.HN = HN;

    // บันทึกข้อมูล
    MedicalModel.createExaminationRecord(examinationData, (err, result) => {
      if (err) {
        console.error("Error saving examination record:", err);
        PatientModel.getPatientByHN(HN, (err, results) => {
          if (err || results.length === 0) {
            return res.status(500).send("เกิดข้อผิดพลาด");
          }

          return res.render("patientexamination", {
            title: "ระบบตรวจร่างกายผู้ป่วย",
            patient: results[0],
            user: req.user,
            errors: ['เกิดข้อผิดพลาดในการบันทึกข้อมูล'],
            message: null,
            formData: examinationData
          });
        });
        return;
      }

      // บันทึกสำเร็จ
      res.redirect(`/medicalHistory/${HN}?success=examination`);
    });
  }

// บันทึกข้อมูลการซักประวัติ
static saveMedicalForm(req, res) {
  const HN = req.params.HN;
  const medicalData = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  const errors = [];
  if (!medicalData.weight) errors.push('กรุณากรอกน้ำหนัก');
  if (!medicalData.height) errors.push('กรุณากรอกส่วนสูง');
  if (!medicalData.bloodPressure) errors.push('กรุณากรอกความดันโลหิต');
  if (!medicalData.pulse) errors.push('กรุณากรอกชีพจร');
  if (!medicalData.symptoms) errors.push('กรุณากรอกอาการ');

  if (errors.length > 0) {
    PatientModel.getPatientByHN(HN, (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).send("เกิดข้อผิดพลาด");
      }

      return res.render("medicalFrom", {
        title: "ซักประวัติ",
        patient: results[0],
        user: req.user,
        errors,
        message: null,
        formData: medicalData
      });
    });
    return;
  }

  // คำนวณ BMI
  const weight = parseFloat(medicalData.weight);
  const height = parseFloat(medicalData.height) / 100;
  const bmi = (weight / (height * height)).toFixed(2);

  // ดึงข้อมูลผู้ป่วย เพื่อเอา fname / lname มาด้วย
  PatientModel.getPatientByHN(HN, (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).send("เกิดข้อผิดพลาด");
    }

    const patient = results[0];

    // ใส่ข้อมูลที่ต้องใช้บันทึก
    medicalData.HN = HN;
    medicalData.bmi = bmi;
    medicalData.fname = patient.fname;  
    medicalData.lname = patient.lname;  

    // บันทึกข้อมูล
    MedicalModel.createMedicalRecord(medicalData, (err, result) => {
      if (err) {
        console.error("Error saving medical record:", err);
        return res.render("medicalFrom", {
          title: "ซักประวัติ",
          patient,
          user: req.user,
          errors: ['เกิดข้อผิดพลาดในการบันทึกข้อมูล'],
          message: null,
          formData: medicalData
        });
      }

      // สำเร็จ
      res.redirect(`/medicalHistory/${HN}?success=true`);
    });
  });
}

  // แสดงประวัติการรักษา
  static showMedicalHistory(req, res) {
    const HN = req.params.HN;

    PatientModel.getPatientByHN(HN, (err, patientResults) => {
      if (err) {
        console.error("Error fetching patient:", err);
        return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
      }

      if (patientResults.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      MedicalModel.getLatestMedicalHistory(HN, (err, medicalResults) => {
        if (err) {
          console.error("Error fetching medical history:", err);
          return res.status(500).send("ไม่สามารถดึงข้อมูลการซักประวัติได้");
        }

        res.render("medicaHistory", {
          title: "ประวัติผู้ป่วย",
          patient: patientResults[0],
          medicalfrom: medicalResults[0] || null,
          success: req.query.success
        });
      });
    });
  }

  // แสดงประวัติการรักษาตามวันที่
  static showMedicalHistoryByDate(req, res) {
    const { hn, date } = req.query;

    if (!hn) {
      return res.render("medicaHistorydate", {
        title: "ค้นหาประวัติผู้ป่วย",
        patient: null,
        medicalHistory: [],
        availableDates: [],
        filters: {}
      });
    }

    PatientModel.getPatientByHN(hn, (err, patientResults) => {
      if (err) {
        console.error("Error fetching patient:", err);
        return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
      }

      if (patientResults.length === 0) {
        return res.render("medicaHistorydate", {
          title: "ค้นหาประวัติผู้ป่วย",
          patient: null,
          medicalHistory: [],
          availableDates: [],
          filters: { hn, date },
          message: "ไม่พบผู้ป่วยที่ HN นี้"
        });
      }

      const patient = patientResults[0];

      // ดึงวันที่ทั้งหมดที่มีประวัติการรักษา
      MedicalModel.getAvailableDates(hn, (err, datesResults) => {
        if (err) {
          console.error("Error fetching dates:", err);
          return res.status(500).send("ไม่สามารถดึงวันที่การรักษาได้");
        }

        const availableDates = datesResults.map(r => r.visitDate);
        let selectedDate = date || (availableDates.length > 0 ? availableDates[0] : "");

        if (selectedDate) {
          MedicalModel.getMedicalHistoryByDate(hn, selectedDate, (err, medicalResults) => {
            if (err) {
              console.error("Error fetching medical history:", err);
              return res.status(500).send("ไม่สามารถดึงข้อมูลการรักษาได้");
            }

            res.render("medicaHistorydate", {
              title: "ค้นหาประวัติผู้ป่วย",
              patient,
              medicalHistory: medicalResults,
              availableDates,
              filters: { hn, date: selectedDate }
            });
          });
        } else {
          res.render("medicaHistorydate", {
            title: "ค้นหาประวัติผู้ป่วย",
            patient,
            medicalHistory: [],
            availableDates,
            filters: { hn, date: selectedDate }
          });
        }
      });
    });
  }
}

module.exports = MedicalController;