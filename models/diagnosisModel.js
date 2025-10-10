const db = require('../config/db');

class DiagnosisModel {

  // บันทึกการวินิจฉัย
  static createDiagnosis(data, callback) {
    const insertQuery = `
      INSERT INTO diagnosis (
        HN, patient_name, diagnosis_date,
        chief_complaint, present_illness, past_history,
        icd10_code, icd10_description, diagnosis_type,
        severity, prognosis, treatment_plan,
        special_considerations, created_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patientName,
      data.diagnosisDate || new Date(),
      data.chiefComplaint || '',
      data.presentIllness || '',
      data.pastHistory || '',
      data.icd10Code || '',
      data.icd10Description || '',
      data.diagnosisType || 'primary',
      data.severity || 'moderate',
      data.prognosis || '',
      data.treatmentPlan || '',
      data.specialConsiderations || '',
      data.createdBy || null,
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // อัปเดตการวินิจฉัย
  static updateDiagnosis(id, data, callback) {
    const updateQuery = `
      UPDATE diagnosis
      SET 
        chief_complaint = ?,
        present_illness = ?,
        past_history = ?,
        icd10_code = ?,
        icd10_description = ?,
        diagnosis_type = ?,
        severity = ?,
        prognosis = ?,
        treatment_plan = ?,
        special_considerations = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.chiefComplaint || '',
      data.presentIllness || '',
      data.pastHistory || '',
      data.icd10Code || '',
      data.icd10Description || '',
      data.diagnosisType || 'primary',
      data.severity || 'moderate',
      data.prognosis || '',
      data.treatmentPlan || '',
      data.specialConsiderations || '',
      data.notes || '',
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ดึงข้อมูลการวินิจฉัยตาม ID
  static getDiagnosisById(id, callback) {
    const query = `
      SELECT d.*, u.fullname as doctor_name
      FROM diagnosis d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = ?
    `;
    db.query(query, [id], callback);
  }

  // ดึงประวัติการวินิจฉัยทั้งหมด
  static getAllDiagnosisHistory(HN, callback) {
    const query = `
      SELECT d.*, u.fullname as doctor_name
      FROM diagnosis d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.HN = ?
      ORDER BY d.diagnosis_date DESC, d.created_at DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงการวินิจฉัยล่าสุด
  static getLatestDiagnosis(HN, callback) {
    const query = `
      SELECT d.*, u.fullname as doctor_name
      FROM diagnosis d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.HN = ?
      ORDER BY d.diagnosis_date DESC, d.created_at DESC
      LIMIT 1
    `;
    db.query(query, [HN], callback);
  }

  // ค้นหา ICD-10
  static searchICD10(searchTerm, callback) {
    const query = `
      SELECT * FROM icd10_codes
      WHERE code LIKE ? OR description LIKE ?
      LIMIT 50
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern], callback);
  }

  // ดึงรหัส ICD-10 ที่ใช้บ่อย
  static getFrequentICD10(limit = 20, callback) {
    const query = `
      SELECT icd10_code, icd10_description, COUNT(*) as usage_count
      FROM diagnosis
      WHERE icd10_code != ''
      GROUP BY icd10_code, icd10_description
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    db.query(query, [limit], callback);
  }

  // ลบการวินิจฉัย
  static deleteDiagnosis(id, callback) {
    const query = `DELETE FROM diagnosis WHERE id = ?`;
    db.query(query, [id], callback);
  }

  // สถิติการวินิจฉัย
  static getDiagnosisStatistics(HN, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalDiagnoses,
        COUNT(DISTINCT icd10_code) as uniqueDiagnoses,
        DATE_FORMAT(MIN(diagnosis_date), '%Y-%m-%d') as firstDiagnosis,
        DATE_FORMAT(MAX(diagnosis_date), '%Y-%m-%d') as lastDiagnosis
      FROM diagnosis
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // สรุปการวินิจฉัยรายเดือน
  static getMonthlySummary(year, month, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalDiagnoses,
        COUNT(DISTINCT HN) as uniquePatients,
        diagnosis_type,
        COUNT(*) as typeCount
      FROM diagnosis
      WHERE YEAR(diagnosis_date) = ? AND MONTH(diagnosis_date) = ?
      GROUP BY diagnosis_type
    `;
    db.query(query, [year, month], callback);
  }
}

module.exports = DiagnosisModel;