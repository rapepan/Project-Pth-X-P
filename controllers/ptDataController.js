const PTDataModel = require('../models/ptDataModel');

class PTDataController {
  // แสดงหน้า PT Data
  static showPTDataPage(req, res) {
    const HN = req.params.HN;

    if (HN) {
      PTDataModel.getPatientPTData(HN, (err, ptData) => {
        if (err) {
          return res.status(500).render('error', {
            title: "Error",
            statusCode: 500,
            message: "ไม่สามารถดึงข้อมูลได้",
            error: err
          });
        }

        res.render("ptData", {
          title: "สรุปผลการรักษา",
          HN: HN,
          patient: { HN: HN },
          ptData: ptData || [],
          success: req.query.success,
          error: req.query.error
        });
      });
    } else {
      res.render("ptData", {
        title: "ข้อมูลกายภาพบำบัด",
        HN: null,
        patient: null,
        ptData: [],
        success: req.query.success,
        error: req.query.error
      });
    }
  }

  // บันทึก PT Data
  static savePTData(req, res) {
    const HN = req.params.HN;
    const ptData = req.body;

    PTDataModel.createPTData(HN, ptData, (err, result) => {
      if (err) {
        return res.redirect(`/ptData/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptData/${HN}?success=บันทึกข้อมูลเรียบร้อย`);
    });
  }

  // แสดงประวัติ PT Data
  static showPTDataHistory(req, res) {
    const HN = req.params.HN;
    
    PTDataModel.getPatientPTDataHistory(HN, (err, ptDataList) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("ptDataHistory", {
        title: "ประวัติข้อมูลกายภาพบำบัด",
        HN: HN,
        ptDataList: ptDataList || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // แสดงรายละเอียด PT Data
  static showPTDataDetail(req, res) {
    const dataId = req.params.dataId;
    
    PTDataModel.getPTDataById(dataId, (err, ptData) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      if (!ptData) {
        return res.status(404).render('error', { 
          message: "ไม่พบข้อมูล",
          error: null 
        });
      }
      
      res.render("ptDataDetail", {
        title: "รายละเอียดข้อมูลกายภาพบำบัด",
        ptData: ptData,
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดต PT Data
  static updatePTData(req, res) {
    const dataId = req.params.dataId;
    const updateData = req.body;

    PTDataModel.updatePTData(dataId, updateData, (err, result) => {
      if (err) {
        return res.redirect(`/ptDataDetail/${req.params.HN}/${dataId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptDataDetail/${req.params.HN}/${dataId}?success=อัปเดตเรียบร้อย`);
    });
  }

  // ลบ PT Data
  static deletePTData(req, res) {
    const dataId = req.params.dataId;

    PTDataModel.deletePTData(dataId, (err, result) => {
      if (err) {
        return res.redirect(`/ptDataHistory/${req.params.HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptDataHistory/${req.params.HN}?success=ลบเรียบร้อย`);
    });
  }

  // ติดตามความก้าวหน้า
  static getProgressTracking(req, res) {
    const HN = req.params.HN;

    PTDataModel.getProgressTracking(HN, (err, progress) => {
      if (err) {
        return res.redirect(`/ptData/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptData/${HN}?success=ดึงข้อมูลความก้าวหน้าเรียบร้อย&progress=${JSON.stringify(progress)}`);
    });
  }

  // เปรียบเทียบผลลัพธ์
  static compareResults(req, res) {
    const { dataId1, dataId2 } = req.body;

    PTDataModel.compareResults(dataId1, dataId2, (err, comparison) => {
      if (err) {
        return res.redirect(`/ptData?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptData?success=เปรียบเทียบผลลัพธ์เรียบร้อย&comparison=${JSON.stringify(comparison)}`);
    });
  }

  // บันทึกเป้าหมาย
  static saveGoals(req, res) {
    const HN = req.params.HN;
    const goalsData = req.body;

    PTDataModel.saveGoals(HN, goalsData, (err, result) => {
      if (err) {
        return res.redirect(`/ptData/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptData/${HN}?success=บันทึกเป้าหมายเรียบร้อย`);
    });
  }

  // ดูเป้าหมาย
  static getGoals(req, res) {
    const HN = req.params.HN;
    
    PTDataModel.getGoals(HN, (err, goals) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("ptDataGoals", {
        title: "เป้าหมายการรักษา",
        HN: HN,
        goals: goals || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดตความก้าวหน้าเป้าหมาย
  static updateGoalProgress(req, res) {
    const goalId = req.params.goalId;
    const { progress } = req.body;

    PTDataModel.updateGoalProgress(goalId, progress, (err, result) => {
      if (err) {
        return res.redirect(`/ptDataGoals/${req.params.HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/ptDataGoals/${req.params.HN}?success=อัปเดตความก้าวหน้าเรียบร้อย`);
    });
  }
}

module.exports = PTDataController;