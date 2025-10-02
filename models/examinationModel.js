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

    const values = [
      data.HN,
      data.patientName,
      data.observation || '',
      data.palpation || '',
      JSON.stringify(data.rom || {}),
      JSON.stringify(data.mmt || {}),
      JSON.stringify(data.accessory || {}),
      JSON.stringify(data.sensory || {}),
      JSON.stringify(data.reflex || {}),
      JSON.stringify(data.transfer || {}),
      JSON.stringify(data.ambulation || {}),
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
}

module.exports = ExaminationModel;
