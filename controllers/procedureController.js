const ProcedureModel = require('../models/procedureModel');
const { getCurrentDate } = require('../utils/billUtils');
const ServiceModel = require('../models/serviceModel');

class ProcedureController {
  // แสดงหน้าการรักษา
  static showProcedurePage(req, res) {
    const HN = req.params.HN;

    // Helper functions สำหรับ EJS
    const getProcedureIcon = (type) => {
      const icons = {
        'manual': 'hand-paper',
        'electrotherapy': 'bolt',
        'exercise': 'running',
        'thermal': 'thermometer-half',
        'traction': 'arrows-alt-v',
        'massage': 'hands',
        'other': 'tools'
      };
      return icons[type] || 'tools';
    };

    const getProcedureTypeName = (type) => {
      const names = {
        'manual': 'การรักษาด้วยมือ',
        'electrotherapy': 'ไฟฟ้าบำบัด',
        'exercise': 'การออกกำลังกาย',
        'thermal': 'ความร้อนบำบัด',
        'traction': 'การดึง',
        'massage': 'การนวด',
        'other': 'อื่นๆ'
      };
      return names[type] || 'อื่นๆ';
    };

    const getEffectivenessIcon = (effectiveness) => {
      const icons = {
        'excellent': 'star',
        'good': 'thumbs-up',
        'fair': 'minus',
        'poor': 'thumbs-down',
        'unknown': 'question'
      };
      return icons[effectiveness] || 'question';
    };

    const getEffectivenessName = (effectiveness) => {
      const names = {
        'excellent': 'ดีมาก',
        'good': 'ดี',
        'fair': 'ปานกลาง',
        'poor': 'ไม่ดี',
        'unknown': 'ยังประเมินไม่ได้'
      };
      return names[effectiveness] || 'ไม่ระบุ';
    };

    if (HN) {
      ProcedureModel.getPatientProcedures(HN, (err, procedures) => {
        if (err) {
          return res.status(500).render('error', {
            message: "ไม่สามารถดึงข้อมูลได้",
            error: err
          });
        }

        ServiceModel.getAllServices((err, services) => {
          if (err) {
            console.error('Error fetching services:', err);
            services = [];
          }

          res.render("procedure", {
            title: "หัตถการ",
            HN: HN,
            patient: { HN: HN },
            procedures: procedures || [],
            services: services || [],
            success: req.query.success,
            error: req.query.error,
            getProcedureIcon,
            getProcedureTypeName,
            getEffectivenessIcon,
            getEffectivenessName
          });
        });
      });
    } else {
      ServiceModel.getAllServices((err, services) => {
        if (err) {
          console.error('Error fetching services:', err);
          services = [];
        }

        res.render("procedure", {
          title: "การรักษา",
          HN: null,
          patient: null,
          procedures: [],
          services: services || [],
          success: req.query.success,
          error: req.query.error,
          getProcedureIcon,
          getProcedureTypeName,
          getEffectivenessIcon,
          getEffectivenessName
        });
      });
    }
  }

