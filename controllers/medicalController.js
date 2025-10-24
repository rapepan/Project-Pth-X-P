const db = require('../config/db');
const MedicalModel = require('../models/medicalModel');
const PatientModel = require('../models/patientModel');
const ExaminationModel = require('../models/examinationModel');
const DiagnosisModel = require('../models/diagnosisModel');
const ProcedureModel = require('../models/procedureModel');
const PTDataModel = require('../models/ptDataModel');

class MedicalController {
  // แสดงห้องตรวจ
  static showExaminationRoom(req, res) {
    const HN = req.params.HN;

    if (!HN) {
      return res.render("examinationroom", {
        title: "ห้องตรวจ",
        patient: null,
        user: req.user,
        query: req.query
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
        user: req.user,
        query: req.query
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

  // บันทึกข้อมูลการซักประวัติ - ปรับปรุงใหม่
  static saveMedicalForm(req, res) {
    const HN = req.params.HN;
    const medicalData = req.body;

    console.log("Received medical form data:", medicalData);

    // ทำความสะอาดข้อมูลและแปลงเป็นตัวเลข
    const cleanData = {
      weight: parseFloat(String(medicalData.weight).replace(/[^\d.]/g, '')),
      height: parseFloat(String(medicalData.height).replace(/[^\d.]/g, '')),
      bloodPressure: String(medicalData.bloodPressure).replace(/[^\d\/]/g, ''),
      pulse: parseInt(String(medicalData.pulse).replace(/[^\d]/g, '')),
      o2Sat: parseInt(String(medicalData.o2Sat).replace(/[^\d]/g, '')),
      respiratoryRate: parseInt(String(medicalData.respiratoryRate).replace(/[^\d]/g, '')),
      bmi: parseFloat(medicalData.bmi) || 0,
      symptoms: medicalData.symptoms || '',
      currentHistory: medicalData.currentHistory || '',
      pastHistory: medicalData.pastHistory || ''
    };

    // ตรวจสอบข้อมูลที่จำเป็น
    const errors = [];
    if (isNaN(cleanData.weight) || cleanData.weight <= 0) errors.push('น้ำหนักไม่ถูกต้อง');
    if (isNaN(cleanData.height) || cleanData.height <= 0) errors.push('ส่วนสูงไม่ถูกต้อง');
    if (!cleanData.bloodPressure) errors.push('กรุณากรอกความดันโลหิต');
    if (isNaN(cleanData.pulse) || cleanData.pulse <= 0) errors.push('ชีพจรไม่ถูกต้อง');
    if (!cleanData.symptoms.trim()) errors.push('กรุณากรอกอาการ');

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
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

    // คำนวณ BMI ใหม่เพื่อความแน่นอน
    const heightInMeters = cleanData.height / 100;
    cleanData.bmi = (cleanData.weight / (heightInMeters * heightInMeters)).toFixed(2);

    // ดึงข้อมูลผู้ป่วย
    PatientModel.getPatientByHN(HN, (err, results) => {
      if (err || results.length === 0) {
        console.error("Error fetching patient:", err);
        return res.status(500).send("ไม่พบข้อมูลผู้ป่วย");
      }

      const patient = results[0];

      // เตรียมข้อมูลสำหรับบันทึก - เพิ่มหน่วยกลับเข้าไป
      const saveData = {
        HN: HN,
        fname: patient.fname,
        lname: patient.lname,
        weight: cleanData.weight + 'kg',
        height: cleanData.height + 'cm',
        bloodPressure: cleanData.bloodPressure + 'mmHg',
        pulse: cleanData.pulse + '/min',
        o2Sat: cleanData.o2Sat + '%',
        respiratoryRate: cleanData.respiratoryRate + '/min',
        bmi: cleanData.bmi,
        symptoms: cleanData.symptoms,
        currentHistory: cleanData.currentHistory,
        pastHistory: cleanData.pastHistory
      };

      console.log("Saving medical record with data:", saveData);

      // บันทึกข้อมูล
      MedicalModel.createMedicalRecord(saveData, (err, result) => {
        if (err) {
          console.error("Database error saving medical record:", err);
          return res.render("medicalFrom", {
            title: "ซักประวัติ",
            patient,
            user: req.user,
            errors: ['เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message],
            message: null,
            formData: medicalData
          });
        }

        console.log("Medical record saved successfully:", result.insertId);
        
        
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
          title: "ประวัติการรักษาผู้ป่วย",
          patient: patientResults[0],
          medicalfrom: medicalResults[0] || null,
          success: req.query.success
        });
      });
    });
  }

  // แสดงประวัติการรักษาตามวันที่
  static showMedicalHistoryByDate(req, res) {
    const hn = req.params.HN || req.query.hn;
    const date = req.query.date;

    if (!hn) {
      return res.render("medicaHistorydate", {
        title: "ประวัติการรักษาผู้ป่วย",
        patient: null,
        medicalHistory: [],
        examinationHistory: [],
        diagnosisHistory: [],
        procedureHistory: [],
        ptDataHistory: [],
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
          title: "ประวัติการรักษาผู้ป่วย",
          patient: null,
          medicalHistory: [],
          examinationHistory: [],
          diagnosisHistory: [],
          procedureHistory: [],
          ptDataHistory: [],
          availableDates: [],
          filters: { hn, date },
          message: "ไม่พบผู้ป่วยที่ HN นี้"
        });
      }

      const patient = patientResults[0];

      MedicalModel.getAvailableDates(hn, (err, datesResults) => {
        if (err) {
          console.error("Error fetching dates:", err);
          return res.status(500).send("ไม่สามารถดึงวันที่การรักษาได้");
        }

        // แปลง Date object เป็น string format YYYY-MM-DD
        const availableDates = datesResults.map(r => {
          const dateValue = r.visitDate;
          if (dateValue instanceof Date) {
            // แปลง Date object เป็น YYYY-MM-DD โดยใช้ local time
            const year = dateValue.getFullYear();
            const month = String(dateValue.getMonth() + 1).padStart(2, '0');
            const day = String(dateValue.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          return String(dateValue);
        });
        let selectedDate = date || (availableDates.length > 0 ? availableDates[0] : "");

        if (selectedDate) {
          // ดึงข้อมูลการซักประวัติ
          MedicalModel.getMedicalHistoryByDate(hn, selectedDate, (err, medicalResults) => {
            if (err) {
              console.error("Error fetching medical history:", err);
              return res.status(500).send("ไม่สามารถดึงข้อมูลการรักษาได้");
            }

            // ดึงข้อมูลการตรวจร่างกาย
            ExaminationModel.getExaminationByDate(hn, selectedDate, (err, examinationResults) => {
              if (err) {
                console.error("Error fetching examination data:", err);
                return res.status(500).send("ไม่สามารถดึงข้อมูลการตรวจร่างกายได้");
              }

              // ดึงข้อมูลการวินิจฉัย
              DiagnosisModel.getAllDiagnosisHistory(hn, (err, diagnosisResults) => {
                if (err) {
                  console.error("Error fetching diagnosis data:", err);
                  return res.status(500).send("ไม่สามารถดึงข้อมูลการวินิจฉัยได้");
                }

                // ดึงข้อมูลหัตถการ
                ProcedureModel.getProceduresByDate(hn, selectedDate, (err, procedureResults) => {
                  if (err) {
                    console.error("Error fetching procedure data:", err);
                    return res.status(500).send("ไม่สามารถดึงข้อมูลหัตถการได้");
                  }

                  // ดึงข้อมูล PT Data (สรุปผลการรักษา)
                  PTDataModel.getPatientPTData(hn, (err, ptDataResults) => {
                    if (err) {
                      console.error("Error fetching PT data:", err);
                      // ไม่ส่ง error แต่ให้ ptData เป็น array ว่าง
                      ptDataResults = [];
                    }


                    // ส่งข้อมูลทั้งหมดไป (จะกรองในหน้า view)
                    res.render("medicaHistorydate", {
                      title: "ประวัติการรักษาผู้ป่วย",
                      patient,
                      medicalHistory: medicalResults,
                      examinationHistory: examinationResults,
                      diagnosisHistory: diagnosisResults,
                      procedureHistory: procedureResults,
                      ptDataHistory: ptDataResults || [],
                      availableDates,
                      filters: { hn, date: selectedDate }
                    });
                  });
                });
              });
            });
          });
        } else {
          res.render("medicaHistorydate", {
            title: "ประวัติการรักษาผู้ป่วย",
            patient,
            medicalHistory: [],
            examinationHistory: [],
            diagnosisHistory: [],
            procedureHistory: [],
            ptDataHistory: [],
            availableDates,
            filters: { hn, date: selectedDate }
          });
        }
      });
    });
  }
}

module.exports = MedicalController;