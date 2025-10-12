const BillingModel = require('../models/billingModel');
const { generateUniqueBillNumber, getCurrentDate, getCurrentDateTime } = require('../utils/billUtils');

class BillingController {
  // แสดงหน้าจัดการค่าใช้จ่าย
  static showBillingPage(req, res) {
    const HN = req.params.HN;
    const fromProcedure = req.query.fromProcedure === 'true';
    const selectedServices = req.query.selectedServices;
    const totalAmount = req.query.totalAmount;

    if (HN) {
      // ดึงข้อมูลผู้ป่วย
      const db = require('../config/db');
      const patientQuery = "SELECT HN, fname, lname, age, gender, phone FROM patient WHERE HN = ?";
      
      db.query(patientQuery, [HN], (err, patientResults) => {
        if (err) {
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
          error: err
        });
        }

        // เตรียมข้อมูลผู้ป่วย
        let patientData = null;
        if (patientResults && patientResults.length > 0) {
          const patient = patientResults[0];
          patientData = {
            HN: patient.HN,
            fullname: `${patient.fname || ''} ${patient.lname || ''}`.trim(),
            fname: patient.fname,
            lname: patient.lname,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone
          };
        }

        BillingModel.getPatientBills(HN, (err, bills) => {
          if (err) {
            return res.status(500).render('error', {
              title: "เกิดข้อผิดพลาด",
              message: "ไม่สามารถดึงข้อมูลได้",
              error: err
            });
          }

          // แปลงข้อมูลบริการที่ส่งมาจาก procedure
          let procedureServices = [];
          if (fromProcedure && selectedServices) {
            try {
              procedureServices = JSON.parse(selectedServices);
            } catch (err) {
              console.error('Error parsing selectedServices:', err);
            }
          }

          // ใช้ระบบเลขที่ใบเสร็จใหม่
          generateUniqueBillNumber((err, billNumber) => {
            if (err) {
              console.error('Error generating bill number:', err);
              billNumber = `BILL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            }

            res.render("billing-modal", {
              title: "ใบเสร็จ",
              HN: HN,
              patientData: patientData,
              bills: bills || [],
              success: req.query.success,
              error: req.query.error,
              fromProcedure: fromProcedure,
              procedureServices: procedureServices,
              totalAmount: totalAmount || 0,
              billNumber: billNumber,
              currentDate: getCurrentDate(),
              procedureId: req.query.procedureId || null
            });
          });
        });
      });
    } else {
      res.render("billing-modal", {
        title: "จัดการค่าใช้จ่าย",
        HN: null,
        patient: null,
        bills: [],
        success: req.query.success,
        error: req.query.error,
        fromProcedure: false,
        procedureServices: [],
        procedureTotalAmount: 0
      });
    }
  }

  // สร้างใบเสร็จใหม่
  static createBill(req, res) {
    const HN = req.params.HN;
    const billData = req.body || {};


    // ตรวจสอบข้อมูลที่จำเป็น
    if (!billData.serviceItems && !billData.totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ครบถ้วน - กรุณาเลือกบริการหรือระบุจำนวนเงิน'
      });
    }


    // ดึงข้อมูลชื่อผู้ป่วยจากฐานข้อมูล
    const db = require('../config/db');
    const patientQuery = "SELECT fname, lname FROM patient WHERE HN = ?";
    
    db.query(patientQuery, [HN], (err, patientResults) => {
      if (err) {
        console.error('Error fetching patient:', err);
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ไม่สามารถดึงข้อมูลผู้ป่วยได้')}`);
      }

      // เตรียมชื่อผู้ป่วย
      let patientName = 'ผู้ป่วยไม่ระบุชื่อ';
      if (patientResults && patientResults.length > 0) {
        const patient = patientResults[0];
        patientName = `${patient.fname || ''} ${patient.lname || ''}`.trim();
        if (!patientName) {
          patientName = 'ผู้ป่วยไม่ระบุชื่อ';
        }
      }

      // สร้างเลขที่ใบเสร็จแบบต่อเนื่อง
      generateUniqueBillNumber((err, billNumber) => {
        if (err) {
          console.error('Error generating bill number:', err);
          return res.status(500).json({
            success: false,
            error: 'ไม่สามารถสร้างเลขที่ใบเสร็จได้'
          });
        }

        // ดึงวันที่ปัจจุบัน
        const currentDate = getCurrentDate();

        // แปลง service_items จาก JSON string
        let serviceItems = [];
        try {
          if (billData && billData.serviceItems) {
            serviceItems = typeof billData.serviceItems === 'string' 
              ? JSON.parse(billData.serviceItems) 
              : billData.serviceItems || [];
          }
        } catch (e) {
          console.error('Error parsing serviceItems:', e);
          serviceItems = [];
        }

        // แปลง procedure_ids
        let procedureIds = [];
        if (billData && billData.procedureId) {
          procedureIds = [parseInt(billData.procedureId)];
        }

        // คำนวณส่วนลด
        const subtotal = parseFloat(billData?.totalAmount) || 0;
        const discountAmount = parseFloat(billData?.discountAmount) || 0;
        const discountType = billData?.discountType || 'none';
        const discountReason = billData?.discountReason || '';
        const taxAmount = parseFloat(billData?.taxAmount) || 0;
        const totalAmount = subtotal - discountAmount + taxAmount;

        // เตรียมข้อมูลสำหรับ BillingModel ตามโครงสร้างฐานข้อมูล
        const billingData = {
          HN: HN,
          patient_name: patientName,
          bill_date: currentDate, // YYYY-MM-DD format
          bill_number: billNumber,
          diagnosis_id: billData?.diagnosisId || null,
          procedure_ids: procedureIds,
          service_items: serviceItems,
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_type: discountType || 'none',
          discount_reason: discountReason || 'ไม่มีส่วนลด',
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_status: billData?.paymentStatus || 'pending',
          payment_method: billData?.paymentMethod || 'ยังไม่ได้ชำระเงิน',
          payment_date: billData?.paymentDate || null,
          insurance_type: billData?.insuranceType || 'none',
          insurance_claim_amount: parseFloat(billData?.insuranceClaimAmount) || 0,
          patient_paid_amount: parseFloat(billData?.patientPaidAmount) || 0,
          receipt_number: billData?.receiptNumber || 'ยังไม่มีเลขที่ใบเสร็จ',
          cancel_reason: billData?.cancelReason || null,
          cancelled_at: billData?.cancelledAt || null,
          notes: billData?.notes || `ใบเสร็จจากหัตถการ - สร้างอัตโนมัติจากระบบ${req.user ? ` - บันทึกโดย: ${req.user.fullname || req.user.username || 'ไม่ระบุชื่อผู้ใช้'}` : ''}`,
          created_by: req.user ? (req.user.fullname || req.user.username || req.user.email || 'ไม่ระบุชื่อผู้ใช้') : null
        };

        BillingModel.createBill(billingData, (err, result) => {
          if (err) {
            console.error('Error creating bill:', err);
            return res.status(500).json({ 
              success: false, 
              error: err.message 
            });
          }
          
          res.json({
            success: true,
            message: 'สร้างใบเสร็จเรียบร้อย',
            billId: result.insertId,
            billNumber: billingData.bill_number,
            billData: billingData
          });
        });
      });
    });
  }

  // แสดงรายละเอียดใบเสร็จ
  static showBillDetail(req, res) {
    const billId = req.params.billId;
    
    BillingModel.getBillById(billId, (err, bill) => {
      if (err) {
        return res.status(500).render('error', { 
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      if (!bill) {
        return res.status(404).render('error', { 
          title: "ไม่พบข้อมูล",
          message: "ไม่พบใบเสร็จ",
          error: null 
        });
      }
      
      res.render("billingDetail", {
        title: "รายละเอียดใบเสร็จ",
        bill: bill,
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดตสถานะการชำระเงิน
  static updatePaymentStatus(req, res) {
    const billId = req.params.billId;
    const { status } = req.body;

    BillingModel.updatePaymentStatus(billId, status, (err, result) => {
      if (err) {
        return res.redirect(`/billingDetail/${billId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingDetail/${billId}?success=อัปเดตสถานะเรียบร้อย`);
    });
  }

  // อัปเดตการชำระเงิน (alias)
  static updatePayment(req, res) {
    const HN = req.params.HN;
    const updateData = req.body;

    // หา bill ID จาก updateData
    const billId = updateData.billId;
    if (!billId) {
      return res.redirect(`/billing/${HN}?error=${encodeURIComponent('ไม่พบข้อมูลใบเสร็จ')}`);
    }

    BillingModel.updatePaymentStatus(billId, updateData.status, (err, result) => {
      if (err) {
        console.error('Error updating payment:', err);
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing/${HN}?success=อัปเดตการชำระเงินเรียบร้อย`);
    });
  }

  // ยกเลิกใบเสร็จ
  static cancelBill(req, res) {
    const billId = req.params.billId;

    BillingModel.cancelBill(billId, (err, result) => {
      if (err) {
        return res.redirect(`/billingDetail/${billId}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingDetail/${billId}?success=ยกเลิกใบเสร็จเรียบร้อย`);
    });
  }

  // แสดงรายการราคา
  static showPriceList(req, res) {
    BillingModel.getPriceList((err, services) => {
      if (err) {
        return res.status(500).render('error', { 
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลได้",
          error: err 
        });
      }
      
      res.render("billingPricelist", {
        title: "รายการราคา",
        services: services || [],
        success: req.query.success,
        error: req.query.error
      });
    });
  }

  // อัปเดตราคาบริการ
  static updateServicePrice(req, res) {
    const serviceId = req.params.serviceId;
    const { price } = req.body;

    BillingModel.updateServicePrice(serviceId, price, (err, result) => {
      if (err) {
        return res.redirect(`/billingPricelist?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingPricelist?success=อัปเดตราคาเรียบร้อย`);
    });
  }

  // เพิ่มบริการใหม่
  static addNewService(req, res) {
    const serviceData = req.body;

    BillingModel.addNewService(serviceData, (err, result) => {
      if (err) {
        return res.redirect(`/billingPricelist?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billingPricelist?success=เพิ่มบริการเรียบร้อย`);
    });
  }

  // คำนวณส่วนลด
  static calculateDiscount(req, res) {
    const { amount, discountType, discountValue } = req.body;

    BillingModel.calculateDiscount(amount, discountType, discountValue, (err, result) => {
      if (err) {
        return res.redirect(`/billing?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing?success=คำนวณส่วนลดเรียบร้อย&discount=${result.discount}&finalAmount=${result.finalAmount}`);
    });
  }

  // ตรวจสอบประกัน
  static checkInsurance(req, res) {
    const HN = req.params.HN;

    BillingModel.checkInsurance(HN, (err, result) => {
      if (err) {
        return res.redirect(`/billing/${HN}?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing/${HN}?success=ตรวจสอบประกันเรียบร้อย&insurance=${JSON.stringify(result)}`);
    });
  }

  // ยื่นเคลมประกัน
  static submitInsuranceClaim(req, res) {
    const claimData = req.body;

    BillingModel.submitInsuranceClaim(claimData, (err, result) => {
      if (err) {
        return res.redirect(`/billing?error=${encodeURIComponent(err.message)}`);
      }
      res.redirect(`/billing?success=ยื่นเคลมประกันเรียบร้อย`);
    });
  }

  // รายงานรายวัน
  static getDailyReport(req, res) {
    const { date } = req.query;

    BillingModel.getDailyReport(date, (err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานรายวัน",
        type: "daily",
        data: results,
        date: date
      });
    });
  }

  // รายงานรายเดือน
  static getMonthlyReport(req, res) {
    const { year, month } = req.query;

    BillingModel.getMonthlyReport(year, month, (err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานรายเดือน",
        type: "monthly",
        data: results,
        year: year,
        month: month
      });
    });
  }

  // รายงานรายปี
  static getYearlyReport(req, res) {
    const year = req.params.year;

    BillingModel.getYearlyReport(year, (err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานรายปี",
        type: "yearly",
        data: results,
        year: year
      });
    });
  }

  // รายงานลูกหนี้
  static getOutstandingReport(req, res) {
    BillingModel.getOutstandingReport((err, results) => {
      if (err) {
        return res.status(500).render('error', { 
          message: "ไม่สามารถดึงรายงานได้",
          error: err 
        });
      }
      
      res.render("billingReport", {
        title: "รายงานลูกหนี้",
        type: "outstanding",
        data: results
      });
    });
  }

  // ดาวน์โหลดใบแจ้งหนี้
  static downloadInvoice(req, res) {
    const billId = req.params.billId;
    
    BillingModel.getBillById(billId, (err, bill) => {
      if (err) {
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: 'ไม่สามารถดึงข้อมูลได้',
          error: err
        });
      }
      
      if (!bill) {
        return res.status(404).render('error', {
          title: "ไม่พบข้อมูล",
          message: 'ไม่พบใบเสร็จ',
          error: null
        });
      }

      // สร้าง HTML สำหรับใบแจ้งหนี้
      const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ใบแจ้งหนี้ - ${bill.bill_number}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Prompt', sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                    position: relative;
                    overflow-x: auto;
                }
                body::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    opacity: 0.1;
                    pointer-events: none;
                    z-index: -1;
                }
                .document { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2);
                    overflow: hidden;
                    position: relative;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .document::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #4CAF50, #45a049, #4CAF50);
                    background-size: 200% 100%;
                    animation: shimmer 3s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .header { 
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white; 
                    text-align: center; 
                    padding: 40px 20px;
                    position: relative;
                    overflow: hidden;
                }
                .header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: pulse 4s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: 700; 
                    margin-bottom: 15px;
                    text-shadow: 0 3px 6px rgba(0,0,0,0.3);
                    position: relative;
                    z-index: 2;
                    letter-spacing: 1px;
                }
                .header h1 { 
                    font-size: 28px; 
                    font-weight: 600; 
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 2;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .header p { 
                    font-size: 18px; 
                    opacity: 0.95;
                    position: relative;
                    z-index: 2;
                    margin: 8px 0;
                    font-weight: 500;
                }
                .content { 
                    padding: 40px 30px; 
                    position: relative;
                }
                .patient-info { 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 25px; 
                    border-radius: 15px; 
                    margin-bottom: 30px;
                    border-left: 6px solid #4CAF50;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .patient-info:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
                }
                .patient-info h3 { 
                    color: #4CAF50; 
                    margin-bottom: 15px; 
                    font-size: 18px;
                    font-weight: 600;
                }
                .patient-info p { 
                    margin: 8px 0; 
                    font-size: 16px;
                }
                .items-section h3 { 
                    color: #4CAF50; 
                    margin-bottom: 15px; 
                    font-size: 18px;
                    font-weight: 600;
                }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 25px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .items-table th { 
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white; 
                    padding: 15px; 
                    text-align: left; 
                    font-weight: 600;
                    font-size: 16px;
                }
                .items-table td { 
                    padding: 15px; 
                    border-bottom: 1px solid #e9ecef;
                    font-size: 15px;
                }
                .items-table tr:hover { 
                    background-color: #f8f9fa; 
                }
                .total-section { 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 20px; 
                    border-radius: 10px;
                    text-align: right;
                    border-left: 5px solid #4CAF50;
                }
                .total-row { 
                    margin: 10px 0; 
                    font-size: 16px;
                    padding: 5px 0;
                }
                .total-final { 
                    font-size: 20px; 
                    font-weight: 700; 
                    border-top: 2px solid #4CAF50; 
                    padding-top: 15px; 
                    margin-top: 15px;
                    color: #4CAF50;
                }
                .footer { 
                    background: #f8f9fa; 
                    text-align: center; 
                    padding: 20px; 
                    color: #6c757d;
                    font-size: 14px;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .document { box-shadow: none; border-radius: 0; }
                }
            </style>
        </head>
        <body>
            <div class="document">
                <div class="header">
                    <div class="logo">PTH-X-P คลินิกกายภาพบำบัด</div>
                    <h1>ใบแจ้งหนี้</h1>
                    <p>เลขที่: ${bill.bill_number || 'ยังไม่มีเลขที่'}</p>
                    <p>วันที่: ${bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}</p>
                </div>
                
                <div class="content">
                    <div class="patient-info">
                        <h3>ข้อมูลผู้ป่วย</h3>
                        <p><strong>HN:</strong> ${bill.HN || 'ไม่ระบุ'}</p>
                        <p><strong>ชื่อ:</strong> ${bill.patient_name || (bill.patient_fname && bill.patient_lname ? `${bill.patient_fname} ${bill.patient_lname}` : 'ไม่ระบุ')}</p>
                    </div>
                    
                    <div class="payment-status" style="background: linear-gradient(135deg, ${bill.payment_status === 'paid' ? '#4CAF50 0%, #45a049 100%' : '#FF9800 0%, #F57C00 100%'}); color: white; padding: 20px; border-radius: 15px; text-align: center; margin-bottom: 30px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); animation: pulse 3s ease-in-out infinite;"></div>
                        <h3 style="margin: 0; font-size: 20px; font-weight: 600; position: relative; z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${bill.payment_status === 'paid' ? '✅ ชำระเงินเรียบร้อย' : '⏳ ยังไม่ชำระเงิน'}</h3>
                        ${bill.payment_method ? `<p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 16px; position: relative; z-index: 2; font-weight: 500;">วิธีการชำระ: ${bill.payment_method}</p>` : ''}
                    </div>
                    
                    <div class="items-section">
                        <h3>รายการบริการ</h3>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>รายการบริการ</th>
                        <th>จำนวน</th>
                        <th>ราคา</th>
                        <th>รวม</th>
                    </tr>
                </thead>
                <tbody>
                    ${(bill.service_items && Array.isArray(bill.service_items) ? bill.service_items : []).map(item => `
                        <tr>
                            <td>${item.service_name || 'ไม่ระบุ'}</td>
                            <td>${item.quantity || 0}</td>
                            <td>฿${parseFloat(item.price || 0).toLocaleString()}</td>
                            <td>฿${parseFloat(item.total || 0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
                    </table>
                    
                    <div class="total-section">
                        <div class="total-row">ยอดรวมย่อย: ฿${(parseFloat(bill.subtotal) || 0).toLocaleString()}</div>
                        <div class="total-row">ส่วนลด: ฿${(parseFloat(bill.discount_amount) || 0).toLocaleString()}</div>
                        <div class="total-row">ภาษี (7%): ฿${(parseFloat(bill.tax_amount) || 0).toLocaleString()}</div>
                        <div class="total-row total-final">ยอดรวมทั้งสิ้น: ฿${(parseFloat(bill.total_amount) || 0).toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>ขอบคุณที่ใช้บริการ</p>
                    <p>PTH-X-P คลินิกกายภาพบำบัด</p>
                    <p>ใบเสร็จนี้เป็นหลักฐานการชำระเงิน</p>
                </div>
            </div>
        </body>
        </html>
      `;

      // ส่ง HTML response
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${bill.bill_number}.html"`);
      res.send(invoiceHTML);
    });
  }

  // ดาวน์โหลดใบเสร็จ
  static downloadReceipt(req, res) {
    const billId = req.params.billId;
    
    BillingModel.getBillById(billId, (err, bill) => {
      if (err) {
        return res.status(500).render('error', {
          title: "เกิดข้อผิดพลาด",
          message: 'ไม่สามารถดึงข้อมูลได้',
          error: err
        });
      }
      
      if (!bill) {
        return res.status(404).render('error', {
          title: "ไม่พบข้อมูล",
          message: 'ไม่พบใบเสร็จ',
          error: null
        });
      }

      // สร้าง HTML สำหรับใบเสร็จ
      const receiptHTML = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ใบเสร็จ - ${bill.bill_number}</title>
            <style>
                body { font-family: 'Sarabun', sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #10b981; }
                .receipt-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .patient-info { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .items-table th { background-color: #f0fdf4; }
                .total-section { text-align: right; margin-top: 20px; }
                .total-row { margin: 5px 0; }
                .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #10b981; padding-top: 10px; color: #10b981; }
                .paid-status { background: #10b981; color: white; padding: 10px; border-radius: 8px; text-align: center; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">PTH-X-P คลินิกกายภาพบำบัด</div>
                <h1>ใบเสร็จ</h1>
                <p>เลขที่: ${bill.bill_number || 'ยังไม่มีเลขที่'}</p>
                <p>วันที่: ${bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}</p>
            </div>
            
            <div class="paid-status">
                <h2>✅ ชำระเงินเรียบร้อย</h2>
                <p>สถานะ: ${bill.payment_status === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}</p>
                ${bill.payment_method ? `<p>วิธีการชำระ: ${bill.payment_method}</p>` : ''}
            </div>
            
            <div class="receipt-info">
                <div class="patient-info">
                    <h3>ข้อมูลผู้ป่วย</h3>
                    <p><strong>HN:</strong> ${bill.HN || 'ไม่ระบุ'}</p>
                    <p><strong>ชื่อ:</strong> ${bill.patient_name || 'ไม่ระบุ'}</p>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>รายการบริการ</th>
                        <th>จำนวน</th>
                        <th>ราคา</th>
                        <th>รวม</th>
                    </tr>
                </thead>
                <tbody>
                    ${(bill.service_items && Array.isArray(bill.service_items) ? bill.service_items : []).map(item => `
                        <tr>
                            <td>${item.service_name || 'ไม่ระบุ'}</td>
                            <td>${item.quantity || 0}</td>
                            <td>฿${parseFloat(item.price || 0).toLocaleString()}</td>
                            <td>฿${parseFloat(item.total || 0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">ยอดรวมย่อย: ฿${(parseFloat(bill.subtotal) || 0).toLocaleString()}</div>
                <div class="total-row">ส่วนลด: ฿${(parseFloat(bill.discount_amount) || 0).toLocaleString()}</div>
                <div class="total-row">ภาษี (7%): ฿${(parseFloat(bill.tax_amount) || 0).toLocaleString()}</div>
                <div class="total-row total-final">ยอดรวมทั้งสิ้น: ฿${(parseFloat(bill.total_amount) || 0).toLocaleString()}</div>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
                <p>ขอบคุณที่ใช้บริการ</p>
                <p>PTH-X-P คลินิกกายภาพบำบัด</p>
                <p>ใบเสร็จนี้เป็นหลักฐานการชำระเงิน</p>
            </div>
        </body>
        </html>
      `;

      // ส่ง HTML response
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="receipt-${bill.bill_number}.html"`);
      res.send(receiptHTML);
    });
  }
}

module.exports = BillingController;