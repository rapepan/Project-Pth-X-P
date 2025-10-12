const db = require('../config/db');

class ServiceModel {
  // ดึงข้อมูลบริการทั้งหมด
  static getAllServices(callback) {
    const query = "SELECT * FROM service_prices WHERE is_active = 1 ORDER BY service_code";
    db.query(query, callback);
  }

  // ดึงข้อมูลบริการตาม ID
  static getServiceById(id, callback) {
    const query = "SELECT * FROM service_prices WHERE id = ? AND is_active = 1";
    db.query(query, [id], callback);
  }

  // ค้นหาบริการ
  static searchServices(searchTerm, callback) {
    const query = `
      SELECT * FROM service_prices 
      WHERE is_active = 1 
      AND (service_name LIKE ? OR service_code LIKE ?)
      ORDER BY service_code
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern], callback);
  }
}

module.exports = ServiceModel;

