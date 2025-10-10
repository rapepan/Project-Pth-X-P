const db = require('../config/db');

class PTDataModel {

  // บันทึกข้อมูลทางกายภาพบำบัด
  static createPTData(data, callback) {
    const insertQuery = `
      INSERT INTO pt_data (
        HN, patient_name, session_date,
        vital_signs, pain_assessment, functional_assessment,
        gait_analysis, balance_assessment, coordination_test,
        endurance_test, posture_analysis, joint_mobility,
        muscle_strength, special_tests, treatment_response,
        home_program_compliance, goals_progress, next_session_plan,
        equipment_recommendations, created_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patientName,
      data.sessionDate || new Date(),
      JSON.stringify(data.vitalSigns || {}),
      JSON.stringify(data.painAssessment || {}),
      JSON.stringify(data.functionalAssessment || {}),
      JSON.stringify(data.gaitAnalysis || {}),
      JSON.stringify(data.balanceAssessment || {}),
      JSON.stringify(data.coordinationTest || {}),
      JSON.stringify(data.enduranceTest || {}),
      JSON.stringify(data.postureAnalysis || {}),
      JSON.stringify(data.jointMobility || {}),
      JSON.stringify(data.muscleStrength || {}),
      JSON.stringify(data.specialTests || {}),
      data.treatmentResponse || '',
      data.homeProgramCompliance || 'not_assessed',
      data.goalsProgress || '',
      data.nextSessionPlan || '',
      JSON.stringify(data.equipmentRecommendations || []),
      data.createdBy || null,
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // อัปเดตข้อมูลทางกายภาพบำบัด
  static updatePTData(id, data, callback) {
    const updateQuery = `
      UPDATE pt_data
      SET 
        vital_signs = ?,
        pain_assessment = ?,
        functional_assessment = ?,
        gait_analysis = ?,
        balance_assessment = ?,
        coordination_test = ?,
        endurance_test = ?,
        posture_analysis = ?,
        joint_mobility = ?,
        muscle_strength = ?,
        special_tests = ?,
        treatment_response = ?,
        home_program_compliance = ?,
        goals_progress = ?,
        next_session_plan = ?,
        equipment_recommendations = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      JSON.stringify(data.vitalSigns || {}),
      JSON.stringify(data.painAssessment || {}),
      JSON.stringify(data.functionalAssessment || {}),
      JSON.stringify(data.gaitAnalysis || {}),
      JSON.stringify(data.balanceAssessment || {}),
      JSON.stringify(data.coordinationTest || {}),
      JSON.stringify(data.enduranceTest || {}),
      JSON.stringify(data.postureAnalysis || {}),
      JSON.stringify(data.jointMobility || {}),
      JSON.stringify(data.muscleStrength || {}),
      JSON.stringify(data.specialTests || {}),
      data.treatmentResponse || '',
      data.homeProgramCompliance || 'not_assessed',
      data.goalsProgress || '',
      data.nextSessionPlan || '',
      JSON.stringify(data.equipmentRecommendations || []),
      data.notes || '',
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // Helper function สำหรับ parse JSON fields
  static parseJSONFields(record) {
    const jsonFields = [
      'vital_signs', 'pain_assessment', 'functional_assessment',
      'gait_analysis', 'balance_assessment', 'coordination_test',
      'endurance_test', 'posture_analysis', 'joint_mobility',
      'muscle_strength', 'special_tests', 'equipment_recommendations'
    ];
    
    jsonFields.forEach(field => {
      if (record[field]) {
        try {
          record[field] = JSON.parse(record[field]);
        } catch (e) {
          console.error(`Error parsing ${field}:`, e);
          record[field] = Array.isArray(record[field]) ? [] : {};
        }
      } else {
        record[field] = field === 'equipment_recommendations' ? [] : {};
      }
    });
    
    return record;
  }

  // ดึงข้อมูลตาม ID พร้อม parse JSON
  static getPTDataById(id, callback) {
    const query = `
      SELECT pt.*, u.fullname as therapist_name, u.username
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        results[0] = PTDataModel.parseJSONFields(results[0]);
      }
      
      callback(null, results);
    });
  }

  // ดึงประวัติข้อมูลทั้งหมด
  static getAllPTDataHistory(HN, callback) {
    const query = `
      SELECT pt.*, u.fullname as therapist_name, u.username
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.HN = ?
      ORDER BY pt.session_date DESC, pt.created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        PTDataModel.parseJSONFields(record);
      });
      
