const db = require('../config/db');

class BillingModel {
  // สร้างใบเสร็จใหม่
  static createBill(data, callback) {
    const insertQuery = `
        INSERT INTO billing (
          HN, patient_name, bill_date, bill_number,
          service_items, subtotal, discount_amount, discount_type, discount_reason,
          tax_amount, total_amount, payment_status, payment_method,
          payment_date, patient_paid_amount,
          insurance_type, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.HN,
      data.patient_name,
      data.bill_date,
      data.bill_number,
      data.service_items,
      data.subtotal,
      data.discount_amount,
      data.discount_type,
      data.discount_reason,
      data.tax_amount,
      data.total_amount,
      data.payment_status,
      data.payment_method,
      data.payment_date,
      data.patient_paid_amount,
      data.insurance_type,
      data.notes,
      data.created_by
    ];

    db.query(insertQuery, values, callback);
  }

  // ดึงข้อมูลใบเสร็จตาม ID
  static getBillById(id, callback) {
    const query = `
      SELECT b.*, 
             u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        const bill = results[0];
        // แปลง service_items จาก JSON
        if (bill.service_items) {
          try {
            bill.service_items = JSON.parse(bill.service_items);
          } catch (err) {
            console.error('Error parsing service_items:', err);
            bill.service_items = [];
          }
        }
        callback(null, bill);
      } else {
        callback(null, null);
      }
    });
  }

  // ดึงข้อมูลใบเสร็จของผู้ป่วย
  static getPatientBills(HN, callback) {
    const query = `
      SELECT b.*, 
             u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.HN = ?
      ORDER BY b.bill_date DESC, b.created_at DESC
    `;
    
    db.query(query, [HN], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(bill => {
        if (bill.service_items) {
          try {
            bill.service_items = JSON.parse(bill.service_items);
          } catch (err) {
            console.error('Error parsing service_items:', err);
            bill.service_items = [];
          }
        }
      });
      
      callback(null, results);
    });
  }

  // ดึงข้อมูลใบเสร็จทั้งหมด
  static getAllBills(callback) {
    const query = `
      SELECT b.*, 
             u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      ORDER BY b.bill_date DESC, b.created_at DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) return callback(err);
      
      results.forEach(bill => {
        if (bill.service_items) {
          try {
            bill.service_items = JSON.parse(bill.service_items);
          } catch (err) {
            console.error('Error parsing service_items:', err);
            bill.service_items = [];
          }
        }
      });
      
      callback(null, results);
    });
  }

  // อัปเดตใบเสร็จ
  static updateBill(id, data, callback) {
    const updateQuery = `
      UPDATE billing
      SET
        payment_status = ?,
        payment_method = ?,
        payment_date = ?,
        patient_paid_amount = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      data.payment_status,
      data.payment_method,
      data.payment_date,
      data.patient_paid_amount,
      data.notes,
      id
    ];

    db.query(updateQuery, values, callback);
  }

  // ลบใบเสร็จ
  static deleteBill(id, callback) {
    const query = `DELETE FROM billing WHERE id = ?`;
    db.query(query, [id], callback);
  }

  // ยกเลิกใบเสร็จ
  static cancelBill(id, cancelReason, callback) {
    const updateQuery = `
      UPDATE billing
      SET
        payment_status = 'cancelled',
        cancel_reason = ?,
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `;

    db.query(updateQuery, [cancelReason, id], callback);
  }

  // ดึงสถิติการขาย
  static getBillingStatistics(startDate, endDate, callback) {
    let query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN payment_status = 'cancelled' THEN total_amount ELSE 0 END) as cancelled_amount,
        AVG(total_amount) as average_bill_amount
      FROM billing
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND bill_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND bill_date <= ?';
      params.push(endDate);
    }
    
    db.query(query, params, callback);
  }

  // ดึงรายงานการขายรายวัน
  static getDailySalesReport(date, callback) {
    const query = `
      SELECT 
        DATE(bill_date) as sale_date,
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_amount
      FROM billing
      WHERE DATE(bill_date) = ?
      GROUP BY DATE(bill_date)
      ORDER BY sale_date DESC
    `;
    
    db.query(query, [date], callback);
  }

  // ค้นหาใบเสร็จ
  static searchBills(searchTerm, callback) {
    const query = `
      SELECT b.*, 
             u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.bill_number LIKE ? 
         OR b.patient_name LIKE ?
         OR b.HN LIKE ?
      ORDER BY b.bill_date DESC, b.created_at DESC
    `;
    
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern, searchPattern], (err, results) => {
      if (err) return callback(err);
      
      results.forEach(bill => {
        if (bill.service_items) {
          try {
            bill.service_items = JSON.parse(bill.service_items);
          } catch (err) {
            console.error('Error parsing service_items:', err);
            bill.service_items = [];
          }
        }
      });
      
      callback(null, results);
    });
  }

  // ตรวจสอบเลขที่ใบเสร็จซ้ำ
  static checkBillNumberExists(billNumber, callback) {
    const query = 'SELECT COUNT(*) as count FROM billing WHERE bill_number = ?';
    db.query(query, [billNumber], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0].count > 0);
    });
  }

  // ดึงใบเสร็จที่ยังไม่ได้ชำระเงิน
  static getUnpaidBills(callback) {
    const query = `
      SELECT b.*, 
             u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.payment_status = 'pending'
      ORDER BY b.bill_date ASC, b.created_at ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) return callback(err);
      
      results.forEach(bill => {
        if (bill.service_items) {
          try {
            bill.service_items = JSON.parse(bill.service_items);
          } catch (err) {
            console.error('Error parsing service_items:', err);
            bill.service_items = [];
          }
        }
      });
      
      callback(null, results);
    });
  }

  // ดึงใบเสร็จที่ชำระเงินแล้ว
  static getPaidBills(callback) {
    const query = `
      SELECT b.*, 
             u.fullname as created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.payment_status = 'paid'
      ORDER BY b.payment_date DESC, b.created_at DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) return callback(err);
      
      results.forEach(bill => {
        if (bill.service_items) {
          try {
            bill.service_items = JSON.parse(bill.service_items);
          } catch (err) {
            console.error('Error parsing service_items:', err);
            bill.service_items = [];
          }
        }
      });
      
      callback(null, results);
    });
  }
}

module.exports = BillingModel;

