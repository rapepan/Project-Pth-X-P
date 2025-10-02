const db = require('../config/db');

class MedicalModel {
  // บันทึกข้อมูลการซักประวัติ
  static createMedicalRecord(data, callback) {
    const {
      HN, fname, lname, weight, height, bloodPressure, pulse,
      o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory
    } = data;

    const query = `
      INSERT INTO medicalfrom (
        HN, fname, lname, weight, height, bloodPressure, pulse,
        o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      HN, fname, lname, weight, height, bloodPressure, pulse,
      o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory
    ];

    db.query(query, values, callback);
  }

  // ดึงประวัติการรักษาล่าสุด
  static getLatestMedicalHistory(HN, callback) {
    const query = "SELECT * FROM medicalfrom WHERE HN = ? ORDER BY id DESC LIMIT 1";
    db.query(query, [HN], callback);
  }

  // ดึงประวัติการรักษาทั้งหมด
  static getAllMedicalHistory(HN, callback) {
    const query = "SELECT * FROM medicalfrom WHERE HN = ? ORDER BY created_at DESC";
    db.query(query, [HN], callback);
  }

  // ดึงประวัติการรักษาตามวันที่
  static getMedicalHistoryByDate(HN, date, callback) {
    const query = `
      SELECT * FROM medicalfrom 
      WHERE HN = ? 
      AND DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d') = ?
      ORDER BY created_at DESC
    `;
    db.query(query, [HN, date], callback);
  }

  // ดึงวันที่ทั้งหมดที่มีประวัติการรักษา
  static getAvailableDates(HN, callback) {
    const query = `
      SELECT DISTINCT DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d') as visitDate
      FROM medicalfrom
      WHERE HN = ?
      ORDER BY visitDate DESC
    `;
    db.query(query, [HN], callback);
  }
}

module.exports = MedicalModel;  