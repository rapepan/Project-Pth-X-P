const BillingModel = require('../models/billingModel');

class BillingController {
  // แสดงหน้าจัดการค่าใช้จ่าย
  static showBillingPage(req, res) {
    const HN = req.params.HN;

    if (HN) {
      BillingModel.getPatientBills(HN, (err, bills) => {
        if (err) {
          return res.status(500).render('error', {
            message: "ไม่สามารถดึงข้อมูลได้",
            error: err
          });
        }

        res.render("billing", {
          title: "จัดการค่าใช้จ่าย",
          HN: HN,
          patient: { HN: HN },
          bills: bills || [],
          success: req.query.success,
          error: req.query.error
        });
      });
    } else {
      res.render("billing", {
        title: "จัดการค่าใช้จ่าย",
        HN: null,
        patient: null,
        bills: [],
        success: req.query.success,
        error: req.query.error
      });
    }
  }

  // สร้างใบเสร็จใหม่
  static createBill(req, res) {
    const HN = req.params.HN;
    const billData = req.body;

    BillingModel.createBill(HN, billData, (err, result) => {
      if (err) {
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing/${HN}?success=สร้างใบเสร็จเรียบร้อย`);
    });
  }

  // แสดงรายละเอียดใบเสร็จ
  static showBillDetail(req, res) {
    const billId = req.params.billId;
    
    BillingModel.getBillById(billId, (err, bill) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      if (!bill) {
        return res.status(404).render('error', { 
          message: "ไม่พบใบเสร็จ",
          error: null 
        });
      }
      
      res.render("billingDetail", {
        title: "รายละเอียดใบเสร็จ",
        bill: bill,
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดตสถานะการชำระเงิน
  static updatePaymentStatus(req, res) {
    const billId = req.params.billId;
    const { status } = req.body;

    BillingModel.updatePaymentStatus(billId, status, (err, result) => {
      if (err) {
        return res.redirect(`/billingDetail/${billId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingDetail/${billId}?success=อัปเดตสถานะเรียบร้อย`);
    });
  }

  // ยกเลิกใบเสร็จ
  static cancelBill(req, res) {
    const billId = req.params.billId;

    BillingModel.cancelBill(billId, (err, result) => {
      if (err) {
        return res.redirect(`/billingDetail/${billId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingDetail/${billId}?success=ยกเลิกใบเสร็จเรียบร้อย`);
    });
  }

  // แสดงรายการราคา
  static showPriceList(req, res) {
    BillingModel.getPriceList((err, services) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("billingPricelist", {
        title: "รายการราคา",
        services: services || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดตราคาบริการ
  static updateServicePrice(req, res) {
    const serviceId = req.params.serviceId;
    const { price } = req.body;

    BillingModel.updateServicePrice(serviceId, price, (err, result) => {
      if (err) {
        return res.redirect(`/billingPricelist?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingPricelist?success=อัปเดตราคาเรียบร้อย`);
    });
  }

  // เพิ่มบริการใหม่
  static addNewService(req, res) {
    const serviceData = req.body;

    BillingModel.addNewService(serviceData, (err, result) => {
      if (err) {
        return res.redirect(`/billingPricelist?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingPricelist?success=เพิ่มบริการเรียบร้อย`);
    });
  }

  // คำนวณส่วนลด
  static calculateDiscount(req, res) {
    const { amount, discountType, discountValue } = req.body;

    BillingModel.calculateDiscount(amount, discountType, discountValue, (err, result) => {
      if (err) {
        return res.redirect(`/billing?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing?success=คำนวณส่วนลดเรียบร้อย&discount=${result.discount}&finalAmount=${result.finalAmount}`);
    });
  }

  // ตรวจสอบประกัน
  static checkInsurance(req, res) {
    const HN = req.params.HN;

    BillingModel.checkInsurance(HN, (err, result) => {
      if (err) {
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing/${HN}?success=ตรวจสอบประกันเรียบร้อย&insurance=${JSON.stringify(result)}`);
    });
  }

  // ยื่นเคลมประกัน
  static submitInsuranceClaim(req, res) {
    const claimData = req.body;

    BillingModel.submitInsuranceClaim(claimData, (err, result) => {
      if (err) {
        return res.redirect(`/billing?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing?success=ยื่นเคลมประกันเรียบร้อย`);
    });
  }

  // รายงานรายวัน
  static getDailyReport(req, res) {
    const { date } = req.query;

    BillingModel.getDailyReport(date, (err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานรายวัน",
        type: "daily",
        data: results,
        date: date
      });
    });
  }

  // รายงานรายเดือน
  static getMonthlyReport(req, res) {
    const { year, month } = req.query;

    BillingModel.getMonthlyReport(year, month, (err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานรายเดือน",
        type: "monthly",
        data: results,
        year: year,
        month: month
      });
    });
  }

  // รายงานรายปี
  static getYearlyReport(req, res) {
    const year = req.params.year;

    BillingModel.getYearlyReport(year, (err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานรายปี",
        type: "yearly",
        data: results,
        year: year
      });
    });
  }

  // รายงานลูกหนี้
  static getOutstandingReport(req, res) {
    BillingModel.getOutstandingReport((err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานลูกหนี้",
        type: "outstanding",
        data: results
      });
    });
  }
}

module.exports = BillingController;