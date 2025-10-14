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
 * ดึงวันที่และเวลาปัจจุบันในรูปแบบ MySQL datetime (YYYY-MM-DD HH:MM:SS)
 */
function getCurrentMySQLDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
  
  // หาเลขที่ใบเสร็จล่าสุดของวันนี้
  const query = `
    SELECT bill_number 
    FROM billing 
    WHERE bill_number LIKE ? 
    ORDER BY bill_number DESC 
    LIMIT 1
  `;
  
  db.query(query, [`${prefix}%`], (err, results) => {
    if (err) return callback(err);
    
    let nextNumber = 1;
    
    if (results.length > 0) {
      const lastBillNumber = results[0].bill_number;
      const lastNumber = parseInt(lastBillNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    const billNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;
    callback(null, billNumber);
  });
}

/**
 * สร้างเลขที่ใบเสร็จที่ไม่ซ้ำ
 */
function generateUniqueBillNumber(callback) {
  generateSequentialBillNumber((err, billNumber) => {
    if (err) return callback(err);
    
    // ตรวจสอบว่าเลขที่ใบเสร็จนี้มีอยู่แล้วหรือไม่
    checkBillNumberExists(billNumber, (err, exists) => {
      if (err) return callback(err);
      
      if (exists) {
        // ถ้ามีอยู่แล้ว ให้สร้างใหม่
        return generateUniqueBillNumber(callback);
      }
      
      callback(null, billNumber);
    });
  });
}

/**
 * คำนวณยอดรวมจากรายการบริการ
 */
function calculateSubtotal(serviceItems) {
  return serviceItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return sum + (price * quantity);
  }, 0);
}

/**
 * คำนวณยอดรวมหลังหักส่วนลด
 */
function calculateTotal(subtotal, discountAmount = 0, taxAmount = 0) {
  return subtotal - discountAmount + taxAmount;
}

/**
 * ตรวจสอบข้อมูลการเรียกเก็บเงิน
 */
function validateBillingData(data) {
  const errors = [];
  
  if (!data.HN) {
    errors.push('ไม่พบ HN ของผู้ป่วย');
  }
  
  if (!data.serviceItems || data.serviceItems.length === 0) {
    errors.push('กรุณาเลือกบริการอย่างน้อย 1 รายการ');
  }
  
  if (!data.paymentStatus) {
    errors.push('กรุณาระบุสถานะการชำระเงิน');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * แปลงข้อมูลบริการเป็น JSON string
 */
function stringifyServiceItems(serviceItems) {
  try {
    return JSON.stringify(serviceItems);
  } catch (e) {
    console.error('Error stringifying service items:', e);
    return '[]';
  }
}

/**
 * แปลง JSON string เป็นข้อมูลบริการ
 */
function parseServiceItems(serviceItemsString) {
  try {
    return JSON.parse(serviceItemsString || '[]');
  } catch (e) {
    console.error('Error parsing service items:', e);
    return [];
  }
}

/**
 * สร้างรายการบริการจากหัตถการ
 */
function createServiceItemsFromProcedures(procedures) {
  return procedures.map(proc => ({
    id: proc.id,
    service_name: proc.procedure_name,
    price: 100, // ราคาคงที่
    quantity: 1
  }));
}

/**
 * จัดรูปแบบจำนวนเงินให้แสดงทศนิยม 2 ตำแหน่ง
 */
function formatCurrency(amount) {
  return parseFloat(amount || 0).toFixed(2);
}

/**
 * จัดรูปแบบวันที่ให้แสดงแบบไทย
 */
function formatThaiDate(date) {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const d = new Date(date);
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.
  
  return `${day} ${month} ${year}`;
}

/**
 * จัดรูปแบบเวลาที่แสดงแบบไทย
 */
function formatThaiTime(date) {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * สร้างข้อมูลสรุปสำหรับรายงาน
 */
function generateBillingSummary(bills) {
  const summary = {
    totalBills: bills.length,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidBills: 0,
    pendingBills: 0
  };
  
  bills.forEach(bill => {
    summary.totalAmount += parseFloat(bill.total_amount || 0);
    
    if (bill.payment_status === 'paid') {
      summary.paidAmount += parseFloat(bill.total_amount || 0);
      summary.paidBills++;
    } else {
      summary.pendingAmount += parseFloat(bill.total_amount || 0);
      summary.pendingBills++;
    }
  });
  
  return summary;
}

module.exports = {
  getCurrentDate,
  getCurrentDateTime,
  getCurrentMySQLDateTime,
  checkBillNumberExists,
  generateSequentialBillNumber,
  generateUniqueBillNumber,
  calculateSubtotal,
  calculateTotal,
  validateBillingData,
  stringifyServiceItems,
  parseServiceItems,
  createServiceItemsFromProcedures,
  formatCurrency,
  formatThaiDate,
  formatThaiTime,
  generateBillingSummary
};
