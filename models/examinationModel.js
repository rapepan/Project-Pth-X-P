const db = require('../config/db');

class ExaminationModel {

  // บันทึกข้อมูลการตรวจร่างกาย
  static createExaminationRecord(data, callback) {
    const insertQuery = `
      INSERT INTO patient_examination (
        HN, patient_name,
        observation, palpation,
        rom, mmt, accessory, sensory, reflex,
        transfer, ambulation, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // สร้างข้อมูล JSON สำหรับแต่ละส่วน
    const romData = {
      wnl: data.rom_wnl || 0,
      weakness: data.rom_weakness || 0,
      notes: data.rom_notes || ''
    };

    const mmtData = {
      normal: data.mmt_normal || 0,
      limited: data.mmt_limited || 0,
      notes: data.mmt_notes || ''
    };

    const accessoryData = {
      normal: data.accessory_normal || 0,
      hypermobility: data.accessory_hypermobility || 0,
      notes: data.accessory_notes || ''
    };

    const sensoryData = {
      pinprick: data.pinprick || 0,
      light_touch: data.light_touch || 0,
      notes: data.sensory_test || ''
    };

    const reflexData = {
      normal: data.normal_reflex || 0,
      abnormal: data.abnormal_reflex || 0,
      notes: data.deep_tendon_reflex || ''
    };

    const transferData = {
      independent: data.transfer_independent || 0,
      dependent: data.transfer_dependent || 0,
      notes: data.transfer_notes || ''
    };

    const ambulationData = {
      independent: data.ambulation_independent || 0,
      dependent: data.ambulation_dependent || 0,
      notes: data.ambulation_notes || ''
    };

    const values = [
      data.HN,
      data.patient_name,
      data.observation || '',
      data.palpation || '',
      JSON.stringify(romData),
      JSON.stringify(mmtData),
      JSON.stringify(accessoryData),
      JSON.stringify(sensoryData),
      JSON.stringify(reflexData),
      JSON.stringify(transferData),
      JSON.stringify(ambulationData),
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // อัพเดทข้อมูลการตรวจร่างกาย
  static updateExaminationRecord(id, data, callback) {
    const updateQuery = `
      UPDATE patient_examination
      SET 
        observation = ?,
        palpation = ?,
        rom = ?,
        mmt = ?,
        accessory = ?,
        sensory = ?,
        reflex = ?,
        transfer = ?,
        ambulation = ?,
        notes = ?
      WHERE id = ?
    `;

    const values = [
      data.observation || '',
      data.palpation || '',
      JSON.stringify(data.rom || {}),
      JSON.stringify(data.mmt || {}),
      JSON.stringify(data.accessory || {}),
      JSON.stringify(data.sensory || {}),
      JSON.stringify(data.reflex || {}),
      JSON.stringify(data.transfer || {}),
      JSON.stringify(data.ambulation || {}),
      data.notes || '',
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ✅ ดึงข้อมูลจะต้อง parse JSON
  static getExaminationById(id, callback) {
    const query = `SELECT * FROM patient_examination WHERE id = ?`;
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0) {
        const record = results[0];
        ["rom", "mmt", "accessory", "sensory", "reflex", "transfer", "ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
        return callback(null, [record]);
      }
      callback(null, []);
    });
  }

  // ดึงข้อมูลอื่น ๆ ใช้ logic parse JSON แบบเดียวกัน
  static getAllExaminationHistory(HN, callback) {
    const query = `SELECT * FROM patient_examination WHERE HN = ? ORDER BY created_at DESC`;
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }

  // Alias for getAllExaminationHistory (for compatibility)
  static getPatientExaminationHistory(HN, callback) {
    return this.getAllExaminationHistory(HN, callback);
  }

  // ดึงข้อมูลการตรวจร่างกายล่าสุด
  static getLatestExaminationRecord(HN, callback) {
    const query = `SELECT * FROM patient_examination WHERE HN = ? ORDER BY created_at DESC LIMIT 1`;
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0) {
        const record = results[0];
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      }
      callback(null, results);
    });
  }

  // ดึงข้อมูลการตรวจร่างกายตามวันที่
  static getExaminationByDate(HN, date, callback) {
    const query = `
      SELECT * FROM patient_examination 
      WHERE HN = ? 
      AND DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d') = ?
      ORDER BY created_at DESC
    `;
    db.query(query, [HN, date], (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }

  // ดึงวันที่ที่มีการตรวจร่างกาย
  static getAvailableExaminationDates(HN, callback) {
    const query = `
      SELECT DISTINCT DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d') as visitDate
      FROM patient_examination
      WHERE HN = ?
      ORDER BY visitDate DESC
    `;
    db.query(query, [HN], callback);
  }

  // ค้นหาการตรวจร่างกาย
  static searchExamination(searchTerm, callback) {
    const query = `
      SELECT * FROM patient_examination 
      WHERE patient_name LIKE ? 
      OR observation LIKE ? 
      OR palpation LIKE ?
      ORDER BY created_at DESC
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern, searchPattern], (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }

