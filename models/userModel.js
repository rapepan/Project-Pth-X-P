const db = require("../config/db");

// ฟังก์ชันค้นหาผู้ใช้ตาม username
const getUserByUsername = (username, callback) => {
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

module.exports = {
  getUserByUsername,
};
