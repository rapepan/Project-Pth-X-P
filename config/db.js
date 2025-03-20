// db.js
const mysql = require("mysql2");

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const connection = mysql.createConnection({
  host: "10.104.22.34", 
  user: "root", 
  password: "BPYodv23927", 
  database: "pth-x-p", 
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

