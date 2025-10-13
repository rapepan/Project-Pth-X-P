const db = require('../config/db');

class AppointmentModel {
  
  /**
   * สร้างนัดหมายใหม่
   */
  static createAppointment(appointmentData, callback) {
    const query = `
      INSERT INTO appointments 
      (HN, patient_name, patient_phone, appointment_date, appointment_time, 
       appointment_type, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      appointmentData.HN,
      appointmentData.patient_name,
      appointmentData.patient_phone,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.appointment_type,
      appointmentData.status || 'scheduled',
      appointmentData.notes,
      appointmentData.created_by
    ];
    
    db.query(query, values, callback);
  }

  /**
   * อัปเดตข้อมูลนัดหมาย
   */
  static updateAppointment(appointmentId, appointmentData, callback) {
    const query = `
      UPDATE appointments 
      SET patient_name = ?, patient_phone = ?, 
          appointment_date = ?, appointment_time = ?, appointment_type = ?, 
          status = ?, notes = ?
      WHERE id = ?
    `;
    
    const values = [
      appointmentData.patient_name,
      appointmentData.patient_phone,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.appointment_type,
      appointmentData.status,
      appointmentData.notes,
      appointmentId
    ];
    
    db.query(query, values, callback);
  }

  /**
   * ดึงข้อมูลนัดหมายตาม ID
   */
  static getAppointmentById(appointmentId, callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.id = ?
    `;
    
    db.query(query, [appointmentId], callback);
  }

  /**
   * ดึงรายการนัดหมายทั้งหมด
   */
  static getAllAppointments(callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    
    db.query(query, callback);
  }

  /**
   * ดึงรายการนัดหมายตาม filters หลายตัว
   */
  static getFilteredAppointments(filters, callback) {
    let query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE 1=1
    `;
    
    const params = [];
    
    // เพิ่ม filter ตามวันที่
    if (filters.date && filters.date.trim()) {
      query += ' AND a.appointment_date = ?';
      params.push(filters.date);
    }
    
    // เพิ่ม filter ตามสถานะ
    if (filters.status && filters.status.trim()) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }
    
    // เพิ่ม filter ตามการค้นหา
    if (filters.search && filters.search.trim()) {
      query += ' AND (a.patient_name LIKE ? OR a.HN LIKE ? OR a.patient_phone LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    db.query(query, params, callback);
  }

  /**
   * ดึงรายการนัดหมายตามวันที่
   */
  static getAppointmentsByDate(date, callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.appointment_date = ?
      ORDER BY a.appointment_time ASC
    `;
    
    db.query(query, [date], callback);
  }

  /**
   * ดึงรายการนัดหมายตาม HN
   */
  static getAppointmentsByHN(HN, callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.HN = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    
    db.query(query, [HN], callback);
  }

  /**
   * ดึงรายการนัดหมายตามสถานะ
   */
  static getAppointmentsByStatus(status, callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.status = ?
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    
    db.query(query, [status], callback);
  }

  /**
   * ดึงรายการนัดหมายวันนี้
   */
  static getTodayAppointments(callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.appointment_date = CURDATE()
      ORDER BY a.appointment_time ASC
    `;
    
    db.query(query, callback);
  }

  /**
   * ดึงรายการนัดหมายที่ใกล้ถึงเวลา (7 วันข้างหน้า)
   */
  static getUpcomingAppointments(callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND a.status IN ('scheduled', 'confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    
    db.query(query, callback);
  }

  /**
   * ลบนัดหมาย
   */
  static deleteAppointment(appointmentId, callback) {
    const query = 'DELETE FROM appointments WHERE id = ?';
    db.query(query, [appointmentId], callback);
  }

  /**
   * อัปเดตสถานะนัดหมาย
   */
  static updateAppointmentStatus(appointmentId, status, callback) {
    const query = 'UPDATE appointments SET status = ? WHERE id = ?';
    db.query(query, [status, appointmentId], callback);
  }

  /**
   * ค้นหานัดหมาย
   */
  static searchAppointments(searchTerm, callback) {
    const query = `
      SELECT a.*, u.fullname as created_by_name 
      FROM appointments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.patient_name LIKE ? OR a.HN LIKE ? OR a.patient_phone LIKE ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern, searchPattern], callback);
  }

  /**
   * ตรวจสอบความขัดแย้งของเวลา
   */
  static checkTimeConflict(appointmentDate, appointmentTime, appointmentId = null, callback) {
    let query = `
      SELECT COUNT(*) as conflict_count 
      FROM appointments 
      WHERE appointment_date = ? AND appointment_time = ? AND status IN ('scheduled', 'confirmed')
    `;
    
    const params = [appointmentDate, appointmentTime];
    
    if (appointmentId) {
      query += ' AND id != ?';
      params.push(appointmentId);
    }
    
    db.query(query, params, callback);
  }

  /**
   * ดึงสถิติการนัดหมาย
   */
  static getAppointmentStats(callback) {
    const query = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_count,
        COUNT(CASE WHEN appointment_date = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_count
      FROM appointments
    `;
    
    db.query(query, callback);
  }

  /**
   * ดึงรายการวันที่ที่มีนัดหมาย
   */
  static getAppointmentDates(callback) {
    const query = `
      SELECT DISTINCT appointment_date 
      FROM appointments 
      WHERE appointment_date >= CURDATE() 
      ORDER BY appointment_date ASC
    `;
    
    db.query(query, callback);
  }

  /**
   * ดึงข้อมูลผู้ป่วยสำหรับสร้างนัดหมาย
   */
  static getPatientForAppointment(HN, callback) {
    const query = `
      SELECT HN, fullname, phone, email 
      FROM patient 
      WHERE HN = ?
    `;
    
    db.query(query, [HN], callback);
  }
}

module.exports = AppointmentModel;
