const ExaminationModel = require('../models/examinationModel');
const PatientModel = require('../models/patientModel');

class ExaminationController {
  // แสดงหน้าระบบตรวจร่างกายผู้ป่วย
  static showPatientExamination(req, res) {
    const HN = req.params.HN;
    
    if (!HN) {
      return res.status(400).render('error', { 
        title: 'ข้อผิดพลาด',
        statusCode: 400,
        message: "ไม่พบรหัสผู้ป่วย",
        error: null 
      });
    }

    // ดึงข้อมูลผู้ป่วย
    PatientModel.getPatientByHN(HN, (err, patientResults) => {
      if (err) {
        return res.status(500).render('error', { 
          title: 'ข้อผิดพลาด',
          statusCode: 500,
          message: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
          error: err 
        });
      }

      if (patientResults.length === 0) {
        return res.status(404).render('error', { 
          title: 'ไม่พบข้อมูล',
          statusCode: 404,
          message: "ไม่พบข้อมูลผู้ป่วย",
          error: null 
        });
      }

      const patient = patientResults[0];

      // ดึงข้อมูลการตรวจที่ผ่านมา
      ExaminationModel.getPatientExaminations(HN, (err, examinations) => {
        if (err) {
          return res.status(500).render('error', { 
            title: 'ข้อผิดพลาด',
            statusCode: 500,
            message: "ไม่สามารถดึงข้อมูลการตรวจได้",
            error: err 
          });
        }

        res.render("patientexamination", {
          title: "ระบบตรวจร่างกายผู้ป่วย",
          patient: patient,
          examinations: examinations || [],
          user: req.user,
          errors: null,
          message: null
        });
      });
    });
  }

  // บันทึกการตรวจร่างกายผู้ป่วย
  static savePatientExamination(req, res) {
    const HN = req.params.HN || req.body.HN;
    
    if (!HN) {
      return res.status(400).render('error', { 
        title: 'ข้อผิดพลาด',
        statusCode: 400,
        message: "ไม่พบรหัสผู้ป่วย",
        error: null 
      });
    }

    const examinationData = req.body;

    // สร้างข้อมูลการตรวจ
    const saveData = {
      HN: HN,
      patient_name: examinationData.patient_name || examinationData.patientName,
      observation: examinationData.observation || '',
      palpation: examinationData.palpation || '',
      rom_wnl: examinationData.romWNL ? 1 : 0,
      rom_weakness: examinationData.romWeakness ? 1 : 0,
      rom_notes: examinationData.romNotes || '',
      mmt_normal: examinationData.mmtNormal ? 1 : 0,
      mmt_limited: examinationData.mmtLimited ? 1 : 0,
      mmt_notes: examinationData.mmtNotes || '',
      accessory_normal: examinationData.accessoryNormal ? 1 : 0,
      accessory_hypermobility: examinationData.accessoryHypermobility ? 1 : 0,
      accessory_notes: examinationData.accessoryNotes || '',
      pinprick: examinationData.pinprick ? 1 : 0,
      light_touch: examinationData.lightTouch ? 1 : 0,
      sensory_test: examinationData.sensoryTest || '',
      normal_reflex: examinationData.normalReflex ? 1 : 0,
      abnormal_reflex: examinationData.abnormalReflex ? 1 : 0,
      deep_tendon_reflex: examinationData.deepTendonReflex || '',
      transfer_independent: examinationData.transferIndependent ? 1 : 0,
      transfer_dependent: examinationData.transferDependent ? 1 : 0,
      transfer_notes: examinationData.transferNotes || '',
      ambulation_independent: examinationData.ambulationIndependent ? 1 : 0,
      ambulation_dependent: examinationData.ambulationDependent ? 1 : 0,
      ambulation_notes: examinationData.ambulationNotes || '',
      notes: examinationData.notes || ''
    };

    ExaminationModel.createExaminationRecord(saveData, (err, result) => {
      if (err) {
        console.error("Error saving examination:", err);
        return res.redirect(`/patientexamination/${HN}?error=${encodeURIComponent(err.message)}`);
      }

      res.redirect(`/patientexamination/${HN}?success=บันทึกการตรวจร่างกายเรียบร้อย`);
    });
  }

  // แสดงหน้าห้องตรวจ
  static showExaminationRoom(req, res) {
    const HN = req.params.HN;
    
    if (HN) {
      ExaminationModel.getPatientExaminations(HN, (err, examinations) => {
        if (err) {
          return res.status(500).render('error', { 
            message: "ไม่สามารถดึงข้อมูลได้",
            error: err 
          });
        }
        
        res.render("examinationroom", {
          title: "ห้องตรวจ",
          HN: HN,
          examinations: examinations || [],
          success: req.query.success,
          error: req.query.error
        });
      });
    } else {
      res.render("examinationroom", {
        title: "ห้องตรวจ",
        HN: null,
        examinations: [],
        success: req.query.success,
        error: req.query.error
      });
    }
  }

