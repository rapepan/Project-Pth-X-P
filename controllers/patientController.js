const PatientModel = require('../models/patientModel');

class PatientController {
  // แสดงหน้าค้นหาผู้ป่วย
  static searchPage(req, res) {
    const searchTerm = req.query.search || "";
    const searchType = req.query.searchType || "HN";

    if (!searchTerm) {
      return res.render("patients", {
        title: "ค้นหาผู้ป่วย",
        patients: [],
        searchTerm,
        searchType,
      });
    }

    PatientModel.searchPatients(searchType, searchTerm, (err, results) => {
      if (err) {
        console.error("Error fetching patients:", err);
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
          error: err 
        });
      }

      res.render("patients", {
        title: "ค้นหาผู้ป่วย",
        patients: results,
        searchTerm,
        searchType,
      });
    });
  }

  // แสดงฟอร์มเพิ่มผู้ป่วยใหม่
  static showAddForm(req, res) {
    res.render("patientForm", {
      title: "เพิ่มผู้ป่วยใหม่",
      patient: null,
      errors: [],
      message: null
    });
  }

  // เพิ่มผู้ป่วยใหม่
  static addPatient(req, res) {
    const patientData = req.body;

    // Validation
    const errors = PatientController.validatePatientData(patientData);
    if (errors.length > 0) {
      return res.render("patientForm", {
        title: "เพิ่มผู้ป่วยใหม่",
        patient: patientData,
        errors,
        message: null
      });
    }

    // ตรวจสอบรหัสบัตรประชาชนซ้ำ
    PatientModel.checkNationalIdExists(patientData.national_id, null, (err, exists) => {
      if (err) {
        console.error("Error checking national ID:", err);
        return res.status(500).render('error', { 
          message: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล",
          error: err 
        });
      }

      if (exists) {
        return res.render("patientForm", {
          title: "เพิ่มผู้ป่วยใหม่",
          patient: patientData,
          errors: ['รหัสบัตรประชาชนนี้มีอยู่ในระบบแล้ว'],
          message: null
        });
      }

      // สร้าง HN ใหม่
      PatientModel.generateHN((err, newHN) => {
        if (err) {
          console.error("Error generating HN:", err);
          return res.status(500).render('error', { 
            message: "ไม่สามารถสร้าง HN ได้",
            error: err 
          });
        }

        patientData.HN = newHN;

        // บันทึกข้อมูลผู้ป่วย
        PatientModel.createPatient(patientData, (err, result) => {
          if (err) {
            console.error("Error inserting patient:", err);
            return res.status(500).render('error', { 
              message: "ไม่สามารถบันทึกข้อมูลผู้ป่วยได้",
              error: err 
            });
          }

          res.redirect("/patients?success=add");
        });
      });
    });
  }

  // แสดงฟอร์มแก้ไขผู้ป่วย
  static showEditForm(req, res) {
    const HN = req.params.HN;

    PatientModel.getPatientByHN(HN, (err, results) => {
      if (err) {
        console.error("Error fetching patient:", err);
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
          error: err 
        });
      }

      if (results.length === 0) {
        return res.status(404).render('error', { 
          message: "ไม่พบข้อมูลผู้ป่วย",
          error: null 
        });
      }

      res.render("patientForm", {
        title: "แก้ไขข้อมูลผู้ป่วย",
        patient: results[0],
        errors: [],
        message: null
      });
    });
  }

  // อัพเดทข้อมูลผู้ป่วย
  static updatePatient(req, res) {
    const HN = req.params.HN;
    const patientData = req.body;

    // Validation
    const errors = PatientController.validatePatientData(patientData);
    if (errors.length > 0) {
      return res.render("patientForm", {
        title: "แก้ไขข้อมูลผู้ป่วย",
        patient: { ...patientData, HN },
        errors,
        message: null
      });
    }

    // ตรวจสอบรหัสบัตรประชาชนซ้ำ (ยกเว้นผู้ป่วยคนนี้)
    PatientModel.checkNationalIdExists(patientData.national_id, HN, (err, exists) => {
      if (err) {
        console.error("Error checking national ID:", err);
        return res.status(500).render('error', { 
          message: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล",
          error: err 
        });
      }

      if (exists) {
        return res.render("patientForm", {
          title: "แก้ไขข้อมูลผู้ป่วย",
          patient: { ...patientData, HN },
          errors: ['รหัสบัตรประชาชนนี้มีอยู่ในระบบแล้ว'],
          message: null
        });
      }

      // อัพเดทข้อมูล
      PatientModel.updatePatient(HN, patientData, (err, result) => {
        if (err) {
          console.error("Error updating patient:", err);
          return res.status(500).render('error', { 
            message: "ไม่สามารถอัพเดทข้อมูลผู้ป่วยได้",
            error: err 
          });
        }

        res.redirect(`/patients/${HN}?success=update`);
      });
    });
  }

  // ดูรายละเอียดผู้ป่วย
  static viewPatient(req, res) {
    const HN = req.params.HN;

    PatientModel.getPatientByHN(HN, (err, results) => {
      if (err) {
        console.error("Error fetching patient:", err);
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
          error: err 
        });
      }

      if (results.length === 0) {
        return res.status(404).render('error', { 
          message: "ไม่พบข้อมูลผู้ป่วย",
          error: null 
        });
      }

      res.render("patientDetail", {
        title: "รายละเอียดผู้ป่วย",
        patient: results[0],
        success: req.query.success
      });
    });
  }

  // ลบผู้ป่วย
  static deletePatient(req, res) {
    const HN = req.params.HN;

    PatientModel.deletePatient(HN, (err, result) => {
      if (err) {
        console.error("Error deleting patient:", err);
        return res.status(500).json({ 
          success: false, 
          message: "ไม่สามารถลบข้อมูลผู้ป่วยได้" 
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "ไม่พบข้อมูลผู้ป่วย" 
        });
      }

      res.json({ 
        success: true, 
        message: "ลบข้อมูลผู้ป่วยเรียบร้อยแล้ว" 
      });
    });
  }

  // Validation helper
  static validatePatientData(data) {
    const errors = [];

    // Required fields
    const requiredFields = [
      'fname', 'lname', 'national_id', 'gender', 'phone', 
      'age', 'dob', 'housenumber', 'subdistrict', 'district', 
      'province', 'postcode', 'emergency_fname', 'emergency_lname', 
      'emergency_phone', 'relationships'
    ];

    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`กรุณากรอก${PatientController.getFieldLabel(field)}`);
      }
    });

    // Validate national ID (13 digits)
    if (data.national_id && !/^\d{13}$/.test(data.national_id)) {
      errors.push('รหัสบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
    }

    // Validate phone numbers (10 digits)
    if (data.phone && !/^\d{10}$/.test(data.phone)) {
      errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
    }

    if (data.emergency_phone && !/^\d{10}$/.test(data.emergency_phone)) {
      errors.push('เบอร์โทรศัพท์ฉุกเฉินต้องเป็นตัวเลข 10 หลัก');
    }

    // Validate age
    if (data.age && (isNaN(data.age) || data.age < 0 || data.age > 150)) {
      errors.push('อายุต้องเป็นตัวเลขระหว่าง 0-150');
    }

    // Validate postcode (5 digits)
    if (data.postcode && !/^\d{5}$/.test(data.postcode)) {
      errors.push('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
    }

    return errors;
  }

  // Helper to get field labels in Thai
  static getFieldLabel(field) {
    const labels = {
      'fname': 'ชื่อ',
      'lname': 'นามสกุล',
      'national_id': 'รหัสบัตรประชาชน',
      'gender': 'เพศ',
      'phone': 'เบอร์โทรศัพท์',
      'age': 'อายุ',
      'dob': 'วันเกิด',
      'housenumber': 'บ้านเลขที่',
      'subdistrict': 'ตำบล',
      'district': 'อำเภอ',
      'province': 'จังหวัด',
      'postcode': 'รหัสไปรษณีย์',
      'emergency_fname': 'ชื่อผู้ติดต่อฉุกเฉิน',
      'emergency_lname': 'นามสกุลผู้ติดต่อฉุกเฉิน',
      'emergency_phone': 'เบอร์โทรศัพท์ฉุกเฉิน',
      'relationships': 'ความสัมพันธ์'
    };
    return labels[field] || field;
  }
}

module.exports = PatientController;