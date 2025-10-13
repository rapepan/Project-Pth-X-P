const BillingModel = require('../models/billingModel');
const ServiceModel = require('../models/serviceModel');
const ProcedureModel = require('../models/procedureModel');
const { generateUniqueBillNumber, getCurrentDate, getCurrentDateTime, getCurrentMySQLDateTime } = require('../utils/billUtils');

class BillingController {
  
  /**
   * แสดงหน้า billing สำหรับผู้ป่วย
   */
  static showBillingPage(req, res) {
    const HN = req.params.HN;
    
    if (!HN) {
      return res.status(400).render('error', {
        title: "ข้อมูลไม่ถูกต้อง",
        message: "ไม่พบ HN ของผู้ป่วย",
        statusCode: 400,
        error: null
      });
    }

    // ดึงข้อมูลผู้ป่วย
    BillingController._getPatientData(HN, (err, patientData) => {
      if (err) {
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
          statusCode: 500,
          error: err
        });
      }

      if (!patientData) {
        return res.status(404).render('error', {
          title: "ไม่พบข้อมูลผู้ป่วย",
          message: `ไม่พบข้อมูลผู้ป่วย HN: ${HN}`,
          statusCode: 404,
          error: null
        });
      }

      // ดึงข้อมูลหัตถการทั้งหมดของวันที่ปัจจุบัน
      const today = getCurrentDate();
      console.log('🔍 Debug: Looking for procedures for HN:', HN, 'on date:', today);
      
      BillingController._getTodayProcedures(HN, today, (err, procedures) => {
        if (err) {
          console.error('❌ Error fetching procedures:', err);
          return res.status(500).render('error', {
            title: "เกิดข้อผิดพลาด",
            message: "ไม่สามารถดึงข้อมูลหัตถการได้",
            statusCode: 500,
            error: err
          });
        }
        
        console.log('📋 Debug: Found procedures:', procedures.length, 'records');
        if (procedures.length > 0) {
          console.log('📋 Debug: First procedure:', procedures[0]);
        }

        // ดึงข้อมูลบริการเพื่อคำนวณราคา
        ServiceModel.getAllServices((err, allServices) => {
          if (err) {
            console.error('Error fetching services:', err);
            return res.status(500).render('error', {
              title: "เกิดข้อผิดพลาด",
              message: "ไม่สามารถดึงข้อมูลบริการได้",
              statusCode: 500,
              error: err
            });
          }

          // รวมหัตถการทั้งหมดของวันนี้
          const selectedServices = BillingController._aggregateServices(procedures, allServices);
          console.log('🔧 Debug: Aggregated services:', selectedServices.length, 'services');
          if (selectedServices.length > 0) {
            console.log('🔧 Debug: First service:', selectedServices[0]);
          }
          
          // ตรวจสอบว่ามีข้อมูลหัตถการหรือไม่
          if (procedures.length === 0) {
            console.log('⚠️ Debug: No procedures found, showing empty billing page');
          }
          
          res.render("billing", {
            title: "สรุปค่าใช้จ่าย",
            HN: HN,
            patientName: patientData.fullname,
            procedureData: procedures.length > 0 ? procedures[0] : null,
            allProceduresData: procedures,
            selectedServices: selectedServices,
            billingDate: today,
            success: req.query.success,
            error: req.query.error,
            user: req.user,
            hasProcedures: procedures.length > 0
          });
        });
      });
    });
  }

  /**
   * สร้างใบเสร็จใหม่
   */
  static createBill(req, res) {
    const HN = req.params.HN;
    const billingData = req.body;

    if (!HN || !billingData) {
      return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ข้อมูลไม่ครบถ้วน')}`);
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    const validation = BillingController._validateBillingData(billingData);
    if (!validation.isValid) {
      return res.redirect(`/billing/${HN}?error=${encodeURIComponent(validation.error)}`);
    }

    // ดึงข้อมูลผู้ป่วย
    BillingController._getPatientData(HN, (err, patientData) => {
      if (err) {
        console.error('Error fetching patient:', err);
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ไม่สามารถดึงข้อมูลผู้ป่วยได้')}`);
      }

      if (!patientData) {
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ไม่พบข้อมูลผู้ป่วย')}`);
      }

      // สร้างเลขที่ใบเสร็จ
      generateUniqueBillNumber((err, billNumber) => {
        if (err) {
          console.error('Error generating bill number:', err);
          return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ไม่สามารถสร้างเลขที่ใบเสร็จได้')}`);
        }

        // ประมวลผลข้อมูลใบเสร็จ
        const processedData = BillingController._processBillingData(billingData, patientData, billNumber);
        
        // เพิ่มข้อมูล created_by จากผู้ใช้ที่ login (บันทึกชื่อจริง)
        processedData.created_by = req.user ? (req.user.fullname || req.user.username) : null;
        console.log('Created by user name:', processedData.created_by);
        
        // บันทึกใบเสร็จ
        console.log('Creating bill with data:', processedData);
        BillingModel.createBill(processedData, (err, result) => {
          if (err) {
            console.error('Error creating bill:', err);
            console.error('Processed data:', processedData);
            return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ไม่สามารถสร้างใบเสร็จได้: ' + err.message)}`);
          }

          // อัปเดตสถานะหัตถการให้เป็น "billed"
          const billId = result.insertId;
          BillingController._updateProceduresStatus(HN, getCurrentDate(), billId, (err) => {
            if (err) {
              console.error('Error updating procedures:', err);
              // ไม่ต้อง redirect ไป error เพราะใบเสร็จสร้างสำเร็จแล้ว
            }
            
            // บันทึกสำเร็จ - redirect ไปหน้าใบเสร็จ
            res.redirect(`/billing/detail/${billId}`);
          });
        });
      });
    });
  }

  /**
   * แสดงรายละเอียดใบเสร็จ
   */
  static showBillDetail(req, res) {
    const billId = req.params.billId;

    if (!billId) {
      return res.status(400).render('error', {
        title: "ข้อมูลไม่ถูกต้อง",
        message: "ไม่พบ ID ของใบเสร็จ",
        statusCode: 400,
        error: null
      });
    }

    BillingModel.getBillById(billId, (err, bill) => {
      if (err) {
        console.error('Error fetching bill details:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงรายละเอียดใบเสร็จได้",
          statusCode: 500,
          error: err
        });
      }

      if (!bill) {
        return res.status(404).render('error', {
          title: "ไม่พบใบเสร็จ",
          message: "ไม่พบใบเสร็จที่คุณร้องขอ",
          statusCode: 404,
          error: null
        });
      }

      // service_items ถูก parse แล้วใน BillingModel.getBillById
      let serviceItems = [];
      if (bill.service_items) {
        if (Array.isArray(bill.service_items)) {
          serviceItems = bill.service_items;
        } else {
          console.error('service_items is not an array:', bill.service_items);
          serviceItems = [];
        }
      }
      
      res.render("billDetail", {
        title: "รายละเอียดใบเสร็จ",
        bill: bill,
        serviceItems: serviceItems,
        user: req.user
      });
    });
  }

  /**
   * อัปเดตสถานะการชำระเงิน
   */
  static updatePaymentStatus(req, res) {
    const billId = req.params.billId;
    const paymentData = req.body;

    if (!billId || !paymentData) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ครบถ้วน'
      });
    }

    const updateData = {
      payment_status: paymentData.payment_status || 'paid',
      payment_method: paymentData.payment_method,
      payment_date: paymentData.payment_date || getCurrentMySQLDateTime(),
      patient_paid_amount: parseFloat(paymentData.patient_paid_amount) || 0,
      notes: paymentData.notes
    };
    
    console.log('Updated by user name:', req.user ? (req.user.fullname || req.user.username) : null);

    BillingModel.updateBill(billId, updateData, (err, result) => {
      if (err) {
        console.error('Error updating payment status:', err);
        return res.status(500).json({
          success: false,
          error: 'ไม่สามารถอัปเดตสถานะการชำระเงินได้'
        });
      }

      res.json({
        success: true,
        message: 'อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว'
      });
    });
  }

  /**
   * แสดงประวัติใบเสร็จของผู้ป่วย
   */
  static getPatientBills(req, res) {
    const HN = req.params.HN;

    if (!HN) {
      return res.status(400).render('error', {
        title: "ข้อมูลไม่ถูกต้อง",
        message: "ไม่พบ HN ของผู้ป่วย",
        statusCode: 400,
        error: null
      });
    }

    BillingModel.getPatientBills(HN, (err, bills) => {
      if (err) {
        console.error('Error fetching bill history:', err);
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงประวัติใบเสร็จได้",
          statusCode: 500,
          error: err
        });
      }

      res.render("billHistory", {
        title: "ประวัติใบเสร็จ",
        HN: HN,
        bills: bills || [],
        user: req.user
      });
    });
  }

  // ========== Private Helper Methods ==========

  /**
   * ดึงข้อมูลผู้ป่วย
   */
  static _getPatientData(HN, callback) {
    const db = require('../config/db');
    const query = "SELECT HN, fname, lname, age, gender, phone FROM patient WHERE HN = ?";
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      if (results && results.length > 0) {
        const patient = results[0];
        const patientData = {
          HN: patient.HN,
          fullname: `${patient.fname || ''} ${patient.lname || ''}`.trim(),
          fname: patient.fname,
          lname: patient.lname,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone
        };
        callback(null, patientData);
      } else {
        callback(null, null);
      }
    });
  }

  /**
   * ดึงข้อมูลหัตถการของวันที่ปัจจุบัน
   */
  static _getTodayProcedures(HN, date, callback) {
    const db = require('../config/db');
    
    // ลองดูข้อมูลหัตถการล่าสุดก่อน (ไม่จำกัดวันที่)
    const fallbackQuery = `
      SELECT p.*, 
             u.fullname as created_by_name
      FROM procedures p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.HN = ?
      AND (p.notes NOT LIKE '%สร้างใบเสร็จแล้ว%' OR p.notes IS NULL)
      ORDER BY p.procedure_date DESC, p.created_at DESC
      LIMIT 10
    `;
    
    // Query หลัก - ดูข้อมูลของวันที่ปัจจุบัน
    const mainQuery = `
      SELECT p.*, 
             u.fullname as created_by_name
      FROM procedures p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.HN = ? AND DATE(p.procedure_date) = ?
      AND (p.notes NOT LIKE '%สร้างใบเสร็จแล้ว%' OR p.notes IS NULL)
      ORDER BY p.created_at ASC
    `;
    
    console.log('🔍 Debug: Executing main query with params:', [HN, date]);
    console.log('🔍 Debug: Main Query:', mainQuery);
    
    db.query(mainQuery, [HN, date], (err, results) => {
      if (err) {
        console.error('❌ Database query error:', err);
        return callback(err);
      }
      
      console.log('📊 Debug: Main query results:', results.length, 'records found');
      
      // หากไม่พบข้อมูลของวันที่ปัจจุบัน ให้ลองดูข้อมูลล่าสุด
      if (results.length === 0) {
        console.log('⚠️ Debug: No procedures found for today, trying fallback query...');
        
        db.query(fallbackQuery, [HN], (err, fallbackResults) => {
          if (err) {
            console.error('❌ Fallback query error:', err);
            return callback(err);
          }
          
          console.log('📊 Debug: Fallback query results:', fallbackResults.length, 'records found');
          if (fallbackResults.length > 0) {
            console.log('📊 Debug: Latest procedure:', fallbackResults[0]);
            console.log('📊 Debug: Latest procedure date:', fallbackResults[0].procedure_date);
          }
          
          callback(null, fallbackResults);
        });
      } else {
        if (results.length > 0) {
          console.log('📊 Debug: Sample result:', results[0]);
        }
        callback(null, results);
      }
    });
  }

  /**
   * รวมหัตถการทั้งหมดของวันนี้
   */
  static _aggregateServices(procedures, allServices) {
    const serviceMap = new Map();
    
    console.log('🔧 Debug: Aggregating services from', procedures.length, 'procedures');
    console.log('🔧 Debug: Available services count:', allServices.length);

    procedures.forEach((procedure, index) => {
      console.log(`🔧 Debug: Processing procedure ${index + 1}:`, procedure.procedure_name);
      if (procedure.procedure_name) {
        const serviceNames = procedure.procedure_name.split(', ');

        serviceNames.forEach(serviceName => {
          const service = allServices.find(s => s.service_name === serviceName);
          const quantity = procedure.session_count || 1;

          if (serviceMap.has(serviceName)) {
            // ถ้ามีหัตถการเดิม ให้บวกจำนวนครั้ง
            const existing = serviceMap.get(serviceName);
            existing.quantity += quantity;
          } else {
            // ถ้าไม่มี ให้สร้างใหม่
            if (service) {
              serviceMap.set(serviceName, {
                id: service.id,
                service_name: service.service_name,
                service_code: service.service_code,
                price: parseFloat(service.price),
                unit: service.unit,
                category: service.category,
                quantity: quantity
              });
            } else {
              // ถ้าไม่พบในฐานข้อมูล ให้สร้าง object ใหม่
              serviceMap.set(serviceName, {
                id: null,
                service_name: serviceName,
                service_code: 'UNKNOWN',
                price: 0,
                unit: 'ครั้ง',
                category: 'อื่นๆ',
                quantity: quantity
              });
            }
          }
        });
      }
    });

    const result = Array.from(serviceMap.values());
    console.log('🔧 Debug: Final aggregated services:', result.length, 'services');
    console.log('🔧 Debug: Service map keys:', Array.from(serviceMap.keys()));
    
    return result;
  }

  /**
   * ตรวจสอบข้อมูลใบเสร็จ
   */
  static _validateBillingData(billingData) {
    console.log('Validating billing data:', billingData);
    
    if (!billingData.selectedServices) {
      return { isValid: false, error: 'กรุณาเลือกบริการ' };
    }

    // ตรวจสอบว่า selectedServices เป็น JSON ที่ถูกต้อง
    try {
      const services = JSON.parse(billingData.selectedServices);
      if (!Array.isArray(services) || services.length === 0) {
        return { isValid: false, error: 'กรุณาเลือกบริการอย่างน้อย 1 รายการ' };
      }
    } catch (err) {
      console.error('Error parsing selectedServices:', err);
      return { isValid: false, error: 'ข้อมูลบริการไม่ถูกต้อง' };
    }

    if (!billingData.paymentMethod) {
      return { isValid: false, error: 'กรุณาเลือกวิธีการชำระเงิน' };
    }

    // ตรวจสอบ totalAmount
    const totalAmount = parseFloat(billingData.totalAmount);
    if (!billingData.totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
      return { isValid: false, error: 'จำนวนเงินไม่ถูกต้อง' };
    }

    return { isValid: true };
  }

  /**
   * ประมวลผลข้อมูลใบเสร็จ
   */
  static _processBillingData(billingData, patientData, billNumber) {
    console.log('Processing billing data:', billingData);
    
    // Parse selected services
    let selectedServices = [];
    try {
      selectedServices = JSON.parse(billingData.selectedServices);
      console.log('Parsed services:', selectedServices);
    } catch (err) {
      console.error('Error parsing selectedServices:', err);
      selectedServices = [];
    }

    // คำนวณยอดรวม
    const subtotal = selectedServices.reduce((sum, service) => {
      const price = parseFloat(service.price) || 0;
      const quantity = parseInt(service.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    const discountAmount = parseFloat(billingData.discountAmount) || 0;
    const taxAmount = 0; // ไม่มีภาษี
    const calculatedTotal = subtotal - discountAmount;
    
    // ใช้ totalAmount จากฟอร์ม หรือคำนวณใหม่
    const totalAmount = parseFloat(billingData.totalAmount) || calculatedTotal;
    
    console.log('Calculated totals:', {
      subtotal,
      discountAmount,
      calculatedTotal,
      totalAmount
    });

    return {
      HN: patientData.HN,
      patient_name: patientData.fullname,
      bill_date: getCurrentDate(),
      bill_number: billNumber,
      service_items: JSON.stringify(selectedServices, null, 0),
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_type: billingData.discountType || 'amount',
      discount_reason: billingData.discountReason || '',
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_status: 'paid',
      payment_method: billingData.paymentMethod,
      payment_date: getCurrentMySQLDateTime(), // เพิ่ม payment_date
      patient_paid_amount: totalAmount, // เพิ่ม patient_paid_amount
      insurance_type: billingData.insuranceType || '',
      notes: billingData.notes || '',
      created_by: billingData.createdBy || null // จะถูกแทนที่ด้วย req.user.id ใน createBill
    };
  }

  /**
   * อัปเดตสถานะหัตถการ
   */
  static _updateProceduresStatus(HN, date, billId, callback) {
    const db = require('../config/db');
    const query = `
      UPDATE procedures 
      SET notes = CONCAT(IFNULL(notes, ''), ' | สร้างใบเสร็จแล้ว (Bill ID: ?)')
      WHERE HN = ? AND DATE(procedure_date) = ? AND session_count > 0
    `;
    
    db.query(query, [billId, HN, date], callback);
  }
}

module.exports = BillingController;