  // บันทึกการตรวจ
  static saveExamination(req, res) {
    const HN = req.params.HN;
    const examinationData = req.body;

    ExaminationModel.createExamination(HN, examinationData, (err, result) => {
      if (err) {
        return res.redirect(`/examinationroom/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom/${HN}?success=บันทึกการตรวจเรียบร้อย`);
    });
  }

  // แสดงประวัติการตรวจ
  static showExaminationHistory(req, res) {
    const HN = req.params.HN;

    ExaminationModel.getPatientExaminationHistory(HN, (err, examinationList) => {
      if (err) {
        return res.status(500).render('error', {
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err
        });
      }

      res.render("examinationHistory", {
        title: "ประวัติการตรวจ",
        HN: HN,
        patient: { HN: HN },
        examinations: examinationList || [],
        examinationList: examinationList || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // แสดงรายละเอียดการตรวจ
  static showExaminationDetail(req, res) {
    const examId = req.params.examId;
    
    ExaminationModel.getExaminationById(examId, (err, examination) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      if (!examination) {
        return res.status(404).render('error', { 
          message: "ไม่พบข้อมูลการตรวจ",
          error: null 
        });
      }
      
      res.render("examinationDetail", {
        title: "รายละเอียดการตรวจ",
        examination: examination,
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // แสดงการตรวจล่าสุด
  static getLatestExamination(req, res) {
    const HN = req.params.HN;

    ExaminationModel.getLatestExamination(HN, (err, examination) => {
      if (err) {
        return res.redirect(`/examinationroom/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom/${HN}?success=ดึงข้อมูลเรียบร้อย&latest=${JSON.stringify(examination)}`);
    });
  }

  // แสดงการตรวจตามวันที่
  static getExaminationsByDate(req, res) {
    const { date } = req.body;

    ExaminationModel.getExaminationsByDate(date, (err, examinations) => {
      if (err) {
        return res.redirect(`/examinationroom?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom?success=ดึงข้อมูลเรียบร้อย&examinations=${JSON.stringify(examinations)}`);
    });
  }

  // แสดงวันที่ที่มีการตรวจ
  static getExaminationDates(req, res) {
    const HN = req.params.HN;

    ExaminationModel.getExaminationDates(HN, (err, dates) => {
      if (err) {
        return res.redirect(`/examinationroom/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom/${HN}?success=ดึงข้อมูลเรียบร้อย&dates=${JSON.stringify(dates)}`);
    });
  }

  // ค้นหาการตรวจ
  static searchExaminations(req, res) {
    const { searchTerm, searchType } = req.body;

    ExaminationModel.searchExaminations(searchTerm, searchType, (err, examinations) => {
      if (err) {
        return res.redirect(`/examinationroom?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom?success=ค้นหาสำเร็จ&examinations=${JSON.stringify(examinations)}`);
    });
  }

  // สถิติการตรวจ
  static getExaminationStatistics(req, res) {
    const HN = req.params.HN;

    ExaminationModel.getExaminationStatistics(HN, (err, statistics) => {
      if (err) {
        return res.redirect(`/examinationroom/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom/${HN}?success=ดึงสถิติเรียบร้อย&statistics=${JSON.stringify(statistics)}`);
    });
  }

  // อัปเดตการตรวจ
  static updateExamination(req, res) {
    const examId = req.params.examId;
    const updateData = req.body;

    ExaminationModel.updateExamination(examId, updateData, (err, result) => {
      if (err) {
        return res.redirect(`/examinationDetail/${req.params.HN}/${examId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationDetail/${req.params.HN}/${examId}?success=อัปเดตเรียบร้อย`);
    });
  }

  // ลบการตรวจ
  static deleteExamination(req, res) {
    const examId = req.params.examId;

    ExaminationModel.deleteExamination(examId, (err, result) => {
      if (err) {
        return res.redirect(`/examinationHistory/${req.params.HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationHistory/${req.params.HN}?success=ลบเรียบร้อย`);
    });
  }

  // เปรียบเทียบการตรวจ
  static compareExaminations(req, res) {
    const { examId1, examId2 } = req.body;

    ExaminationModel.compareExaminations(examId1, examId2, (err, comparison) => {
      if (err) {
        return res.redirect(`/examinationroom?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom?success=เปรียบเทียบเรียบร้อย&comparison=${JSON.stringify(comparison)}`);
    });
  }

  // สรุปการตรวจรายเดือน
  static getMonthlySummary(req, res) {
    const { year, month } = req.body;

    ExaminationModel.getMonthlySummary(year, month, (err, summary) => {
      if (err) {
        return res.redirect(`/examinationroom?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom?success=ดึงสรุปเรียบร้อย&summary=${JSON.stringify(summary)}`);
    });
  }

  // สรุปการตรวจรายปี
  static getYearlySummary(req, res) {
    const year = req.params.year;

    ExaminationModel.getYearlySummary(year, (err, summary) => {
      if (err) {
        return res.redirect(`/examinationroom?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom?success=ดึงสรุปเรียบร้อย&summary=${JSON.stringify(summary)}`);
    });
  }

  // ตรวจสอบความถูกต้อง
  static validateExamination(req, res) {
    const examinationData = req.body;

    ExaminationModel.validateExamination(examinationData, (err, validation) => {
      if (err) {
        return res.redirect(`/examinationroom?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom?success=ตรวจสอบเรียบร้อย&validation=${JSON.stringify(validation)}`);
    });
  }

  // แสดงเทมเพลตการตรวจ
  static showExaminationTemplates(req, res) {
    ExaminationModel.getExaminationTemplates((err, templates) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("examinationTemplates", {
        title: "เทมเพลตการตรวจ",
        templates: templates || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // บันทึกเทมเพลตการตรวจ
  static saveExaminationTemplate(req, res) {
    const templateData = req.body;

    ExaminationModel.saveExaminationTemplate(templateData, (err, result) => {
      if (err) {
        return res.redirect(`/examinationTemplates?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationTemplates?success=บันทึกเทมเพลตเรียบร้อย`);
    });
  }

  // ติดตามความก้าวหน้า
  static getProgressTracking(req, res) {
    const HN = req.params.HN;

    ExaminationModel.getProgressTracking(HN, (err, progress) => {
      if (err) {
        return res.redirect(`/examinationroom/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/examinationroom/${HN}?success=ดึงข้อมูลความก้าวหน้าเรียบร้อย&progress=${JSON.stringify(progress)}`);
    });
  }
}

module.exports = ExaminationController;