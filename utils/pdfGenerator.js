const puppeteer = require('puppeteer');
const path = require('path');

class PDFGenerator {
  // สร้าง PDF จาก HTML template
  static async generatePDF(templateData, templateName, options = {}) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // สร้าง HTML content
      const htmlContent = this.generateHTMLContent(templateData, templateName);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // กำหนด options สำหรับ PDF
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // สร้าง HTML content สำหรับแต่ละประเภทรายงาน
  static generateHTMLContent(data, templateName) {
    const baseHTML = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body {
            font-family: 'Sarabun', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
          }
          
          .header p {
            color: #7f8c8d;
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          
          .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
          }
          
          .summary h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .summary-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .summary-item .number {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            display: block;
          }
          
          .summary-item .label {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 5px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          
          .data-table th {
            background: #667eea;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
          }
          
          .data-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
          }
          
          .data-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
          }
          
          .no-data {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.title}</h1>
          <p>วันที่สร้างรายงาน: ${data.generatedDate}</p>
        </div>
        
        ${this.generateSummarySection(data)}
        ${this.generateDataSection(data, templateName)}
        
        <div class="footer">
          <p>รายงานนี้ถูกสร้างโดยระบบ Pth-X-P | ${new Date().toLocaleString('th-TH')}</p>
        </div>
      </body>
      </html>
    `;

    return baseHTML;
  }

  // สร้างส่วนสรุปข้อมูล
  static generateSummarySection(data) {
    if (data.title.includes('ผู้ป่วย')) {
      return `
        <div class="summary">
          <h3>สรุปข้อมูล</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="number">${data.totalPatients}</span>
              <span class="label">ผู้ป่วยทั้งหมด</span>
            </div>
          </div>
        </div>
      `;
    } else if (data.title.includes('นัดหมาย')) {
      return `
        <div class="summary">
          <h3>สรุปข้อมูล</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="number">${data.totalAppointments}</span>
              <span class="label">นัดหมายทั้งหมด</span>
            </div>
          </div>
        </div>
      `;
    } else if (data.title.includes('การเงิน')) {
      return `
        <div class="summary">
          <h3>สรุปข้อมูล</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="number">${data.totalRevenue.toLocaleString()}</span>
              <span class="label">รายได้ทั้งหมด (บาท)</span>
            </div>
            <div class="summary-item">
              <span class="number">${data.paidBills}</span>
              <span class="label">บิลที่ชำระแล้ว</span>
            </div>
            <div class="summary-item">
              <span class="number">${data.pendingBills}</span>
              <span class="label">บิลที่ยังไม่ชำระ</span>
            </div>
            <div class="summary-item">
              <span class="number">${data.totalBills}</span>
              <span class="label">บิลทั้งหมด</span>
            </div>
          </div>
        </div>
      `;
    } else if (data.title.includes('ผู้ใช้งาน')) {
      return `
        <div class="summary">
          <h3>สรุปข้อมูล</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="number">${data.totalUsers}</span>
              <span class="label">ผู้ใช้งานทั้งหมด</span>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }

  // สร้างส่วนแสดงข้อมูล
  static generateDataSection(data, templateName) {
    if (templateName === 'patients' && data.patients && data.patients.length > 0) {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>HN</th>
              <th>ชื่อ-นามสกุล</th>
              <th>เบอร์โทร</th>
              <th>วันเกิด</th>
              <th>วันที่ลงทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            ${data.patients.map(patient => `
              <tr>
                <td>${patient.HN || '-'}</td>
                <td>${patient.firstname} ${patient.lastname}</td>
                <td>${patient.phone || '-'}</td>
                <td>${patient.birthdate ? new Date(patient.birthdate).toLocaleDateString('th-TH') : '-'}</td>
                <td>${patient.created_at ? new Date(patient.created_at).toLocaleDateString('th-TH') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (templateName === 'appointments' && data.appointments && data.appointments.length > 0) {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>HN</th>
              <th>ชื่อผู้ป่วย</th>
              <th>วันที่นัด</th>
              <th>เวลา</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${data.appointments.map(appointment => `
              <tr>
                <td>${appointment.HN || '-'}</td>
                <td>${appointment.patient_name || '-'}</td>
                <td>${appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('th-TH') : '-'}</td>
                <td>${appointment.appointment_time || '-'}</td>
                <td>${appointment.status || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (templateName === 'financial' && data.billing && data.billing.length > 0) {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>หมายเลขบิล</th>
              <th>HN</th>
              <th>ชื่อผู้ป่วย</th>
              <th>วันที่ออกบิล</th>
              <th>ยอดรวม</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${data.billing.map(bill => `
              <tr>
                <td>${bill.bill_number || '-'}</td>
                <td>${bill.HN || '-'}</td>
                <td>${bill.patient_name || '-'}</td>
                <td>${bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('th-TH') : '-'}</td>
                <td>${bill.total_amount ? parseFloat(bill.total_amount).toLocaleString() : '-'}</td>
                <td>${bill.payment_status === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (templateName === 'users' && data.users && data.users.length > 0) {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>ชื่อผู้ใช้</th>
              <th>ชื่อ-นามสกุล</th>
              <th>อีเมล</th>
              <th>ระดับผู้ใช้</th>
              <th>วันที่สร้าง</th>
            </tr>
          </thead>
          <tbody>
            ${data.users.map(user => `
              <tr>
                <td>${user.username || '-'}</td>
                <td>${user.fullname || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.role === 'admin' ? 'Admin' : user.role === 'physical_therapist' ? 'Physical Therapist' : 'Staff'}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      return '<div class="no-data">ไม่มีข้อมูลในรายงานนี้</div>';
    }
  }
}

module.exports = PDFGenerator;