  // สถิติการตรวจร่างกาย
  static getExaminationStatistics(HN, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalExaminations,
        DATE_FORMAT(MIN(created_at), '%Y-%m-%d') as firstExamination,
        DATE_FORMAT(MAX(created_at), '%Y-%m-%d') as lastExamination
      FROM patient_examination 
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // ลบข้อมูลการตรวจร่างกาย
  static deleteExaminationRecord(examId, callback) {
    const query = `DELETE FROM patient_examination WHERE id = ?`;
    db.query(query, [examId], callback);
  }

  // เปรียบเทียบการตรวจร่างกาย
  static compareExaminations(exam1, exam2, callback) {
    const query = `SELECT * FROM patient_examination WHERE id IN (?, ?) ORDER BY created_at ASC`;
    db.query(query, [exam1, exam2], (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }

  // ดึงข้อมูลสำหรับ export
  static getExaminationForExport(HN, startDate, endDate, callback) {
    let query = `SELECT * FROM patient_examination WHERE HN = ?`;
    let params = [HN];
    
    if (startDate && endDate) {
      query += ` AND DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d') BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }

  // สรุปรายเดือน
  static getMonthlySummary(year, month, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalExaminations,
        COUNT(DISTINCT HN) as uniquePatients
      FROM patient_examination 
      WHERE YEAR(CONVERT_TZ(created_at, @@session.time_zone, '+07:00')) = ?
      AND MONTH(CONVERT_TZ(created_at, @@session.time_zone, '+07:00')) = ?
    `;
    db.query(query, [year, month], callback);
  }

  // สรุปรายปี
  static getYearlySummary(year, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalExaminations,
        COUNT(DISTINCT HN) as uniquePatients,
        MONTH(CONVERT_TZ(created_at, @@session.time_zone, '+07:00')) as month,
        COUNT(*) as monthlyCount
      FROM patient_examination 
      WHERE YEAR(CONVERT_TZ(created_at, @@session.time_zone, '+07:00')) = ?
      GROUP BY MONTH(CONVERT_TZ(created_at, @@session.time_zone, '+07:00'))
      ORDER BY month
    `;
    db.query(query, [year], callback);
  }

  // ดึง templates (placeholder - would need templates table)
  static getExaminationTemplates(userId, callback) {
    // This would require a templates table
    callback(null, []);
  }

  // บันทึก template (placeholder - would need templates table)
  static saveExaminationTemplate(templateData, callback) {
    // This would require a templates table
    callback(null, { insertId: 1 });
  }

  // ดึงข้อมูลการตรวจร่างกายของผู้ป่วย
  static getPatientExaminations(HN, callback) {
    const query = `
      SELECT * FROM patient_examination 
      WHERE HN = ? 
      ORDER BY created_at DESC
    `;
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }

  // ดึงความก้าวหน้าผู้ป่วย
  static getPatientProgress(HN, limit, callback) {
    const query = `
      SELECT * FROM patient_examination 
      WHERE HN = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    db.query(query, [HN, limit], (err, results) => {
      if (err) return callback(err);
      results.forEach(record => {
        ["rom","mmt","accessory","sensory","reflex","transfer","ambulation"]
          .forEach(field => {
            if (record[field]) {
              try { record[field] = JSON.parse(record[field]); }
              catch { record[field] = {}; }
            }
          });
      });
      callback(null, results);
    });
  }
}

module.exports = ExaminationModel;
