const puppeteer = require('puppeteer');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async generatePDF(htmlContent, options = {}) {
    try {
      await this.init();
      
      const page = await this.browser.newPage();
      
      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        ...options
      });

      await page.close();
      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  async generateFromURL(url, options = {}) {
    try {
      await this.init();
      
      const page = await this.browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        ...options
      });

      await page.close();
      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation from URL error:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PDFGenerator;
