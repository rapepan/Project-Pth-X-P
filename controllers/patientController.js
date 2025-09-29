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
    // จัดการข้อมูลก่อนบันทึก
    const patientData = PatientController.preparePatientData(req.body);

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
            // ถ้า error เกี่ยวกับ duplicate entry ให้แสดงข้อความที่เข้าใจง่าย
            if (err.code === 'ER_DUP_ENTRY') {
              return res.render("patientForm", {
                title: "เพิ่มผู้ป่วยใหม่",
                patient: patientData,
                errors: ['ข้อมูลซ้ำในระบบ กรุณาตรวจสอบอีกครั้ง'],
                message: null
              });
            }
            return res.status(500).render('error', { 
              message: "ไม่สามารถบันทึกข้อมูลผู้ป่วยได้",
              error: err 
            });
          }

          // Redirect with success message
          res.redirect(`/patients?search=${newHN}&searchType=HN&success=add`);
        });
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

  // Prepare patient data - จัดการข้อมูลให้พร้อมบันทึก
  static preparePatientData(data) {
    const preparedData = { ...data };
    
    // ฟิลด์ที่ถ้าไม่มีค่าให้ใส่ '-'
    const optionalTextFields = ['chronic_diseases', 'allergy_history', 'moo', 'soi'];
    
    optionalTextFields.forEach(field => {
      if (!preparedData[field] || preparedData[field].trim() === '') {
        preparedData[field] = '-';
      }
    });
    
    // ทำความสะอาดข้อมูลตัวเลข
    if (preparedData.national_id) {
      preparedData.national_id = preparedData.national_id.replace(/\D/g, '');
    }
    if (preparedData.phone) {
      preparedData.phone = preparedData.phone.replace(/\D/g, '');
    }
    if (preparedData.emergency_phone) {
      preparedData.emergency_phone = preparedData.emergency_phone.replace(/\D/g, '');
    }
    if (preparedData.postcode) {
      preparedData.postcode = preparedData.postcode.replace(/\D/g, '');
    }
    
    // แปลง age เป็นตัวเลข
    if (preparedData.age) {
      preparedData.age = parseInt(preparedData.age, 10);
    }
    
    return preparedData;
  }

  // Validation helper
  static validatePatientData(data) {
    const errors = [];

    // Required fields - ฟิลด์ที่จำเป็นต้องมี
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
    if (data.national_id) {
      const cleanedId = data.national_id.replace(/\D/g, '');
      if (cleanedId.length !== 13) {
        errors.push('รหัสบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
      }
    }

    // Validate phone numbers (10 digits)
    if (data.phone) {
      const cleanedPhone = data.phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 10) {
        errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
      }
    }

    if (data.emergency_phone) {
      const cleanedEmergencyPhone = data.emergency_phone.replace(/\D/g, '');
      if (cleanedEmergencyPhone.length !== 10) {
        errors.push('เบอร์โทรศัพท์ฉุกเฉินต้องเป็นตัวเลข 10 หลัก');
      }
    }

    // Validate age
    const age = parseInt(data.age, 10);
    if (isNaN(age) || age < 0 || age > 150) {
      errors.push('อายุต้องเป็นตัวเลขระหว่าง 0-150');
    }

    // Validate postcode (5 digits)
    if (data.postcode) {
      const cleanedPostcode = data.postcode.replace(/\D/g, '');
      if (cleanedPostcode.length !== 5) {
        errors.push('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
      }
    }

    // Validate date of birth
    if (data.dob) {
      const dobDate = new Date(data.dob);
      const today = new Date();
      if (dobDate > today) {
        errors.push('วันเกิดไม่สามารถเป็นวันในอนาคตได้');
      }
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