  // บันทึกการรักษา
  static saveProcedure(req, res) {
    const HN = req.params.HN;
    const procedureData = req.body;

    // ตรวจสอบว่ามีการเลือกบริการหรือไม่
    if (!procedureData.selectedServices) {
      return res.redirect(`/procedure/${HN}?error=${encodeURIComponent('กรุณาเลือกบริการอย่างน้อย 1 รายการ')}`);
    }

    // แปลงข้อมูลบริการที่เลือก
    let selectedServices = [];
    try {
      selectedServices = JSON.parse(procedureData.selectedServices);
    } catch (err) {
      return res.redirect(`/procedure/${HN}?error=${encodeURIComponent('ข้อมูลบริการไม่ถูกต้อง')}`);
    }

    if (selectedServices.length === 0) {
      return res.redirect(`/procedure/${HN}?error=${encodeURIComponent('กรุณาเลือกบริการอย่างน้อย 1 รายการ')}`);
    }

    // ดึงข้อมูลผู้ป่วยจากฐานข้อมูล
    const db = require('../config/db');
    const patientQuery = "SELECT fname, lname FROM patient WHERE HN = ?";

    db.query(patientQuery, [HN], (err, patientResults) => {
      if (err) {
        console.error('Error fetching patient:', err);
        return res.redirect(`/procedure/${HN}?error=${encodeURIComponent('ไม่สามารถดึงข้อมูลผู้ป่วยได้')}`);
      }

      // เตรียมชื่อผู้ป่วย
      let patientName = 'ผู้ป่วยไม่ระบุชื่อ';
      if (patientResults && patientResults.length > 0) {
        const patient = patientResults[0];
        patientName = `${patient.fname || ''} ${patient.lname || ''}`.trim();
        if (!patientName) {
          patientName = 'ผู้ป่วยไม่ระบุชื่อ';
        }
      }

      // สร้างรายการชื่อบริการจาก selectedServices
      const serviceNames = selectedServices.map(s => s.service_name).join(', ');

      // เตรียมข้อมูลหัตถการให้ครบถ้วน
      const completeProcedureData = {
        HN: HN,
        patient_name: patientName,
        procedure_date: getCurrentDate(), // YYYY-MM-DD format
        procedure_code: procedureData.procedureCode || 'PT001',
        procedure_name: serviceNames || 'หัตถการกายภาพบำบัด',
        technique: procedureData.techniques || serviceNames || 'การบำบัดด้วยบริการที่เลือก',
        duration_minutes: parseInt(procedureData.duration) || 30,
        therapist_name: procedureData.therapist || null,
        notes: procedureData.notes || '',
        effectiveness: procedureData.effectiveness || 'unknown',
        created_by: req.user ? (req.user.fullname || req.user.username || req.user.email || 'ไม่ระบุผู้ใช้') : 'ไม่ระบุผู้ใช้'
      };

      // บันทึกหัตถการเป็นข้อมูลใหม่เสมอ (ไม่ตรวจสอบหัตถการเดิม)
      completeProcedureData.session_count = 1;
      ProcedureModel.createProcedure(completeProcedureData, (err, result) => {
        if (err) {
          console.error('Error creating procedure:', err);
          return res.redirect(`/procedure/${HN}?error=${encodeURIComponent('ไม่สามารถบันทึกหัตถการได้')}`);
        }

        // บันทึกสำเร็จ - redirect กลับไปหน้า procedure พร้อมข้อความสำเร็จ
        res.redirect(`/procedure/${HN}?success=${encodeURIComponent('บันทึกหัตถการเรียบร้อยแล้ว')}`);
      });
    });
  }

  // แสดงประวัติการรักษา
  static showProcedureHistory(req, res) {
    const HN = req.params.HN;
    
    ProcedureModel.getPatientProcedureHistory(HN, (err, procedureList) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("procedureHistory", {
        title: "ประวัติการรักษา",
        HN: HN,
        procedureList: procedureList || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // แสดงรายละเอียดการรักษา
  static showProcedureDetail(req, res) {
    const procedureId = req.params.procedureId;
    
    ProcedureModel.getProcedureById(procedureId, (err, procedure) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      if (!procedure) {
        return res.status(404).render('error', { 
          message: "ไม่พบข้อมูลการรักษา",
          error: null 
        });
      }
      
      res.render("procedureDetail", {
        title: "รายละเอียดการรักษา",
        procedure: procedure,
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดตการรักษา
  static updateProcedure(req, res) {
    const procedureId = req.params.procedureId;
    const updateData = req.body;

    ProcedureModel.updateProcedure(procedureId, updateData, (err, result) => {
      if (err) {
        return res.redirect(`/procedureDetail/${req.params.HN}/${procedureId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/procedureDetail/${req.params.HN}/${procedureId}?success=อัปเดตเรียบร้อย`);
    });
  }

  // ลบการรักษา
  static deleteProcedure(req, res) {
    const procedureId = req.params.procedureId;

    ProcedureModel.deleteProcedure(procedureId, (err, result) => {
      if (err) {
        return res.redirect(`/procedureHistory/${req.params.HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/procedureHistory/${req.params.HN}?success=ลบเรียบร้อย`);
    });
  }

  // แสดงเทมเพลตการรักษา
  static showProcedureTemplates(req, res) {
    ProcedureModel.getProcedureTemplates((err, templates) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("procedureTemplates", {
        title: "เทมเพลตการรักษา",
        templates: templates || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // บันทึกเทมเพลตการรักษา
  static saveProcedureTemplate(req, res) {
    const templateData = req.body;

    ProcedureModel.saveProcedureTemplate(templateData, (err, result) => {
      if (err) {
        return res.redirect(`/procedureTemplates?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/procedureTemplates?success=บันทึกเทมเพลตเรียบร้อย`);
    });
  }

  // สถิติการรักษา
  static getProcedureStatistics(req, res) {
    const HN = req.params.HN;

    ProcedureModel.getProcedureStatistics(HN, (err, statistics) => {
      if (err) {
        return res.redirect(`/procedure/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/procedure/${HN}?success=ดึงสถิติเรียบร้อย&statistics=${JSON.stringify(statistics)}`);
    });
  }

  // การรักษาที่นิยม
  static getPopularProcedures(req, res) {
    ProcedureModel.getPopularProcedures((err, procedures) => {
      if (err) {
        return res.redirect(`/procedure?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/procedure?success=ดึงข้อมูลเรียบร้อย&popular=${JSON.stringify(procedures)}`);
    });
  }
}

module.exports = ProcedureController;