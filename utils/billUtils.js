const db = require('../config/db');

/**
 * ดึงวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
 */
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * ดึงวันที่และเวลาปัจจุบันในรูปแบบ ISO string
 */
function getCurrentDateTime() {
  return new Date().toISOString(); // ISO format
}

/**
 * ตรวจสอบว่าเลขที่ใบเสร็จมีอยู่แล้วหรือไม่
 */
function checkBillNumberExists(billNumber, callback) {
  const query = 'SELECT COUNT(*) as count FROM billing WHERE bill_number = ?';
  db.query(query, [billNumber], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0);
  });
}

/**
 * สร้างเลขที่ใบเสร็จแบบต่อเนื่องสำหรับวันปัจจุบัน
 * รูปแบบ: BILL-YYYYMMDD-XXXX (เช่น BILL-20251011-0001)
 */
function generateSequentialBillNumber(callback) {
  const dateStr = getCurrentDate().replace(/-/g, ''); // YYYYMMDD
  const prefix = `BILL-${dateStr}-`;

  const query = `
    SELECT bill_number 
    FROM billing 
    WHERE bill_number LIKE ? 
    ORDER BY bill_number DESC 
    LIMIT 1
  `;

  db.query(query, [`${prefix}%`], (err, results) => {
    if (err) return callback(err);

    let sequence = 1;
    if (results && results.length > 0) {
      const lastBillNumber = results[0].bill_number;
      const lastSequencePart = lastBillNumber.split('-')[2];
      if (lastSequencePart) {
        sequence = parseInt(lastSequencePart) + 1;
      }
    }

    const billNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
    callback(null, billNumber);
  });
}

/**
 * สร้างเลขที่ใบเสร็จที่ไม่ซ้ำกัน
 * ใช้ระบบต่อเนื่องเป็นหลัก แต่มีการตรวจสอบความซ้ำเป็น fallback
 */
function generateUniqueBillNumber(callback) {
  generateSequentialBillNumber((err, billNumber) => {
    if (err) return callback(err, null);
    
    // ในสถานการณ์ที่มีการใช้งานพร้อมกันมาก อาจยังมี race condition
    // แต่ระบบต่อเนื่องจะช่วยลดปัญหานี้ได้มาก
    // หากยังมีปัญหาการซ้ำ constraint ของฐานข้อมูลจะจัดการให้
    callback(null, billNumber);
  });
}

/**
 * สร้างเลขที่ใบเสร็จแบบเก่า (fallback)
 * ใช้เมื่อระบบใหม่มีปัญหา
 */
function generateFallbackBillNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = String(Date.now()).slice(-6);
  return `BILL-${year}-${timestamp}`;
}

/**
 * ตรวจสอบและแก้ไขเลขที่ใบเสร็จที่ซ้ำ
 */
function ensureUniqueBillNumber(callback) {
  generateUniqueBillNumber((err, billNumber) => {
    if (err) {
      console.error('Error generating bill number:', err);
      // ใช้ fallback method
      const fallbackNumber = generateFallbackBillNumber();
      return callback(null, fallbackNumber);
    }
    
    // ตรวจสอบความซ้ำอีกครั้ง (optional)
    checkBillNumberExists(billNumber, (err, exists) => {
      if (err) {
        console.error('Error checking bill number:', err);
        return callback(null, billNumber);
      }
      
      if (exists) {
        // หากซ้ำ ให้สร้างใหม่ (ควรไม่เกิดขึ้นกับระบบต่อเนื่อง)
        console.warn('Bill number exists, generating new one:', billNumber);
        return ensureUniqueBillNumber(callback);
      }
      
      callback(null, billNumber);
    });
  });
}

module.exports = {
  getCurrentDate,
  getCurrentDateTime,
  generateUniqueBillNumber,
  generateSequentialBillNumber,
  checkBillNumberExists,
  generateFallbackBillNumber,
  ensureUniqueBillNumber
};
