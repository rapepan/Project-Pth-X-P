const db = require('../config/db');

class BillingModel {

  // สร้างใบเสร็จ
  static createBill(data, callback) {
    const insertQuery = `
      INSERT INTO billing (
        HN, patient_name, bill_date, bill_number,
        diagnosis_id, procedure_ids, service_items,
        subtotal, discount_amount, discount_type, discount_reason,
        tax_amount, total_amount, payment_status, payment_method,
        payment_date, insurance_type, insurance_claim_amount, patient_paid_amount,
        receipt_number, cancel_reason, cancelled_at, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patient_name,
      data.bill_date,
      data.bill_number,
      data.diagnosis_id || null,
      JSON.stringify(data.procedure_ids || []),
      JSON.stringify(data.service_items || []),
      data.subtotal || 0,
      data.discount_amount || 0,
      data.discount_type || 'none',
      data.discount_reason || '',
      data.tax_amount || 0,
      data.total_amount || 0,
      data.payment_status || 'pending',
      data.payment_method || '',
      data.payment_date || null,
      data.insurance_type || 'none',
      data.insurance_claim_amount || 0,
      data.patient_paid_amount || 0,
      data.receipt_number || '',
      data.cancel_reason || null,
      data.cancelled_at || null,
      data.notes || '',
      data.created_by || null
    ];

    db.query(insertQuery, values, callback);
  }

  // อัปเดตสถานะการชำระเงิน
  static updatePaymentStatus(billId, data, callback) {
    const updateQuery = `
      UPDATE billing
      SET 
        payment_status = ?,
        payment_method = ?,
        patient_paid_amount = ?,
        payment_date = ?,
        receipt_number = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.paymentStatus,
      data.paymentMethod || '',
      data.patientPaidAmount || 0,
      data.paymentDate || new Date(),
      data.receiptNumber || '',
      data.notes || '',
      billId
    ];

