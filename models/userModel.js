const db = require("../config/db");

class UserModel {
  // ฟังก์ชันค้นหาผู้ใช้ตาม username
  static getUserByUsername(username, callback) {
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  }

  // ฟังก์ชันค้นหาผู้ใช้ตาม ID
  static getUserById(id, callback) {
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [id], (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results[0]);
      }
    });
  }

  // ฟังก์ชันสร้างผู้ใช้ใหม่
  static createUser(userData, callback) {
    const { username, password, email, fullname, role = 'staff' } = userData;
    const query = `
      INSERT INTO users (username, password, email, fullname, role, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    db.query(query, [username, password, email, fullname, role], callback);
  }

  // ฟังก์ชันอัพเดทผู้ใช้
  static updateUser(id, userData, callback) {
    const { email, fullname, password } = userData;
    let query, params;
    
    if (password) {
      query = "UPDATE users SET email = ?, fullname = ?, password = ? WHERE id = ?";
      params = [email, fullname, password, id];
    } else {
      query = "UPDATE users SET email = ?, fullname = ? WHERE id = ?";
      params = [email, fullname, id];
    }
    
    db.query(query, params, callback);
  }

  // ฟังก์ชันตรวจสอบว่ามี username หรือ email อยู่แล้วหรือไม่
  static checkUserExists(username, email, excludeId = null, callback) {
    let query = "SELECT * FROM users WHERE username = ? OR email = ?";
    let params = [username, email];
    
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    
    db.query(query, params, (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  }

  // ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมด
  static getAllUsers(callback) {
    const query = "SELECT id, username, email, fullname, role, created_at FROM users ORDER BY created_at DESC";
    db.query(query, callback);
  }

  // ฟังก์ชันลบผู้ใช้
  static deleteUser(id, callback) {
    const query = "DELETE FROM users WHERE id = ?";
    db.query(query, [id], callback);
  }
}

module.exports = UserModel;
