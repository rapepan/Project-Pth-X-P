const db = require('../config/db');

class StatsModel {
  // ดึงจำนวนผู้ป่วยทั้งหมด
  static getTotalPatientsCount(callback) {
    const query = "SELECT COUNT(*) as total FROM patient";
    db.query(query, callback);
  }

  // ดึงจำนวนการตรวจร่างกายในวันนี้
  static getTodayExaminationsCount(callback) {
    const query = "SELECT COUNT(*) as today FROM patient_examination WHERE DATE(created_at) = CURDATE()";
    db.query(query, callback);
  }

  // ดึงจำนวนการตรวจร่างกายในเดือนนี้
  static getThisMonthExaminationsCount(callback) {
    const query = "SELECT COUNT(*) as thisMonth FROM patient_examination WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
    db.query(query, callback);
  }


  // ดึงจำนวนใบเสร็จในวันนี้
  static getTodayBillingCount(callback) {
    const query = "SELECT COUNT(*) as today FROM billing WHERE DATE(bill_date) = CURDATE()";
    db.query(query, callback);
  }

  // ดึงจำนวนใบเสร็จในเดือนนี้
  static getThisMonthBillingCount(callback) {
    const query = "SELECT COUNT(*) as thisMonth FROM billing WHERE YEAR(bill_date) = YEAR(CURDATE()) AND MONTH(bill_date) = MONTH(CURDATE())";
    db.query(query, callback);
  }

  // ดึงจำนวนใบเสร็จทั้งหมด
  static getTotalBillingCount(callback) {
    const query = "SELECT COUNT(*) as total FROM billing";
    db.query(query, callback);
  }

  // ดึงรายได้เดือนนี้ (รวมเฉพาะใบเสร็จที่ชำระเงินแล้ว)
  static getThisMonthRevenue(callback) {
    const query = "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM billing WHERE YEAR(bill_date) = YEAR(CURDATE()) AND MONTH(bill_date) = MONTH(CURDATE()) AND payment_status = 'paid'";
    db.query(query, callback);
  }

  // ดึงจำนวนผู้ป่วยที่ลงทะเบียนในวันนี้
  static getTodayNewPatientsCount(callback) {
    const query = "SELECT COUNT(*) as today FROM patient WHERE DATE(created_at) = CURDATE()";
    db.query(query, callback);
  }

  // ดึงจำนวนผู้ป่วยที่ลงทะเบียนในเดือนนี้
  static getThisMonthNewPatientsCount(callback) {
    const query = "SELECT COUNT(*) as thisMonth FROM patient WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
    db.query(query, callback);
  }

  // ดึงสถิติผู้ป่วยรายเดือน (12 เดือนล่าสุด)
  static getMonthlyPatientsStats(callback) {
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM patient 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    db.query(query, callback);
  }

  // ดึงสถิติการตรวจรายเดือน (12 เดือนล่าสุด)
  static getMonthlyExaminationsStats(callback) {
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM patient_examination 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    db.query(query, callback);
  }

  // ดึงสถิติรายได้รายเดือน (12 เดือนล่าสุด) - เฉพาะบิลที่ชำระเงินแล้ว
  static getMonthlyRevenueStats(callback) {
    const query = `
      SELECT 
        DATE_FORMAT(bill_date, '%Y-%m') as month,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM billing 
      WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      AND payment_status = 'paid'
      GROUP BY DATE_FORMAT(bill_date, '%Y-%m')
      ORDER BY month ASC
    `;
    db.query(query, callback);
  }

  // ดึงข้อมูลสถิติทั้งหมดสำหรับหน้าแรก
  static getAllStats(callback) {
    const stats = {};
    let completed = 0;
    const total = 8; // จำนวนฟังก์ชันที่จะเรียก (เพิ่มรายได้รายเดือน)

    const checkComplete = () => {
      completed++;
      if (completed === total) {
        callback(null, stats);
      }
    };

    // ดึงจำนวนผู้ป่วยใหม่ในเดือนนี้
    this.getThisMonthNewPatientsCount((err, result) => {
      if (err) return callback(err);
      stats.thisMonthNewPatients = result[0].thisMonth;
      checkComplete();
    });

    // ดึงจำนวนผู้ป่วยทั้งหมด
    this.getTotalPatientsCount((err, result) => {
      if (err) return callback(err);
      stats.totalPatients = result[0].total;
      checkComplete();
    });

    // ดึงจำนวนการตรวจในวันนี้ (นัดหมายวันนี้)
    this.getTodayExaminationsCount((err, result) => {
      if (err) return callback(err);
      stats.todayExaminations = result[0].today;
      checkComplete();
    });

    // ดึงจำนวนการตรวจในเดือนนี้ (การรักษาเดือนนี้)
    this.getThisMonthExaminationsCount((err, result) => {
      if (err) return callback(err);
      stats.thisMonthExaminations = result[0].thisMonth;
      checkComplete();
    });

    // ดึงรายได้เดือนนี้
    this.getThisMonthRevenue((err, result) => {
      if (err) return callback(err);
      stats.thisMonthRevenue = result[0].revenue;
      checkComplete();
    });

    // ดึงจำนวนใบเสร็จทั้งหมด
    this.getTotalBillingCount((err, result) => {
      if (err) return callback(err);
      stats.totalBilling = result[0].total;
      checkComplete();
    });

    // ดึงจำนวนผู้ป่วยใหม่ในเดือนนี้ (ซ้ำ - ตามที่ระบุ)
    this.getThisMonthNewPatientsCount((err, result) => {
      if (err) return callback(err);
      stats.thisMonthNewPatientsDuplicate = result[0].thisMonth;
      checkComplete();
    });

    // ดึงข้อมูลรายได้รายเดือน
    this.getMonthlyRevenueStats((err, result) => {
      if (err) return callback(err);
      stats.monthlyRevenue = result || [];
      checkComplete();
    });
  }
}

module.exports = StatsModel;
