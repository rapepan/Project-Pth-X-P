const mysql = require("mysql2");
require("dotenv").config();  // เพื่อให้สามารถดึงค่าจากไฟล์ .env ได้

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,  // ดึงค่าจาก .env
  user: process.env.DB_USER,  // ดึงค่าจาก .env
  password: process.env.DB_PASSWORD,  // ดึงค่าจาก .env
  database: process.env.DB_NAME,  // ดึงค่าจาก .env
});

// เชื่อมต่อกับฐานข้อมูล
connection.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("Database connection successful 🎉");
});

module.exports = connection;  // ส่งออกการเชื่อมต่อฐานข้อมูล
