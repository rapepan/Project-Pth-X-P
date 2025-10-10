const ProcedureModel = require('../models/procedureModel');

class ProcedureController {
  // แสดงหน้าการรักษา
  static showProcedurePage(req, res) {
    const HN = req.params.HN;

    if (HN) {
      ProcedureModel.getPatientProcedures(HN, (err, procedures) => {
        if (err) {
          return res.status(500).render('error', {
            message: "ไม่สามารถดึงข้อมูลได้",
            error: err
          });
        }

        res.render("procedure", {
          title: "หัตถการ",
          HN: HN,
          patient: { HN: HN },
          procedures: procedures || [],
          success: req.query.success,
          error: req.query.error
        });
      });
    } else {
      res.render("procedure", {
        title: "การรักษา",
        HN: null,
        patient: null,
        procedures: [],
        success: req.query.success,
        error: req.query.error
      });
    }
  }

  // บันทึกการรักษา
  static saveProcedure(req, res) {
    const HN = req.params.HN;
    const procedureData = req.body;

    ProcedureModel.createProcedure(HN, procedureData, (err, result) => {
      if (err) {
        return res.redirect(`/procedure/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/procedure/${HN}?success=บันทึกการรักษาเรียบร้อย`);
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