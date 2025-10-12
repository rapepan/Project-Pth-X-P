const db = require('../config/db');

class ProcedureModel {

  // บันทึกหัตถการ
  static createProcedure(data, callback) {
    const insertQuery = `
      INSERT INTO procedures (
        HN, patient_name, procedure_date,
        procedure_code, procedure_name,
        body_part, technique,
        duration_minutes,
        therapist_name, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patient_name,
      data.procedure_date || new Date(),
      data.procedure_code || '',
      data.procedure_name || '',
      data.body_part || '',
      data.technique || '',
      data.duration_minutes || 0,
      data.therapist_name || null, // เก็บชื่อผู้ทำการรักษา
      data.notes || '',
      data.created_by || null
    ];

    db.query(insertQuery, values, callback);
  }

  // อัปเดตหัตถการ
  static updateProcedure(id, data, callback) {
    const updateQuery = `
      UPDATE procedures
      SET 
        procedure_name = ?,
        procedure_type = ?,
        body_part = ?,
        technique = ?,
        equipment_used = ?,
        duration_minutes = ?,
        pre_procedure_notes = ?,
        procedure_details = ?,
        post_procedure_notes = ?,
        complications = ?,
        follow_up_required = ?,
        follow_up_date = ?,
        treatment_session = ?,
        total_sessions = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.procedureName || '',
      data.procedureType || '',
      data.bodyPart || '',
      data.technique || '',
      JSON.stringify(data.equipmentUsed || []),
      data.durationMinutes || 0,
      data.preProcedureNotes || '',
      data.procedureDetails || '',
      data.postProcedureNotes || '',
      data.complications || '',
      data.followUpRequired || false,
      data.followUpDate || null,
      data.treatmentSession || 1,
      data.totalSessions || 1,
      data.notes || '',
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ดึงข้อมูลหัตถการตาม ID
  static getProcedureById(id, callback) {
    const query = `
      SELECT p.*, 
             u1.fullname as performer_name,
             u2.fullname as assistant_name
      FROM procedures p
      LEFT JOIN users u1 ON p.performed_by = u1.id
      LEFT JOIN users u2 ON p.assisted_by = u2.id
      WHERE p.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        const record = results[0];
        if (record.equipment_used) {
          try {
            record.equipment_used = JSON.parse(record.equipment_used);
          } catch {
            record.equipment_used = [];
          }
        }
      }
      
      callback(null, results);
    });
  }

  // ดึงประวัติหัตถการทั้งหมด
  static getAllProcedureHistory(HN, callback) {
    const query = `
      SELECT p.*, 
             u1.fullname as performer_name,
             u2.fullname as assistant_name
      FROM procedures p
      LEFT JOIN users u1 ON p.performed_by = u1.id
      LEFT JOIN users u2 ON p.assisted_by = u2.id
      WHERE p.HN = ?
      ORDER BY p.procedure_date DESC, p.created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        if (record.equipment_used) {
          try {
            record.equipment_used = JSON.parse(record.equipment_used);
          } catch {
            record.equipment_used = [];
          }
        }
      });
      
      callback(null, results);
    });
  }

  // ดึงหัตถการล่าสุด
  static getLatestProcedure(HN, callback) {
    const query = `
      SELECT p.*, 
             u1.fullname as performer_name,
             u2.fullname as assistant_name
      FROM procedures p
      LEFT JOIN users u1 ON p.performed_by = u1.id
      LEFT JOIN users u2 ON p.assisted_by = u2.id
      WHERE p.HN = ?
      ORDER BY p.procedure_date DESC, p.created_at DESC
      LIMIT 1
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        const record = results[0];
        if (record.equipment_used) {
          try {
            record.equipment_used = JSON.parse(record.equipment_used);
          } catch {
            record.equipment_used = [];
          }
        }
      }
      
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
        COUNT(DISTINCT procedure_type) as uniqueTypes,
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
      SELECT procedure_name, procedure_type, COUNT(*) as usage_count
      FROM procedures
      WHERE procedure_name != ''
      GROUP BY procedure_name, procedure_type
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
        name, procedure_type, body_part, technique,
        equipment_used, duration_minutes, procedure_details,
        created_by, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.name,
      data.procedureType || '',
      data.bodyPart || '',
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
      results.forEach(record => {
        if (record.equipment_used) {
          try { 
            record.equipment_used = JSON.parse(record.equipment_used); 
          } catch { 
            record.equipment_used = []; 
          }
        }
      });
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
        procedure_name, procedure_type, body_part,
        technique, equipment_used, duration_minutes,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.procedureName,
      data.procedureType,
      data.bodyPart,
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
      SELECT MAX(treatment_session) as current_session
      FROM procedures
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }
}

module.exports = ProcedureModel;