      callback(null, results);
    });
  }

  // ดึงข้อมูลทางกายภาพบำบัดของผู้ป่วย
  static getPatientPTData(HN, callback) {
    const query = `
      SELECT * FROM pt_data 
      WHERE HN = ? 
      ORDER BY session_date DESC, created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        record = PTDataModel.parseJSONFields(record);
      });
      
      callback(null, results);
    });
  }

  // สร้างข้อมูลทางกายภาพบำบัด
  static createPTData(data, callback) {
    const insertQuery = `
      INSERT INTO pt_data (
        HN, patient_name, session_date, session_number,
        assessment_data, treatment_plan, progress_notes,
        pain_level, range_of_motion, strength_assessment,
        balance_assessment, functional_status, goals_achieved,
        next_session_plan, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patient_name,
      data.session_date || new Date(),
      data.session_number || 1,
      JSON.stringify(data.assessment_data || {}),
      JSON.stringify(data.treatment_plan || {}),
      data.progress_notes || '',
      data.pain_level || 0,
      JSON.stringify(data.range_of_motion || {}),
      JSON.stringify(data.strength_assessment || {}),
      JSON.stringify(data.balance_assessment || {}),
      JSON.stringify(data.functional_status || {}),
      JSON.stringify(data.goals_achieved || []),
      data.next_session_plan || '',
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // ดึงประวัติข้อมูลทางกายภาพบำบัด
  static getPatientPTDataHistory(HN, callback) {
    const query = `
      SELECT * FROM pt_data 
      WHERE HN = ? 
      ORDER BY session_date DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงข้อมูลตาม ID
  static getPTDataById(id, callback) {
    const query = `SELECT * FROM pt_data WHERE id = ?`;
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0) {
        results[0] = PTDataModel.parseJSONFields(results[0]);
      }
      callback(null, results[0] || null);
    });
  }

  // อัปเดตข้อมูลทางกายภาพบำบัด
  static updatePTData(id, data, callback) {
    const updateQuery = `
      UPDATE pt_data
      SET 
        session_date = ?,
        assessment_data = ?,
        treatment_plan = ?,
        progress_notes = ?,
        pain_level = ?,
        range_of_motion = ?,
        strength_assessment = ?,
        balance_assessment = ?,
        functional_status = ?,
        goals_achieved = ?,
        next_session_plan = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.session_date,
      JSON.stringify(data.assessment_data || {}),
      JSON.stringify(data.treatment_plan || {}),
      data.progress_notes,
      data.pain_level,
      JSON.stringify(data.range_of_motion || {}),
      JSON.stringify(data.strength_assessment || {}),
      JSON.stringify(data.balance_assessment || {}),
      JSON.stringify(data.functional_status || {}),
      JSON.stringify(data.goals_achieved || []),
      data.next_session_plan,
      data.notes,
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ลบข้อมูลทางกายภาพบำบัด
  static deletePTData(id, callback) {
    const query = `DELETE FROM pt_data WHERE id = ?`;
    db.query(query, [id], callback);
  }

  // ดึงเป้าหมายการรักษา
  static getTreatmentGoals(HN, callback) {
    const query = `
      SELECT * FROM treatment_goals 
      WHERE HN = ? 
      ORDER BY created_at DESC
    `;
    db.query(query, [HN], callback);
  }

  // บันทึกเป้าหมายการรักษา
  static saveTreatmentGoal(data, callback) {
    const insertQuery = `
      INSERT INTO treatment_goals (
        HN, patient_name, goal_description, target_date,
        priority, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patient_name,
      data.goal_description,
      data.target_date,
      data.priority || 'medium',
      data.status || 'active',
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // อัปเดตเป้าหมายการรักษา
  static updateTreatmentGoal(id, data, callback) {
    const updateQuery = `
      UPDATE treatment_goals
      SET 
        goal_description = ?,
        target_date = ?,
        priority = ?,
        status = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.goal_description,
      data.target_date,
      data.priority,
      data.status,
      data.notes,
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ลบเป้าหมายการรักษา
  static deleteTreatmentGoal(id, callback) {
    const query = `DELETE FROM treatment_goals WHERE id = ?`;
    db.query(query, [id], callback);
  }

  // ดึงความก้าวหน้าของเป้าหมาย
  static getGoalsProgress(HN, callback) {
    const query = `
      SELECT 
        tg.*,
        COUNT(pg.id) as progress_count,
        MAX(pg.created_at) as last_progress_date
      FROM treatment_goals tg
      LEFT JOIN goal_progress pg ON tg.id = pg.goal_id
      WHERE tg.HN = ?
      GROUP BY tg.id
      ORDER BY tg.created_at DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงข้อมูลล่าสุด
  static getLatestPTData(HN, callback) {
    const query = `
      SELECT pt.*, u.fullname as therapist_name, u.username
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.HN = ?
      ORDER BY pt.session_date DESC, pt.created_at DESC
      LIMIT 1
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        results[0] = PTDataModel.parseJSONFields(results[0]);
      }
      
      callback(null, results);
    });
  }

  // ดึงสถิติข้อมูลทางกายภาพบำบัด
  static getPTDataStatistics(HN, callback) {
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        MIN(session_date) as first_session,
        MAX(session_date) as last_session,
        AVG(pain_level) as avg_pain_level
      FROM pt_data 
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // ลบข้อมูล
  static deletePTData(id, callback) {
    const query = `DELETE FROM pt_data WHERE id = ?`;
    db.query(query, [id], callback);
  }

  // ติดตามความก้าวหน้า (สำหรับกราฟและการวิเคราะห์)
  static getProgressTracking(HN, limit = 10, callback) {
    const query = `
      SELECT 
        id,
        session_date,
        pain_assessment,
        functional_assessment,
        muscle_strength,
        balance_assessment,
        home_program_compliance,
        goals_progress,
        treatment_response
      FROM pt_data
      WHERE HN = ?
      ORDER BY session_date ASC
      LIMIT ?
    `;
    
    db.query(query, [HN, parseInt(limit)], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        ['pain_assessment', 'functional_assessment', 'muscle_strength', 'balance_assessment'].forEach(field => {
          if (record[field]) {
            try {
              record[field] = JSON.parse(record[field]);
            } catch (e) {
              record[field] = {};
            }
          } else {
            record[field] = {};
          }
        });
      });
      
      callback(null, results);
    });
  }

  // เปรียบเทียบผลการรักษา (2 sessions)
  static compareResults(id1, id2, callback) {
    const query = `
      SELECT pt.*, u.fullname as therapist_name
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.id IN (?, ?)
      ORDER BY pt.session_date ASC
    `;
    
    db.query(query, [id1, id2], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        PTDataModel.parseJSONFields(record);
      });
      
      callback(null, results);
    });
  }

  // บันทึกเป้าหมายการรักษา
  static saveGoals(data, callback) {
    const insertQuery = `
      INSERT INTO treatment_goals (
        HN, goal_type, goal_description, target_date,
        measurement_criteria, current_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.goalType || 'functional',
      data.goalDescription,
      data.targetDate,
      data.measurementCriteria || '',
      data.currentStatus || 'not_started',
      data.createdBy
    ];

    db.query(insertQuery, values, callback);
  }

  // ดึงเป้าหมายการรักษา
  static getGoals(HN, callback) {
    const query = `
      SELECT g.*, u.fullname as created_by_name
      FROM treatment_goals g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.HN = ?
      ORDER BY 
        CASE g.current_status
          WHEN 'in_progress' THEN 1
          WHEN 'not_started' THEN 2
          WHEN 'achieved' THEN 3
          WHEN 'modified' THEN 4
          WHEN 'discontinued' THEN 5
        END,
        g.target_date ASC
    `;
    db.query(query, [HN], callback);
  }

  // อัปเดตความคืบหน้าเป้าหมาย
  static updateGoalProgress(goalId, data, callback) {
    const updateQuery = `
      UPDATE treatment_goals
      SET 
        current_status = ?,
        progress_notes = ?,
        completion_date = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.currentStatus,
      data.progressNotes || '',
      data.completionDate || null,
      goalId
    ];

    db.query(updateQuery, values, callback);
  }

  // ดึงสถิติข้อมูล PT
  static getPTDataStatistics(HN, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalSessions,
        DATE_FORMAT(MIN(session_date), '%Y-%m-%d') as firstSession,
        DATE_FORMAT(MAX(session_date), '%Y-%m-%d') as lastSession,
        AVG(CAST(JSON_EXTRACT(pain_assessment, '$.intensity') AS UNSIGNED)) as avgPainLevel,
        COUNT(DISTINCT DATE(session_date)) as distinctDays
      FROM pt_data
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // ดึงข้อมูลตามช่วงวันที่
  static getPTDataByDateRange(HN, startDate, endDate, callback) {
    const query = `
      SELECT pt.*, u.fullname as therapist_name
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.HN = ?
      AND DATE(pt.session_date) BETWEEN ? AND ?
      ORDER BY pt.session_date DESC
    `;
    
    db.query(query, [HN, startDate, endDate], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        PTDataModel.parseJSONFields(record);
      });
      
      callback(null, results);
    });
  }

  // ค้นหาข้อมูล PT
  static searchPTData(searchTerm, callback) {
    const query = `
      SELECT pt.*, u.fullname as therapist_name
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.patient_name LIKE ?
      OR pt.treatment_response LIKE ?
      OR pt.notes LIKE ?
      ORDER BY pt.session_date DESC
      LIMIT 50
    `;
    
    const searchPattern = `%${searchTerm}%`;
    
    db.query(query, [searchPattern, searchPattern, searchPattern], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        PTDataModel.parseJSONFields(record);
      });
      
      callback(null, results);
    });
  }

  // ดึงวันที่ที่มี session
  static getAvailableSessionDates(HN, callback) {
    const query = `
      SELECT DISTINCT 
        DATE_FORMAT(session_date, '%Y-%m-%d') as sessionDate,
        DATE_FORMAT(session_date, '%d/%m/%Y') as sessionDateTH,
        COUNT(*) as sessionCount
      FROM pt_data
      WHERE HN = ?
      GROUP BY DATE(session_date)
      ORDER BY sessionDate DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงข้อมูลสำหรับ Export
  static getPTDataForExport(HN, startDate, endDate, callback) {
    let query = `
      SELECT pt.*, u.fullname as therapist_name, u.username,
             p.fname, p.lname, p.gender, p.age, p.phone
      FROM pt_data pt
      LEFT JOIN users u ON pt.created_by = u.id
      LEFT JOIN patients p ON pt.HN = p.HN
      WHERE pt.HN = ?
    `;
    
    let params = [HN];
    
    if (startDate && endDate) {
      query += ` AND DATE(pt.session_date) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY pt.session_date DESC`;
    
    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        PTDataModel.parseJSONFields(record);
      });
      
      callback(null, results);
    });
  }

  // สรุปรายเดือน
  static getMonthlySummary(year, month, callback) {
    const query = `
      SELECT 
        COUNT(*) as totalSessions,
        COUNT(DISTINCT HN) as uniquePatients,
        COUNT(DISTINCT created_by) as activeTherapists,
        AVG(CAST(JSON_EXTRACT(pain_assessment, '$.intensity') AS UNSIGNED)) as avgPainLevel
      FROM pt_data
      WHERE YEAR(session_date) = ? AND MONTH(session_date) = ?
    `;
    db.query(query, [year, month], callback);
  }

  // รายงานการปฏิบัติตาม Home Program
  static getComplianceReport(HN, callback) {
    const query = `
      SELECT 
        home_program_compliance,
        COUNT(*) as count,
        DATE_FORMAT(session_date, '%Y-%m') as month
      FROM pt_data
      WHERE HN = ?
      GROUP BY home_program_compliance, month
      ORDER BY month DESC
    `;
    db.query(query, [HN], callback);
  }

  // ดึงข้อมูลสำหรับกราฟความเจ็บปวด
  static getPainTrendData(HN, limit = 20, callback) {
    const query = `
      SELECT 
        DATE_FORMAT(session_date, '%Y-%m-%d') as date,
        DATE_FORMAT(session_date, '%d/%m') as dateTH,
        pain_assessment
      FROM pt_data
      WHERE HN = ?
      ORDER BY session_date DESC
      LIMIT ?
    `;
    
    db.query(query, [HN, parseInt(limit)], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        if (record.pain_assessment) {
          try {
            record.pain_assessment = JSON.parse(record.pain_assessment);
          } catch (e) {
            record.pain_assessment = {};
          }
        }
      });
      
      // Reverse เพื่อให้แสดงจากเก่าไปใหม่
      callback(null, results.reverse());
    });
  }

  // ดึงข้อมูลสำหรับกราฟ ROM
  static getROMTrendData(HN, limit = 20, callback) {
    const query = `
      SELECT 
        DATE_FORMAT(session_date, '%Y-%m-%d') as date,
        DATE_FORMAT(session_date, '%d/%m') as dateTH,
        joint_mobility
      FROM pt_data
      WHERE HN = ?
      ORDER BY session_date DESC
      LIMIT ?
    `;
    
    db.query(query, [HN, parseInt(limit)], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        if (record.joint_mobility) {
          try {
            record.joint_mobility = JSON.parse(record.joint_mobility);
          } catch (e) {
            record.joint_mobility = {};
          }
        }
      });
      
      callback(null, results.reverse());
    });
  }

  // ดึงข้อมูลสำหรับกราฟ Muscle Strength
  static getStrengthTrendData(HN, limit = 20, callback) {
    const query = `
      SELECT 
        DATE_FORMAT(session_date, '%Y-%m-%d') as date,
        DATE_FORMAT(session_date, '%d/%m') as dateTH,
        muscle_strength
      FROM pt_data
      WHERE HN = ?
      ORDER BY session_date DESC
      LIMIT ?
    `;
    
    db.query(query, [HN, parseInt(limit)], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        if (record.muscle_strength) {
          try {
            record.muscle_strength = JSON.parse(record.muscle_strength);
          } catch (e) {
            record.muscle_strength = {};
          }
        }
      });
      
      callback(null, results.reverse());
    });
  }

  // ดึงข้อมูลสำหรับกราฟ Balance
  static getBalanceTrendData(HN, limit = 20, callback) {
    const query = `
      SELECT 
        DATE_FORMAT(session_date, '%Y-%m-%d') as date,
        DATE_FORMAT(session_date, '%d/%m') as dateTH,
        balance_assessment
      FROM pt_data
      WHERE HN = ?
      ORDER BY session_date DESC
      LIMIT ?
    `;
    
    db.query(query, [HN, parseInt(limit)], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        if (record.balance_assessment) {
          try {
            record.balance_assessment = JSON.parse(record.balance_assessment);
          } catch (e) {
            record.balance_assessment = {};
          }
        }
      });
      
      callback(null, results.reverse());
    });
  }
}

module.exports = PTDataModel;