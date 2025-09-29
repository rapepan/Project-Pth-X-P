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

  // บันทึกข้อมูลการตรวจร่างกาย - เพิ่มใหม่
  static createExaminationRecord(data, callback) {
    const {
      HN, patientName, age, gender, observation, palpation,
      rom, wnl, limited, mmt, weakness, accessoryMovement,
      normal, hypomobility, hypermobility, sensoryTest,
      deepTendonReflex, transferAmbulation, notes
    } = data;

    // ตรวจสอบว่าตาราง patient_examination มีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS patient_examination (
        id INT AUTO_INCREMENT PRIMARY KEY,
        HN VARCHAR(10) NOT NULL,
        patient_name VARCHAR(255),
        age INT,
        gender VARCHAR(10),
        observation TEXT,
        palpation TEXT,
        rom BOOLEAN DEFAULT FALSE,
        wnl BOOLEAN DEFAULT FALSE,
        limited_movement BOOLEAN DEFAULT FALSE,
        mmt BOOLEAN DEFAULT FALSE,
        weakness BOOLEAN DEFAULT FALSE,
        accessory_movement BOOLEAN DEFAULT FALSE,
        normal_movement BOOLEAN DEFAULT FALSE,
        hypomobility TEXT,
        hypermobility TEXT,
        sensory_test TEXT,
        deep_tendon_reflex TEXT,
        transfer_ambulation TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_hn (HN),
        FOREIGN KEY (HN) REFERENCES patient(HN) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;

    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("Error creating examination table:", err);
        return callback(err);
      }

      // บันทึกข้อมูลการตรวจร่างกาย
      const insertQuery = `
        INSERT INTO patient_examination (
          HN, patient_name, age, gender, observation, palpation,
          rom, wnl, limited_movement, mmt, weakness, accessory_movement,
          normal_movement, hypomobility, hypermobility, sensory_test,
          deep_tendon_reflex, transfer_ambulation, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        HN, patientName, age, gender, observation, palpation,
        rom || false, wnl || false, limited || false, mmt || false,
        weakness || false, accessoryMovement || false, normal || false,
        hypomobility || '', hypermobility || '', sensoryTest || '',
        deepTendonReflex || '', transferAmbulation || '', notes || ''
      ];

      db.query(insertQuery, values, callback);
    });
  }

  // ดึงข้อมูลการตรวจร่างกายล่าสุด
  static getLatestExaminationRecord(HN, callback) {
    const query = "SELECT * FROM patient_examination WHERE HN = ? ORDER BY id DESC LIMIT 1";
    db.query(query, [HN], callback);
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