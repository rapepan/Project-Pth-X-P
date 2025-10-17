// config/db.js
const mysql = require("mysql2");
require("dotenv").config();

// ใช้ Connection Pool แทน Single Connection
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+07:00'
});

// สร้าง Promise Pool
const promisePool = pool.promise();

// ทดสอบการเชื่อมต่อ
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  console.log("Database connected successfully");
  connection.release();
});

// Handle pool events
pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

// สร้าง wrapper object สำหรับความเข้ากันได้กับ code เดิม
const db = {
  // Query method แบบเดิม
  query: (sql, params, callback) => {
    // Support both (sql, callback) and (sql, params, callback)
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    pool.query(sql, params, (err, results, fields) => {
      if (err) {
        console.error('Query Error:', err.message);
      }
      callback(err, results, fields);
    });
  },
  
  // เพิ่ม method สำหรับ async/await
  queryAsync: (sql, params = []) => {
    return promisePool.query(sql, params)
      .then(([results, fields]) => results);
  },
  
  // Method สำหรับ transaction
  beginTransaction: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err);
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return callback(err);
        }
        callback(null, connection);
      });
    });
  },
  
  // Method สำหรับ health check
  ping: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err);
      
      connection.ping((err) => {
        connection.release();
        callback(err);
      });
    });
  },
  
  // Method สำหรับปิด pool
  end: (callback) => {
    pool.end(callback);
  },
  
  // Export pool เผื่อต้องการใช้งานขั้นสูง
  pool: pool
};

module.exports = db;