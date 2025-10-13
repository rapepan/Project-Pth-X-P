const AppointmentModel = require('../models/appointmentModel');

class AppointmentController {

  /**
   * แสดงหน้ารายการนัดหมาย
   */
  static async showAppointments(req, res) {
    try {
      const { search } = req.query;
      
      let appointments = [];
      
      if (search && search.trim()) {
        // ค้นหานัดหมาย
        appointments = await new Promise((resolve, reject) => {
          AppointmentModel.searchAppointments(search, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
      } else {
        // ดึงนัดหมายทั้งหมด
        appointments = await new Promise((resolve, reject) => {
          AppointmentModel.getAllAppointments((err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
      }

      // ดึงสถิติ
      const stats = await new Promise((resolve, reject) => {
        AppointmentModel.getAppointmentStats((err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

      // ดึงรายการวันที่ที่มีนัดหมาย
      const appointmentDates = await new Promise((resolve, reject) => {
        AppointmentModel.getAppointmentDates((err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      res.render('appointments', {
        title: 'ระบบนัดหมาย',
        appointments: appointments,
        stats: stats,
        appointmentDates: appointmentDates,
        searchTerm: search || '',
        user: req.user,
        userRole: req.user.role
      });
    } catch (error) {
      console.error('Error in showAppointments:', error);
      res.status(500).render('error', {
        title: 'เกิดข้อผิดพลาด',
        error: 'ไม่สามารถโหลดข้อมูลนัดหมายได้',
        user: req.user
      });
    }
  }

  /**
   * แสดงหน้าสร้างนัดหมาย
   */
  static async showCreateAppointment(req, res) {
    try {
      const { HN } = req.query;
      let patientData = null;

      if (HN) {
        // ดึงข้อมูลผู้ป่วย
        patientData = await new Promise((resolve, reject) => {
          AppointmentModel.getPatientForAppointment(HN, (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || null);
          });
        });
      }

      res.render('appointmentForm', {
        title: 'สร้างนัดหมายใหม่',
        appointment: null,
        patientData: patientData,
        user: req.user,
        userRole: req.user.role
      });
    } catch (error) {
      console.error('Error in showCreateAppointment:', error);
      res.status(500).render('error', {
        title: 'เกิดข้อผิดพลาด',
        error: 'ไม่สามารถโหลดหน้าสร้างนัดหมายได้',
        user: req.user
      });
    }
  }

  /**
   * แสดงหน้าแก้ไขนัดหมาย
   */
  static async showEditAppointment(req, res) {
    try {
      const { id } = req.params;
      
      const appointment = await new Promise((resolve, reject) => {
        AppointmentModel.getAppointmentById(id, (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || null);
        });
      });

      if (!appointment) {
        return res.status(404).render('error', {
          title: 'ไม่พบข้อมูล',
          error: 'ไม่พบนัดหมายที่ต้องการ',
          user: req.user
        });
      }

      res.render('appointmentForm', {
        title: 'แก้ไขนัดหมาย',
        appointment: appointment,
        patientData: null,
        user: req.user,
        userRole: req.user.role
      });
    } catch (error) {
      console.error('Error in showEditAppointment:', error);
      res.status(500).render('error', {
        title: 'เกิดข้อผิดพลาด',
        error: 'ไม่สามารถโหลดหน้าแก้ไขนัดหมายได้',
        user: req.user
      });
    }
  }

  /**
   * แสดงหน้ารายละเอียดนัดหมาย
   */
  static async showAppointmentDetail(req, res) {
    try {
      const { id } = req.params;
      
      const appointment = await new Promise((resolve, reject) => {
        AppointmentModel.getAppointmentById(id, (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || null);
        });
      });

      if (!appointment) {
        return res.status(404).render('error', {
          title: 'ไม่พบข้อมูล',
          error: 'ไม่พบนัดหมายที่ต้องการ',
          user: req.user
        });
      }

      res.render('appointmentDetail', {
        title: 'รายละเอียดนัดหมาย',
        appointment: appointment,
        user: req.user,
        userRole: req.user.role
      });
    } catch (error) {
      console.error('Error in showAppointmentDetail:', error);
      res.status(500).render('error', {
        title: 'เกิดข้อผิดพลาด',
        error: 'ไม่สามารถโหลดรายละเอียดนัดหมายได้',
        user: req.user
      });
    }
  }

  /**
   * สร้างนัดหมายใหม่
   */
  static async createAppointment(req, res) {
    try {
      const appointmentData = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      const validation = AppointmentController._validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        return res.render('appointmentForm', {
          title: 'สร้างนัดหมายใหม่',
          appointment: null,
          patientData: null,
          error: validation.error,
          user: req.user,
          userRole: req.user.role
        });
      }

      // ตรวจสอบความขัดแย้งของเวลา
      const timeConflict = await new Promise((resolve, reject) => {
        AppointmentModel.checkTimeConflict(
          appointmentData.appointment_date,
          appointmentData.appointment_time,
          null,
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0].conflict_count > 0);
          }
        );
      });

      if (timeConflict) {
        return res.render('appointmentForm', {
          title: 'สร้างนัดหมายใหม่',
          appointment: null,
          patientData: null,
          error: 'เวลานัดหมายซ้ำกับนัดหมายอื่น กรุณาเลือกเวลาอื่น',
          user: req.user,
          userRole: req.user.role
        });
      }

      // เพิ่มข้อมูล created_by
      appointmentData.created_by = req.user.id;

      // บันทึกนัดหมาย
      await new Promise((resolve, reject) => {
        AppointmentModel.createAppointment(appointmentData, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.redirect(`/appointments?success=${encodeURIComponent('สร้างนัดหมายสำเร็จ')}`);
    } catch (error) {
      console.error('Error in createAppointment:', error);
      res.render('appointmentForm', {
        title: 'สร้างนัดหมายใหม่',
        appointment: null,
        patientData: null,
        error: 'เกิดข้อผิดพลาดในการสร้างนัดหมาย',
        user: req.user,
        userRole: req.user.role
      });
    }
  }

  /**
   * อัปเดตข้อมูลนัดหมาย
   */
  static async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      const appointmentData = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      const validation = AppointmentController._validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        const appointment = await new Promise((resolve, reject) => {
          AppointmentModel.getAppointmentById(id, (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || null);
          });
        });

        return res.render('appointmentForm', {
          title: 'แก้ไขนัดหมาย',
          appointment: appointment,
          patientData: null,
          error: validation.error,
          user: req.user,
          userRole: req.user.role
        });
      }

      // ตรวจสอบความขัดแย้งของเวลา
      const timeConflict = await new Promise((resolve, reject) => {
        AppointmentModel.checkTimeConflict(
          appointmentData.appointment_date,
          appointmentData.appointment_time,
          id,
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0].conflict_count > 0);
          }
        );
      });

      if (timeConflict) {
        const appointment = await new Promise((resolve, reject) => {
          AppointmentModel.getAppointmentById(id, (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || null);
          });
        });

        return res.render('appointmentForm', {
          title: 'แก้ไขนัดหมาย',
          appointment: appointment,
          patientData: null,
          error: 'เวลานัดหมายซ้ำกับนัดหมายอื่น กรุณาเลือกเวลาอื่น',
          user: req.user,
          userRole: req.user.role
        });
      }

      // อัปเดตข้อมูลนัดหมาย
      await new Promise((resolve, reject) => {
        AppointmentModel.updateAppointment(id, appointmentData, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.redirect(`/appointments/${id}?success=${encodeURIComponent('แก้ไขนัดหมายสำเร็จ')}`);
    } catch (error) {
      console.error('Error in updateAppointment:', error);
      res.render('appointmentForm', {
        title: 'แก้ไขนัดหมาย',
        appointment: null,
        patientData: null,
        error: 'เกิดข้อผิดพลาดในการแก้ไขนัดหมาย',
        user: req.user,
        userRole: req.user.role
      });
    }
  }

  /**
   * อัปเดตสถานะนัดหมาย
   */
  static async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await new Promise((resolve, reject) => {
        AppointmentModel.updateAppointmentStatus(id, status, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * ลบนัดหมาย
   */
  static async deleteAppointment(req, res) {
    try {
      const { id } = req.params;
      
      await new Promise((resolve, reject) => {
        AppointmentModel.deleteAppointment(id, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.redirect('/appointments?success=' + encodeURIComponent('ลบนัดหมายสำเร็จ'));
    } catch (error) {
      console.error('Error in deleteAppointment:', error);
      res.redirect('/appointments?error=' + encodeURIComponent('เกิดข้อผิดพลาดในการลบนัดหมาย'));
    }
  }

  /**
   * สร้างใบนัดหมาย (PDF)
   */
  static async generateAppointmentCard(req, res) {
    try {
      const { id } = req.params;
      
      const appointment = await new Promise((resolve, reject) => {
        AppointmentModel.getAppointmentById(id, (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || null);
        });
      });

      if (!appointment) {
        return res.status(404).render('error', {
          title: 'ไม่พบข้อมูล',
          error: 'ไม่พบนัดหมายที่ต้องการ',
          user: req.user
        });
      }

      res.render('appointmentCard', {
        title: 'ใบนัดหมาย',
        appointment: appointment,
        layout: false // ไม่ใช้ layout หลัก
      });
    } catch (error) {
      console.error('Error in generateAppointmentCard:', error);
      res.status(500).render('error', {
        title: 'เกิดข้อผิดพลาด',
        error: 'ไม่สามารถสร้างใบนัดหมายได้',
        user: req.user
      });
    }
  }

  /**
   * ตรวจสอบข้อมูลนัดหมาย
   */
  static _validateAppointmentData(appointmentData) {
    if (!appointmentData.HN || !appointmentData.HN.trim()) {
      return { isValid: false, error: 'กรุณากรอกเลข HN' };
    }

    if (!appointmentData.patient_name || !appointmentData.patient_name.trim()) {
      return { isValid: false, error: 'กรุณากรอกชื่อผู้ป่วย' };
    }

    if (!appointmentData.appointment_date) {
      return { isValid: false, error: 'กรุณาเลือกวันที่นัดหมาย' };
    }

    if (!appointmentData.appointment_time) {
      return { isValid: false, error: 'กรุณาเลือกเวลานัดหมาย' };
    }

    if (!appointmentData.appointment_type) {
      return { isValid: false, error: 'กรุณาเลือกประเภทนัดหมาย' };
    }

    // ตรวจสอบวันที่ไม่สามารถเป็นอดีตได้
    const appointmentDate = new Date(appointmentData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return { isValid: false, error: 'ไม่สามารถนัดหมายในวันที่ผ่านมาแล้ว' };
    }

    return { isValid: true };
  }

  /**
   * แปลงสถานะเป็นภาษาไทย
   */
  static getStatusInThai(status) {
    const statusMap = {
      'scheduled': 'รอการยืนยัน',
      'confirmed': 'ยืนยันแล้ว',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก',
      'no_show': 'ไม่มาตามนัด'
    };
    return statusMap[status] || status;
  }

  /**
   * แปลงประเภทนัดหมายเป็นภาษาไทย
   */
  static getAppointmentTypeInThai(type) {
    const typeMap = {
      'examination': 'การตรวจร่างกาย',
      'treatment': 'การรักษา',
      'consultation': 'การปรึกษา',
      'follow_up': 'การติดตามผล',
      'other': 'อื่นๆ'
    };
    return typeMap[type] || type;
  }
}

module.exports = AppointmentController;

