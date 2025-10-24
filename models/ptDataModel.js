const db = require('../config/db');

class PTDataModel {

  // ดึงข้อมูลทางกายภาพบำบัดของผู้ป่วย
  static getPatientPTData(HN, callback) {
    const query = `
      SELECT pt.*, p.fname, p.lname, p.gender, p.age, p.phone, p.dob
      FROM pt_data pt
      LEFT JOIN patient p ON pt.HN = p.HN
      WHERE pt.HN = ? 
      ORDER BY pt.assessment_date DESC, pt.created_at DESC
    `;
    
    db.query(query, [HN], callback);
  }

  // สร้างข้อมูลทางกายภาพบำบัด
  static createPTData(HN, data, createdBy, callback) {
    // ดึงข้อมูลผู้ป่วยก่อน
    const getPatientQuery = `SELECT fname, lname FROM patient WHERE HN = ?`;
    
    db.query(getPatientQuery, [HN], (err, patientResult) => {
      if (err) {
        return callback(err);
      }
      
      // สร้างชื่อผู้ป่วย
      let patientName = '';
      if (patientResult.length > 0) {
        patientName = `${patientResult[0].fname} ${patientResult[0].lname}`;
      }
      
      // นับจำนวนครั้งของการประเมินประเภทเดียวกัน
      const countQuery = `
        SELECT COUNT(*) as count FROM pt_data 
        WHERE HN = ? AND assessment_type = ?
      `;
      
      db.query(countQuery, [HN, data.assessmentType], (err, countResult) => {
        if (err) {
          return callback(err);
        }
        
        // คำนวณ session_number (จำนวนครั้ง + 1)
        const sessionNumber = (countResult[0].count || 0) + 1;
        
        // บันทึกข้อมูล PT Data
        const insertQuery = `
          INSERT INTO pt_data (
            HN, patient_name, assessment_type, observations, assessment_date, assessor, session_date, session_number, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const values = [
          HN,
          patientName,
          data.assessmentType,
          data.observations || '',
          data.assessmentDate,
          data.assessor || '',
          data.assessmentDate || new Date().toISOString().split('T')[0],
          sessionNumber,
          createdBy || null
        ];

        db.query(insertQuery, values, callback);
      });
    });
  }

  // ดึงประวัติข้อมูลทางกายภาพบำบัด
  static getPatientPTDataHistory(HN, callback) {
    const query = `
      SELECT * FROM pt_data 
      WHERE HN = ? 
      ORDER BY assessment_date DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงข้อมูลตาม ID
  static getPTDataById(id, callback) {
    const query = `
      SELECT * FROM pt_data WHERE id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  }

  // อัปเดตข้อมูลทางกายภาพบำบัด
  static updatePTData(id, data, callback) {
    const updateQuery = `
      UPDATE pt_data
      SET 
        assessment_type = ?,
        observations = ?,
        assessment_date = ?,
        assessor = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.assessmentType,
      data.observations,
      data.assessmentDate,
      data.assessor,
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ดึงข้อมูลผู้ป่วย
  static getPatientInfo(HN, callback) {
    const query = `
      SELECT HN, fname, lname, gender, age, phone, dob, national_id
      FROM patient 
      WHERE HN = ?
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  }

  // ลบข้อมูลทางกายภาพบำบัด
  static deletePTData(id, callback) {
    const query = `DELETE FROM pt_data WHERE id = ?`;
    db.query(query, [id], callback);
  }

}

module.exports = PTDataModel;