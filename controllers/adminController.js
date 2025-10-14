const bcrypt = require('bcryptjs');
const db = require('../config/db');
const UserModel = require('../models/userModel');
const PDFGenerator = require('../utils/pdfGenerator');

class AdminController {
  // แสดงหน้ารายการผู้ใช้
  static showUsers(req, res) {
    UserModel.getAllUsers((err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
          error: process.env.NODE_ENV === 'development' ? err : null,
          statusCode: 500
        });
      }

      res.render('admin/users', {
        title: 'จัดการผู้ใช้',
        users: users,
        user: req.user,
        userRole: req.user.role,
        currentUser: req.user
      });
    });
  }

  // แสดงหน้าสร้างผู้ใช้ใหม่
  static showCreateUser(req, res) {
    res.render('admin/createUser', {
      title: 'เพิ่มผู้ใช้ใหม่',
      user: req.user,
      userRole: req.user.role,
      errors: [],
      formData: {}
    });
  }

  // สร้างผู้ใช้ใหม่
  static createUser(req, res) {
    const { username, password, email, fullname, role } = req.body;
    const errors = [];

    // Validation
    if (!username || username.trim() === '') {
      errors.push('กรุณากรอกชื่อผู้ใช้');
    }

    if (!password || password.length < 6) {
      errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    if (!email || !AdminController.isValidEmail(email)) {
      errors.push('กรุณากรอกอีเมลที่ถูกต้อง');
    }

    if (!fullname || fullname.trim() === '') {
      errors.push('กรุณากรอกชื่อ-นามสกุล');
    }

    if (!role || !['admin', 'physical_therapist', 'staff'].includes(role)) {
      errors.push('กรุณาเลือกระดับผู้ใช้');
    }

    if (errors.length > 0) {
      return res.render('admin/createUser', {
        title: 'เพิ่มผู้ใช้ใหม่',
        user: req.user,
        userRole: req.user.role,
        errors,
        formData: req.body
      });
    }

    // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่
    UserModel.checkUserExists(username, email, null, (err, existingUsers) => {
      if (err) {
        console.error('Error checking user exists:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
          error: process.env.NODE_ENV === 'development' ? err : null,
          statusCode: 500
        });
      }

      if (existingUsers.length > 0) {
        const duplicateFields = [];
        existingUsers.forEach(user => {
          if (user.username === username) duplicateFields.push('ชื่อผู้ใช้');
          if (user.email === email) duplicateFields.push('อีเมล');
        });
        
        return res.render('admin/createUser', {
          title: 'เพิ่มผู้ใช้ใหม่',
          user: req.user,
          userRole: req.user.role,
          errors: [`${duplicateFields.join(' และ ')} นี้มีอยู่ในระบบแล้ว`],
          formData: req.body
        });
      }

      // เข้ารหัสรหัสผ่าน
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).render('error', {
            title: "เกิดข้อผิดพลาด",
            message: "ไม่สามารถเข้ารหัสรหัสผ่านได้",
            error: process.env.NODE_ENV === 'development' ? err : null,
            statusCode: 500
          });
        }

        // สร้างผู้ใช้ใหม่
        const userData = {
          username,
          password: hashedPassword,
          email,
          fullname,
          role
        };

        UserModel.createUser(userData, (err, result) => {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).render('error', {
              title: "เกิดข้อผิดพลาด",
              message: "ไม่สามารถสร้างผู้ใช้ใหม่ได้",
              error: process.env.NODE_ENV === 'development' ? err : null,
              statusCode: 500
            });
          }

          req.flash('success', 'เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว');
          res.redirect('/admin/users');
        });
      });
    });
  }

  // แสดงหน้าแก้ไขผู้ใช้
  static showEditUser(req, res) {
    const userId = req.params.id;

    UserModel.getUserById(userId, (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
          error: process.env.NODE_ENV === 'development' ? err : null,
          statusCode: 500
        });
      }

      if (!user) {
        return res.status(404).render('error', {
          title: "ไม่พบข้อมูล",
          message: "ไม่พบข้อมูลผู้ใช้ที่ต้องการ",
          error: null,
          statusCode: 404
        });
      }

      res.render('admin/editUser', {
        title: 'แก้ไขข้อมูลผู้ใช้',
        editUser: user,
        user: req.user,
        userRole: req.user.role,
        errors: [],
        formData: user
      });
    });
  }

  // อัปเดตข้อมูลผู้ใช้
  static updateUser(req, res) {
    const userId = req.params.id;
    const { email, fullname, role, password, confirmPassword } = req.body;
    const errors = [];

    // Validation
    if (!email || !AdminController.isValidEmail(email)) {
      errors.push('กรุณากรอกอีเมลที่ถูกต้อง');
    }

    if (!fullname || fullname.trim() === '') {
      errors.push('กรุณากรอกชื่อ-นามสกุล');
    }

    if (!role || !['admin', 'physical_therapist', 'staff'].includes(role)) {
      errors.push('กรุณาเลือกระดับผู้ใช้');
    }

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password && password.length > 0) {
      if (password.length < 6) {
        errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      }

      if (password !== confirmPassword) {
        errors.push('รหัสผ่านไม่ตรงกัน');
      }
    }

    if (errors.length > 0) {
      return UserModel.getUserById(userId, (err, user) => {
        if (err || !user) {
          return res.status(404).render('error', {
            title: "ไม่พบข้อมูล",
            message: "ไม่พบข้อมูลผู้ใช้ที่ต้องการ",
            error: null,
            statusCode: 404
          });
        }

        res.render('admin/editUser', {
          title: 'แก้ไขข้อมูลผู้ใช้',
          editUser: user,
          user: req.user,
          userRole: req.user.role,
          errors,
          formData: req.body
        });
      });
    }

    // ตรวจสอบ email ซ้ำหรือไม่
    UserModel.checkUserExists(null, email, userId, (err, existingUsers) => {
      if (err) {
        console.error('Error checking email exists:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
          error: process.env.NODE_ENV === 'development' ? err : null,
          statusCode: 500
        });
      }

      if (existingUsers.length > 0) {
        return UserModel.getUserById(userId, (err, user) => {
          if (err || !user) {
            return res.status(404).render('error', {
              title: "ไม่พบข้อมูล",
              message: "ไม่พบข้อมูลผู้ใช้ที่ต้องการ",
              error: null,
              statusCode: 404
            });
          }

          res.render('admin/editUser', {
            title: 'แก้ไขข้อมูลผู้ใช้',
            editUser: user,
            user: req.user,
            userRole: req.user.role,
            errors: ['อีเมลนี้มีอยู่ในระบบแล้ว'],
            formData: req.body
          });
        });
      }

      // ถ้ามีการเปลี่ยนรหัสผ่าน
      if (password && password.length > 0) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).render('error', {
              title: "เกิดข้อผิดพลาด",
              message: "ไม่สามารถเข้ารหัสรหัสผ่านได้",
              error: process.env.NODE_ENV === 'development' ? err : null,
              statusCode: 500
            });
          }

          const userData = { email, fullname, password: hashedPassword };
          UserModel.updateUser(userId, userData, (err, result) => {
            if (err) {
              console.error('Error updating user:', err);
              return res.status(500).render('error', {
                title: "เกิดข้อผิดพลาด",
                message: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้",
                error: process.env.NODE_ENV === 'development' ? err : null,
                statusCode: 500
              });
            }

            // อัปเดต role แยกต่างหาก
            db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId], (err, result) => {
              if (err) {
                console.error('Error updating user role:', err);
                return res.status(500).render('error', {
                  title: "เกิดข้อผิดพลาด",
                  message: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้",
                  error: process.env.NODE_ENV === 'development' ? err : null,
                  statusCode: 500
                });
              }

              req.flash('success', 'แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว');
              res.redirect('/admin/users');
            });
          });
        });
      } else {
        // ไม่เปลี่ยนรหัสผ่าน
        const userData = { email, fullname };
        UserModel.updateUser(userId, userData, (err, result) => {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).render('error', {
              title: "เกิดข้อผิดพลาด",
              message: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้",
              error: process.env.NODE_ENV === 'development' ? err : null,
              statusCode: 500
            });
          }

          // อัปเดต role แยกต่างหาก
          db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId], (err, result) => {
            if (err) {
              console.error('Error updating user role:', err);
              return res.status(500).render('error', {
                title: "เกิดข้อผิดพลาด",
                message: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้",
                error: process.env.NODE_ENV === 'development' ? err : null,
                statusCode: 500
              });
            }

            req.flash('success', 'แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว');
            res.redirect('/admin/users');
          });
        });
      }
    });
  }

  // ลบผู้ใช้
  static deleteUser(req, res) {
    const userId = req.params.id;

    // ป้องกันไม่ให้ลบตัวเอง
    if (parseInt(userId) === parseInt(req.user.id)) {
      req.flash('error', 'ไม่สามารถลบบัญชีของตนเองได้');
      return res.redirect('/admin/users');
    }

    UserModel.deleteUser(userId, (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถลบผู้ใช้ได้",
          error: process.env.NODE_ENV === 'development' ? err : null,
          statusCode: 500
        });
      }

      req.flash('success', 'ลบผู้ใช้เรียบร้อยแล้ว');
      res.redirect('/admin/users');
    });
  }

  // แสดงหน้ารายงานและสถิติ
  static showReports(req, res) {
    const StatsModel = require('../models/statsModel');
    
    // ดึงข้อมูลสถิติทั้งหมด
    StatsModel.getAllStats((err, stats) => {
      if (err) {
        console.error('Error fetching stats:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลสถิติได้",
          error: process.env.NODE_ENV === 'development' ? err : null,
          statusCode: 500
        });
      }

      res.render('admin/reports', {
        title: 'รายงานและสถิติ',
        stats: stats,
        user: req.user,
        userRole: req.user.role
      });
    });
  }

  // สร้างรายงานผู้ป่วย
  static generatePatientReport(req, res) {
    const PatientModel = require('../models/patientModel');
    
    PatientModel.getAllPatients((err, patients) => {
      if (err) {
        console.error('Error fetching patients:', err);
        return res.status(500).json({
          success: false,
          message: 'ไม่สามารถดึงข้อมูลผู้ป่วยได้'
        });
      }

      const reportData = {
        title: 'รายงานข้อมูลผู้ป่วย',
        generatedDate: new Date().toLocaleDateString('th-TH'),
        totalPatients: patients.length,
        patients: patients
      };

      // สร้าง PDF
      PDFGenerator.generatePDF(reportData, 'patients')
        .then(pdfBuffer => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="patient_report_${new Date().toISOString().split('T')[0]}.pdf"`);
          res.send(pdfBuffer);
        })
        .catch(error => {
          console.error('Error generating PDF:', error);
          res.status(500).json({
            success: false,
            message: 'ไม่สามารถสร้างไฟล์ PDF ได้'
          });
        });
    });
  }

  // สร้างรายงานนัดหมาย
  static generateAppointmentReport(req, res) {
    const AppointmentModel = require('../models/appointmentModel');
    
    AppointmentModel.getAllAppointments((err, appointments) => {
      if (err) {
        console.error('Error fetching appointments:', err);
        return res.status(500).json({
          success: false,
          message: 'ไม่สามารถดึงข้อมูลนัดหมายได้'
        });
      }

      const reportData = {
        title: 'รายงานข้อมูลนัดหมาย',
        generatedDate: new Date().toLocaleDateString('th-TH'),
        totalAppointments: appointments.length,
        appointments: appointments
      };

      // สร้าง PDF
      PDFGenerator.generatePDF(reportData, 'appointments')
        .then(pdfBuffer => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="appointment_report_${new Date().toISOString().split('T')[0]}.pdf"`);
          res.send(pdfBuffer);
        })
        .catch(error => {
          console.error('Error generating PDF:', error);
          res.status(500).json({
            success: false,
            message: 'ไม่สามารถสร้างไฟล์ PDF ได้'
          });
        });
    });
  }

  // สร้างรายงานการเงิน
  static generateFinancialReport(req, res) {
    const BillingModel = require('../models/billingModel');
    const StatsModel = require('../models/statsModel');
    
    // ดึงข้อมูลใบเสร็จทั้งหมด
    BillingModel.getAllBilling((err, billing) => {
      if (err) {
        console.error('Error fetching billing:', err);
        return res.status(500).json({
          success: false,
          message: 'ไม่สามารถดึงข้อมูลการเงินได้'
        });
      }

      // คำนวณสถิติการเงิน
      let totalRevenue = 0;
      let paidCount = 0;
      let pendingCount = 0;

      billing.forEach(bill => {
        if (bill.payment_status === 'paid') {
          totalRevenue += parseFloat(bill.total_amount || 0);
          paidCount++;
        } else {
          pendingCount++;
        }
      });

      const reportData = {
        title: 'รายงานการเงิน',
        generatedDate: new Date().toLocaleDateString('th-TH'),
        totalRevenue: totalRevenue,
        paidBills: paidCount,
        pendingBills: pendingCount,
        totalBills: billing.length,
        billing: billing
      };

      // สร้าง PDF
      PDFGenerator.generatePDF(reportData, 'financial')
        .then(pdfBuffer => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="financial_report_${new Date().toISOString().split('T')[0]}.pdf"`);
          res.send(pdfBuffer);
        })
        .catch(error => {
          console.error('Error generating PDF:', error);
          res.status(500).json({
            success: false,
            message: 'ไม่สามารถสร้างไฟล์ PDF ได้'
          });
        });
    });
  }

  // สร้างรายงานผู้ใช้งาน
  static generateUserReport(req, res) {
    UserModel.getAllUsers((err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({
          success: false,
          message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้'
        });
      }

      const reportData = {
        title: 'รายงานข้อมูลผู้ใช้งาน',
        generatedDate: new Date().toLocaleDateString('th-TH'),
        totalUsers: users.length,
        users: users
      };

      // สร้าง PDF
      PDFGenerator.generatePDF(reportData, 'users')
        .then(pdfBuffer => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="user_report_${new Date().toISOString().split('T')[0]}.pdf"`);
          res.send(pdfBuffer);
        })
        .catch(error => {
          console.error('Error generating PDF:', error);
          res.status(500).json({
            success: false,
            message: 'ไม่สามารถสร้างไฟล์ PDF ได้'
          });
        });
    });
  }

  // ตรวจสอบ email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = AdminController;
