// db.js
const mysql = require("mysql2");

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const connection = mysql.createConnection({
  host: "10.104.22.34", // สำหรับ XAMPP ใช้ localhost
  user: "root", // ชื่อผู้ใช้ MySQL
  password: "BPYodv23927", // รหัสผ่าน (ถ้าไม่มีให้เว้นว่าง)
  database: "pth-x-p", // ชื่อฐานข้อมูล
});

// เชื่อมต่อกับฐานข้อมูล
connection.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log(
    "Database connection successful 🎉"
  );
});

module.exports = connection; // ส่งออกการเชื่อมต่อฐานข้อมูล

