const db = require("../config/db"); // เชื่อมต่อกับฐานข้อมูล

// ฟังก์ชันค้นหาผู้ป่วย
const searchPatients = (searchTerm, searchType, callback) => {
  if (!searchTerm) {
    return callback(null, []); // ถ้าไม่มีคำค้นหาก็ไม่ต้องส่งข้อมูล
  }

  let query = "";
  switch (searchType) {
    case "name":
      query = `SELECT * FROM patient WHERE name LIKE ?`; // ค้นหาตามชื่อ
      break;
    case "national_id":
      query = `SELECT * FROM patient WHERE national_id LIKE ?`; // ค้นหาตามรหัสประจำตัวประชาชน
      break;
    default:
      query = `SELECT * FROM patient WHERE name LIKE ?`; // ค้นหาตามชื่อเป็นค่าเริ่มต้น
      break;
  }

  db.query(query, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// ฟังก์ชันดึงข้อมูลผู้ป่วยจาก ID
const getPatientById = (id, callback) => {
  const query = "SELECT * FROM patient WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results[0]);
    }
  });
};

// ฟังก์ชันอัปเดตข้อมูลผู้ป่วย
const updatePatient = (id, updatedData, callback) => {
  const query = `
    UPDATE patient 
    SET height = ?, weight = ?, bmi = ?, blood_pressure = ?, treatment_history = ? 
    WHERE id = ?`;
  const { height, weight, bmi, blood_pressure, treatment_history } =
    updatedData;

  db.query(
    query,
    [height, weight, bmi, blood_pressure, treatment_history, id],
    (err, results) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, results);
      }
    }
  );
};

module.exports = {
  searchPatients,
  getPatientById,
  updatePatient,
};
