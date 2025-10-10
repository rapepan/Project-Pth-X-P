// middleware/authMiddleware.js

// Helper function to check if request expects JSON
function expectsJson(req) {
  return req.url.startsWith('/api/') ||
         (req.headers.accept && req.headers.accept.includes('application/json'));
}

// Check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  // ถ้าเป็น API request ให้ส่ง JSON
  if (expectsJson(req)) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบก่อน'
    });
  }

  res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
}

// Check user role - ใช้สำหรับทั้ง user และ admin
function checkRole(requiredRole) {
  return function (req, res, next) {
    // ตรวจสอบว่า login แล้วหรือยัง
    if (!req.isAuthenticated()) {
      if (expectsJson(req)) {
        return res.status(401).json({
          success: false,
          message: 'กรุณาเข้าสู่ระบบก่อน'
        });
      }
      return res.redirect('/login?message=กรุณาเข้าสู่ระบบก่อน');
    }

    // ถ้าไม่ได้ระบุ role ให้ผ่านได้ (แค่ login)
    if (!requiredRole) {
      return next();
    }

    const userRole = req.user.role || 'user';

    // Admin ผ่านได้ทุกอย่าง
    if (userRole === 'admin') {
      return next();
    }

    // ถ้าต้องการ admin แต่ user ไม่ใช่ admin
    if (requiredRole === 'admin' && userRole !== 'admin') {
      if (expectsJson(req)) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็น Admin)'
        });
      }

      return res.status(403).render('error', {
        title: "ไม่มีสิทธิ์เข้าถึง",
        message: "หน้านี้จำกัดเฉพาะผู้ดูแลระบบเท่านั้น",
        error: null,
        statusCode: 403
      });
    }

    // ถ้าต้องการ user และมี role เป็น user หรือ admin
    if (requiredRole === 'user' && (userRole === 'user' || userRole === 'admin')) {
      return next();
    }

    // ถ้าไม่ตรงเงื่อนไขใดๆ
    if (expectsJson(req)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'
      });
    }

    res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
      error: null,
      statusCode: 403
    });
  };
}

// Strict admin check - เฉพาะ admin เท่านั้น
function checkAdminOnly(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
  }

  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "หน้านี้จำกัดเฉพาะผู้ดูแลระบบเท่านั้น",
      error: null,
      statusCode: 403
    });
  }

  next();
}

// Check if user is admin (alias)
function isAdmin(req, res, next) {
  return checkAdminOnly(req, res, next);
}

// Redirect if already authenticated
function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/index");
  }
  next();
}

// Make user available in all views
function makeUserAvailable(req, res, next) {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
}

// Log requests (for debugging)
function logRequests(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);
  next();
}

// Error handling middleware
// eslint-disable-next-line no-unused-vars
function handleErrors(err, req, res, next) {
  console.error('❌ Error occurred:', err);

  const statusCode = err.status || err.statusCode || 500;

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).render('error', {
      title: "ข้อมูลซ้ำ",
      message: "ข้อมูลที่กรอกมีอยู่ในระบบแล้ว",
      error: process.env.NODE_ENV === 'development' ? err : null,
      statusCode: 400
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).render('error', {
      title: "เกิดข้อผิดพลาดในฐานข้อมูล",
      message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
      error: process.env.NODE_ENV === 'development' ? err : null,
      statusCode: 500
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).render('error', {
      title: "ข้อมูลไม่ถูกต้อง",
      message: "กรุณาตรวจสอบข้อมูลที่กรอก",
      error: process.env.NODE_ENV === 'development' ? err : null,
      statusCode: 400
    });
  }

  // Default error
  res.status(statusCode).render('error', {
    title: "เกิดข้อผิดพลาด",
    message: err.message || "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err : null,
    statusCode: statusCode
  });
}

// 404 handler (deprecated - use app.js handler instead)
function handle404(req, res) {
  res.status(404).render('error', {
    title: "ไม่พบหน้าที่ต้องการ",
    message: `ไม่พบหน้า ${req.url} ที่คุณต้องการ`,
    error: null,
    statusCode: 404
  });
}

module.exports = {
  isAuthenticated,
  checkRole,
  checkAdminOnly,
  isAdmin,
  redirectIfAuthenticated,
  makeUserAvailable,
  logRequests,
  handleErrors,
  handle404
};