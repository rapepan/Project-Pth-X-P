const db = require('../config/db');

class ProcedureModel {

  // บันทึกหัตถการ
  static createProcedure(data, callback) {
    const insertQuery = `
      INSERT INTO procedures (
        HN, patient_name, procedure_date,
        procedure_code, procedure_name,
        technique, duration_minutes,
        therapist_name, notes, effectiveness, created_by, session_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patient_name,
      data.procedure_date || new Date(),
      data.procedure_code || '',
      data.procedure_name || '',
      data.technique || '',
      data.duration_minutes || 0,
      data.therapist_name || null,
      data.notes || '',
      data.effectiveness || 'unknown',
      data.created_by || null,
      data.session_count || 1
    ];

    db.query(insertQuery, values, callback);
  }

  // อัปเดตหัตถการ
  static updateProcedure(id, data, callback) {
    const updateQuery = `
      UPDATE procedures
      SET
        procedure_name = ?,
        technique = ?,
        duration_minutes = ?,
        therapist_name = ?,
        notes = ?,
        effectiveness = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.procedureName || '',
      data.technique || '',
      data.durationMinutes || 0,
      data.therapistName || null,
      data.notes || '',
      data.effectiveness || 'unknown',
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ดึงข้อมูลหัตถการตาม ID
  static getProcedureById(id, callback) {
    const query = `
      SELECT p.*, 
             u.fullname as created_by_name
      FROM procedures p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      
      callback(null, results);
    });
  }

  // ดึงประวัติหัตถการทั้งหมด
  static getAllProcedureHistory(HN, callback) {
    const query = `
      SELECT p.*, 
             u.fullname as created_by_name
      FROM procedures p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.HN = ?
      ORDER BY p.procedure_date DESC, p.created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      callback(null, results);
    });
  }

  // ดึงหัตถการล่าสุด
  static getLatestProcedure(HN, callback) {
    const query = `
      SELECT p.*, 
             u.fullname as created_by_name
      FROM procedures p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.HN = ?
      ORDER BY p.procedure_date DESC, p.created_at DESC
      LIMIT 1
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      callback(null, results);
    });
  }

  // ลบหัตถการ
  static deleteProcedure(id, callback) {
    const query = `DELETE FROM procedures WHERE id = ?`;
    db.query(query, [id], callback);
  }

  // สถิติหัตถการ
  static getProcedureStatistics(HN, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalProcedures,
        COUNT(DISTINCT procedure_name) as uniqueTypes,
        SUM(duration_minutes) as totalDuration,
        AVG(duration_minutes) as avgDuration,
        DATE_FORMAT(MIN(procedure_date), '%Y-%m-%d') as firstProcedure,
        DATE_FORMAT(MAX(procedure_date), '%Y-%m-%d') as lastProcedure
      FROM procedures
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // หัตถการยอดนิยม
  static getPopularProcedures(limit = 20, callback) {
    const query = `
      SELECT procedure_name, COUNT(*) as usage_count
      FROM procedures
      WHERE procedure_name != ''
      GROUP BY procedure_name
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    db.query(query, [limit], callback);
  }

  // ดึง template หัตถการ
  static getProcedureTemplates(userId, callback) {
    const query = `
      SELECT * FROM procedure_templates
      WHERE created_by = ? OR is_public = true
      ORDER BY usage_count DESC, name ASC
    `;
    db.query(query, [userId], callback);
  }

  // บันทึก template หัตถการ
  static saveProcedureTemplate(data, callback) {
    const insertQuery = `
      INSERT INTO procedure_templates (
        name, procedure_type, technique,
        equipment_used, duration_minutes, procedure_details,
        created_by, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.name,
      data.procedureType || '',
      data.technique || '',
      JSON.stringify(data.equipmentUsed || []),
      data.durationMinutes || 0,
      data.procedureDetails || '',
      data.userId,
      data.isPublic || false
    ];

    db.query(insertQuery, values, callback);
  }

  // ดึงข้อมูลหัตถการของผู้ป่วย
  static getPatientProcedures(HN, callback) {
    const query = `
      SELECT * FROM procedures 
      WHERE HN = ? 
      ORDER BY procedure_date DESC
    `;
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  // ดึงประวัติหัตถการของผู้ป่วย
  static getPatientProcedureHistory(HN, callback) {
    const query = `
      SELECT * FROM procedures 
      WHERE HN = ? 
      ORDER BY procedure_date DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงเทมเพลตหัตถการ
  static getProcedureTemplates(callback) {
    const query = `
      SELECT * FROM procedure_templates 
      ORDER BY procedure_name
    `;
    db.query(query, callback);
  }

  // บันทึกเทมเพลตหัตถการ
  static saveProcedureTemplate(data, callback) {
    const insertQuery = `
      INSERT INTO procedure_templates (
        procedure_name, procedure_type,
        technique, equipment_used, duration_minutes,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.procedureName,
      data.procedureType,
      data.technique,
      JSON.stringify(data.equipmentUsed || []),
      data.durationMinutes,
      data.notes
    ];

    db.query(insertQuery, values, callback);
  }

  // นับจำนวนครั้งการรักษา
  static getTreatmentSessionCount(HN, callback) {
    const query = `
      SELECT COUNT(*) as current_session
      FROM procedures
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // ตรวจสอบหัตถการเดิม
  static checkExistingProcedure(HN, procedureName, callback) {
    const query = `
      SELECT * FROM procedures 
      WHERE HN = ? AND procedure_name = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    db.query(query, [HN, procedureName], (err, results) => {
      if (err) return callback(err);
      callback(null, results.length > 0 ? results[0] : null);
    });
  }

  // อัปเดตจำนวนครั้งของหัตถการ (ใช้ session_count)
  static updateProcedureSessionCount(id, newSessionCount, updatedNotes, callback) {
    const query = `
      UPDATE procedures
      SET
        session_count = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    db.query(query, [newSessionCount, updatedNotes, id], callback);
  }

  // ดึงข้อมูลหัตถการตามวันที่
  static getProceduresByDate(HN, date, callback) {
    const query = `
      SELECT p.*, 
             u.fullname as created_by_name
      FROM procedures p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.HN = ? AND DATE(p.procedure_date) = ?
      ORDER BY p.created_at ASC
    `;
    db.query(query, [HN, date], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
}

module.exports = ProcedureModel;