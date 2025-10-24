const mysql = require("mysql2");
require("dotenv").config();

// ใช้ Connection Pool แทน Single Connection
const pool = mysql.createPool({
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  charset: process.env.DB_CHARSET || 'utf8mb4',
  
  // Timezone
  timezone: process.env.DB_TIMEZONE || '+07:00',
  
  // Connection settings
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 60000,
  
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// สร้าง Promise Pool
const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:");
    console.error("   Host:", process.env.DB_HOST);
    console.error("   Port:", process.env.DB_PORT);
    console.error("   Database:", process.env.DB_NAME);
    console.error("   Error:", err.message);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return;
  }
  
  console.log("✅ Database connection successful 🎉");
  console.log("   Host:", process.env.DB_HOST);
  console.log("   Database:", process.env.DB_NAME);
  console.log("   Charset:", process.env.DB_CHARSET || 'utf8mb4');
  
  // ตรวจสอบ timezone
  connection.query('SELECT NOW()', (err, results) => {
    if (!err && results.length > 0) {
      console.log("   Current Time:", new Date(results[0]['NOW()']).toLocaleString('th-TH'));
    }
  });
  
  connection.release();
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

const db = {
  query: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    pool.query(sql, params, (err, results, fields) => {
      if (err) {
        console.error('Query Error:', err.message);
        console.error('SQL:', sql);
      }
      callback(err, results, fields);
    });
  },
  
  queryAsync: (sql, params = []) => {
    return promisePool.query(sql, params)
      .then(([results, fields]) => results);
  },
  
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
  
  ping: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err);
      
      connection.ping((err) => {
        connection.release();
        callback(err);
      });
    });
  },
  
  end: (callback) => {
    pool.end(callback);
  },

  pool: pool
};

module.exports = db;