    db.query(updateQuery, values, callback);
  }

  // ดึงข้อมูลใบเสร็จตาม ID
  static getBillById(id, callback) {
    const query = `
      SELECT b.*, u.fullname as created_by_name,
             p.fname as patient_fname, p.lname as patient_lname
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      LEFT JOIN patient p ON b.HN = p.HN
      WHERE b.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        const record = results[0];
        const jsonFields = ['procedure_ids', 'service_items'];
        jsonFields.forEach(field => {
          if (record[field]) {
            try {
              record[field] = JSON.parse(record[field]);
            } catch {
              record[field] = [];
            }
          }
        });
      }
      
      callback(null, results.length > 0 ? results[0] : null);
    });
  }

  // ดึงข้อมูลใบเสร็จของผู้ป่วย
  static getPatientBills(HN, callback) {
    const query = `
      SELECT b.*, u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.HN = ?
      ORDER BY b.bill_date DESC, b.created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        const jsonFields = ['procedure_ids', 'service_items'];
        jsonFields.forEach(field => {
          if (record[field]) {
            try {
              record[field] = JSON.parse(record[field]);
            } catch {
              record[field] = [];
            }
          }
        });
      });
      
      callback(null, results);
    });
  }


  // อัปเดตสถานะการชำระเงิน
  static updatePaymentStatus(billId, data, callback) {
    const updateQuery = `
      UPDATE billing
      SET 
        payment_status = ?,
        payment_method = ?,
        insurance_claim_amount = ?,
        patient_paid_amount = ?,
        receipt_number = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.payment_status,
      data.payment_method,
      data.insurance_claim_amount || 0,
      data.patient_paid_amount || 0,
      data.receipt_number || '',
      data.notes || '',
      billId
    ];

    db.query(updateQuery, values, callback);
  }

  // ยกเลิกใบเสร็จ
  static cancelBill(billId, reason, callback) {
    const updateQuery = `
      UPDATE billing
      SET 
        payment_status = 'cancelled',
        notes = CONCAT(IFNULL(notes, ''), '\nยกเลิก: ', ?),
        updated_at = NOW()
      WHERE id = ?
    `;

    db.query(updateQuery, [reason, billId], callback);
  }

  // ดึงรายการราคาบริการ
  static getPriceList(callback) {
    const query = `
      SELECT * FROM service_prices 
      ORDER BY service_name
    `;
    db.query(query, callback);
  }

  // อัปเดตราคาบริการ
  static updateServicePrice(id, price, callback) {
    const updateQuery = `
      UPDATE service_prices
      SET 
        price = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    db.query(updateQuery, [price, id], callback);
  }

  // เพิ่มบริการใหม่
  static addNewService(data, callback) {
    const insertQuery = `
      INSERT INTO service_prices (
        service_code, service_name, service_type, price, description
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      data.service_code,
      data.service_name,
      data.service_type,
      data.price,
      data.description || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // คำนวณส่วนลด
  static calculateDiscount(subtotal, discountType, discountValue, callback) {
    let discountAmount = 0;
    
    switch (discountType) {
      case 'percentage':
        discountAmount = (subtotal * discountValue) / 100;
        break;
      case 'fixed':
        discountAmount = discountValue;
        break;
      default:
        discountAmount = 0;
    }
    
    const finalAmount = Math.max(0, subtotal - discountAmount);
    
    callback(null, {
      discountAmount: discountAmount,
      finalAmount: finalAmount
    });
  }

  // ตรวจสอบประกัน
  static checkInsurance(HN, callback) {
    const query = `
      SELECT insurance_type, coverage_percentage, max_coverage
      FROM patient_insurance 
      WHERE HN = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    db.query(query, [HN], callback);
  }

  // ส่งเรื่องประกัน
  static submitInsuranceClaim(data, callback) {
    const insertQuery = `
      INSERT INTO insurance_claims (
        HN, bill_id, claim_amount, claim_date,
        insurance_type, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.bill_id,
      data.claim_amount,
      data.claim_date || new Date(),
      data.insurance_type,
      data.status || 'submitted',
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // รายงานรายวัน
  static getDailyReport(date, callback) {
    const query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(patient_paid_amount) as total_paid,
        AVG(total_amount) as avg_bill_amount
      FROM billing 
      WHERE DATE(bill_date) = ?
    `;
    db.query(query, [date], callback);
  }

  // รายงานรายเดือน
  static getMonthlyReport(year, month, callback) {
    const query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(patient_paid_amount) as total_paid,
        AVG(total_amount) as avg_bill_amount,
        payment_status,
        COUNT(*) as status_count
      FROM billing 
      WHERE YEAR(bill_date) = ? AND MONTH(bill_date) = ?
      GROUP BY payment_status
    `;
    db.query(query, [year, month], callback);
  }

  // รายงานรายปี
  static getYearlyReport(year, callback) {
    const query = `
      SELECT 
        MONTH(bill_date) as month,
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(patient_paid_amount) as total_paid
      FROM billing 
      WHERE YEAR(bill_date) = ?
      GROUP BY MONTH(bill_date)
      ORDER BY month
    `;
    db.query(query, [year], callback);
  }

  // รายงานค้างชำระ
  static getOutstandingReport(callback) {
    const query = `
      SELECT 
        b.*, 
        p.fname, p.lname,
        u.fullname as created_by_name
      FROM billing b
      LEFT JOIN patient p ON b.HN = p.HN
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.payment_status IN ('pending', 'partial')
      ORDER BY b.bill_date ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        const jsonFields = ['procedure_ids', 'service_items'];
        jsonFields.forEach(field => {
          if (record[field]) {
            try {
              record[field] = JSON.parse(record[field]);
            } catch {
              record[field] = [];
            }
          }
        });
      });
      
      callback(null, results);
    });
  }

  // ดึงประวัติการเงินทั้งหมด
  static getAllBillingHistory(HN, callback) {
    const query = `
      SELECT b.*, u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.HN = ?
      ORDER BY b.bill_date DESC, b.created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        const jsonFields = ['procedure_ids', 'service_items'];
        jsonFields.forEach(field => {
          if (record[field]) {
            try {
              record[field] = JSON.parse(record[field]);
            } catch {
              record[field] = [];
            }
          }
        });
      });
      
      callback(null, results);
    });
  }

  // ยกเลิกใบเสร็จ
  static cancelBill(billId, cancelReason, callback) {
    const updateQuery = `
      UPDATE billing
      SET 
        payment_status = 'cancelled',
        cancel_reason = ?,
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `;
    db.query(updateQuery, [cancelReason, billId], callback);
  }

  // ดึงรายการราคาบริการ
  static getPriceList(callback) {
    const query = `
      SELECT * FROM service_prices
      WHERE is_active = true
      ORDER BY category, service_name
    `;
    db.query(query, callback);
  }

  // อัปเดตราคาบริการ
  static updateServicePrice(serviceId, data, callback) {
    const updateQuery = `
      UPDATE service_prices
      SET 
        service_name = ?,
        price = ?,
        category = ?,
        description = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.serviceName,
      data.price,
      data.category || '',
      data.description || '',
      serviceId
    ];

    db.query(updateQuery, values, callback);
  }

  // เพิ่มบริการใหม่
  static addNewService(data, callback) {
    const insertQuery = `
      INSERT INTO service_prices (
        service_code, service_name, price, category,
        description, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.serviceCode,
      data.serviceName,
      data.price,
      data.category || '',
      data.description || '',
      data.isActive !== false
    ];

    db.query(insertQuery, values, callback);
  }

  // คำนวณส่วนลด
  static calculateDiscount(subtotal, discountType, discountValue, callback) {
    let discountAmount = 0;
    
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      discountAmount = discountValue;
    }
    
    const totalAfterDiscount = subtotal - discountAmount;
    
    callback(null, {
      subtotal,
      discountAmount,
      totalAfterDiscount
    });
  }

  // ตรวจสอบสิทธิ์ประกันสังคม
  static checkInsurance(HN, callback) {
    const query = `
      SELECT insurance_type, insurance_id, insurance_expiry
      FROM patient
      WHERE HN = ?
    `;
    db.query(query, [HN], callback);
  }

  // ส่งเคลมประกัน
  static submitInsuranceClaim(data, callback) {
    const insertQuery = `
      INSERT INTO insurance_claims (
        bill_id, HN, insurance_type, claim_amount,
        claim_number, claim_status, submission_date,
        documents_attached, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.billId,
      data.HN,
      data.insuranceType,
      data.claimAmount,
      data.claimNumber,
      data.claimStatus || 'submitted',
      data.submissionDate || new Date(),
      JSON.stringify(data.documentsAttached || []),
      data.notes || ''
    ];

    db.query(insertQuery, values, callback);
  }

  // รายงานรายรับรายวัน
  static getDailyReport(date, callback) {
    const query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
        COUNT(DISTINCT HN) as unique_patients
      FROM billing
      WHERE DATE(bill_date) = ?
      AND payment_status != 'cancelled'
    `;
    db.query(query, [date], callback);
  }

  // รายงานรายรับรายเดือน
  static getMonthlyReport(year, month, callback) {
    const query = `
      SELECT 
        DATE(bill_date) as date,
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        COUNT(DISTINCT HN) as unique_patients
      FROM billing
      WHERE YEAR(bill_date) = ? AND MONTH(bill_date) = ?
      AND payment_status != 'cancelled'
      GROUP BY DATE(bill_date)
      ORDER BY date
    `;
    db.query(query, [year, month], callback);
  }

  // รายงานรายรับรายปี
  static getYearlyReport(year, callback) {
    const query = `
      SELECT 
        MONTH(bill_date) as month,
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        COUNT(DISTINCT HN) as unique_patients
      FROM billing
      WHERE YEAR(bill_date) = ?
      AND payment_status != 'cancelled'
      GROUP BY MONTH(bill_date)
      ORDER BY month
    `;
    db.query(query, [year], callback);
  }

  // รายงานค้างชำระ
  static getOutstandingReport(callback) {
    const query = `
      SELECT b.*, p.fname, p.lname, p.phone
      FROM billing b
      LEFT JOIN patient p ON b.HN = p.HN
      WHERE b.payment_status = 'pending'
      AND b.bill_date < DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY b.bill_date ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) return callback(err);
      
      results.forEach(record => {
        const jsonFields = ['procedure_ids', 'service_items'];
        jsonFields.forEach(field => {
          if (record[field]) {
            try {
              record[field] = JSON.parse(record[field]);
            } catch {
              record[field] = [];
            }
          }
        });
      });
      
      callback(null, results);
    });
  }

  // สร้างเลขที่ใบเสร็จอัตโนมัติ
  static generateBillNumber(callback) {
    const query = `
      SELECT bill_number FROM billing
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    db.query(query, (err, results) => {
      if (err) return callback(err);
      
      let newBillNumber = 'INV-' + new Date().getFullYear() + '-00001';
      
      if (results.length > 0 && results[0].bill_number) {
        const lastNumber = results[0].bill_number;
        const numberPart = parseInt(lastNumber.split('-').pop()) + 1;
        newBillNumber = 'INV-' + new Date().getFullYear() + '-' + String(numberPart).padStart(5, '0');
      }
      
      callback(null, newBillNumber);
    });
  }
}

module.exports = BillingModel;