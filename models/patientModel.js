const db = require('../config/db');

class PatientModel {
  // ค้นหาผู้ป่วยทั้งหมด
  static getAllPatients(callback) {
    // ตรวจสอบว่าตาราง patient มีคอลัมน์ created_at หรือไม่
    const checkColumnQuery = "SHOW COLUMNS FROM patient LIKE 'created_at'";
    db.query(checkColumnQuery, (err, results) => {
      if (err) return callback(err);
      
      let orderBy = "HN DESC"; // default order by HN
      if (results.length > 0) {
        orderBy = "created_at DESC"; // ถ้ามี created_at ให้ใช้
      }
      
      const query = `SELECT * FROM patient ORDER BY ${orderBy}`;
      db.query(query, callback);
    });
  }

  // ค้นหาผู้ป่วยตามเงื่อนไข
  static searchPatients(searchType, searchTerm, callback) {
    const validSearchTypes = ["HN", "fname", "national_id"];
    
    if (!validSearchTypes.includes(searchType)) {
      return callback(new Error('Invalid search type'));
    }

    // ตรวจสอบว่าตาราง patient มีคอลัมน์ created_at หรือไม่
    const checkColumnQuery = "SHOW COLUMNS FROM patient LIKE 'created_at'";
    db.query(checkColumnQuery, (err, results) => {
      if (err) return callback(err);
      
      let orderBy = "HN DESC"; // default order by HN
      if (results.length > 0) {
        orderBy = "created_at DESC"; // ถ้ามี created_at ให้ใช้
      }
      
      const query = `SELECT * FROM patient WHERE ${searchType} LIKE ? ORDER BY ${orderBy}`;
      db.query(query, [`%${searchTerm}%`], callback);
    });
  }

  // ค้นหาผู้ป่วยตาม HN
  static getPatientByHN(HN, callback) {
    const query = "SELECT * FROM patient WHERE HN = ?";
    db.query(query, [HN], callback);
  }

  // เพิ่มผู้ป่วยใหม่
  static createPatient(patientData, callback) {
    const {
      HN, fname, lname, national_id, gender, phone, age, dob, allergy_history,
      chronic_diseases, housenumber, moo, soi, subdistrict, district,
      province, postcode, emergency_fname, emergency_lname, emergency_phone, relationships
    } = patientData;

    // ตรวจสอบว่าตาราง patient มีคอลัมน์ created_at หรือไม่
    const checkColumnQuery = "SHOW COLUMNS FROM patient LIKE 'created_at'";
    db.query(checkColumnQuery, (err, results) => {
      if (err) return callback(err);
      
      let query, values;
      
      if (results.length > 0) {
        // ถ้ามี created_at ให้ใส่ field นี้ด้วย (ใช้ DEFAULT จะใส่เวลาปัจจุบันอัตโนมัติ)
        query = `
          INSERT INTO patient (
            HN, fname, lname, national_id, gender, phone, age, dob, allergy_history,
            chronic_diseases, housenumber, moo, soi, subdistrict, district, province,
            postcode, emergency_fname, emergency_lname, emergency_phone, relationships
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      } else {
        query = `
          INSERT INTO patient (
            HN, fname, lname, national_id, gender, phone, age, dob, allergy_history,
            chronic_diseases, housenumber, moo, soi, subdistrict, district, province,
            postcode, emergency_fname, emergency_lname, emergency_phone, relationships
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      }

      values = [
        HN, fname, lname, national_id, gender, phone, age, dob, allergy_history,
        chronic_diseases, housenumber, moo, soi, subdistrict, district, province,
        postcode, emergency_fname, emergency_lname, emergency_phone, relationships
      ];

      db.query(query, values, callback);
    });
  }

  // สร้าง HN ใหม่
  static generateHN(callback) {
    const now = new Date();
    const year = (now.getFullYear() + 543).toString().slice(-2);
    const yearPart = year;

    const query = `
      SELECT MAX(CAST(SUBSTRING(HN, 3) AS UNSIGNED)) AS maxHN 
      FROM patient 
      WHERE HN LIKE ?
    `;

    db.query(query, [`${yearPart}%`], (err, results) => {
      if (err) {
        console.error("Error generating HN:", err);
        return callback(err);
      }

      let newHN = yearPart + "0001";
      if (results[0] && results[0].maxHN !== null) {
        newHN = yearPart + String(results[0].maxHN + 1).padStart(4, "0");
      }

      callback(null, newHN);
    });
  }

  // ตรวจสอบว่ามี HN นี้อยู่แล้วหรือไม่
  static checkHNExists(HN, callback) {
    const query = "SELECT COUNT(*) as count FROM patient WHERE HN = ?";
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0].count > 0);
    });
  }

  // ตรวจสอบว่ามีรหัสบัตรประชาชนนี้อยู่แล้วหรือไม่
  static checkNationalIdExists(national_id, excludeHN = null, callback) {
    let query = "SELECT COUNT(*) as count FROM patient WHERE national_id = ?";
    let params = [national_id];

    if (excludeHN) {
      query += " AND HN != ?";
      params.push(excludeHN);
    }

    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      callback(null, results[0].count > 0);
    });
  }

  // ดึงจำนวนผู้ป่วยทั้งหมด
  static getTotalPatientsCount(callback) {
    const query = "SELECT year (CURRENT_DATE) - year (dob) FROM patient";
    db.query(query, callback);
  }

  // ดึงจำนวนผู้ป่วยที่ลงทะเบียนในวันนี้
  static getTodayPatientsCount(callback) {
    const query = "SELECT COUNT(*) as today FROM patient WHERE DATE(created_at) = CURDATE()";
    db.query(query, callback);
  }

  // ดึงจำนวนผู้ป่วยที่ลงทะเบียนในเดือนนี้
  static getThisMonthPatientsCount(callback) {
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
}

module.exports = PatientModel;  