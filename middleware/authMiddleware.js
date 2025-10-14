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

// Check user role - ใช้สำหรับ 3 Role: admin, physical_therapist, staff
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

    const userRole = req.user.role || 'staff';

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

    // Physical Therapist ทำได้ทุกอย่างยกเว้นส่วน Admin
    if (userRole === 'physical_therapist') {
      // ถ้าต้องการ admin ให้ปฏิเสธ
      if (requiredRole === 'admin') {
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
      // นอกเหนือจาก admin ให้ผ่านได้
      return next();
    }

    // ถ้าต้องการ physical_therapist แต่ user ไม่ใช่ physical_therapist หรือ admin
    if (requiredRole === 'physical_therapist' && userRole !== 'physical_therapist' && userRole !== 'admin') {
      if (expectsJson(req)) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็นนักกายภาพบำบัดหรือ Admin)'
        });
      }

      return res.status(403).render('error', {
        title: "ไม่มีสิทธิ์เข้าถึง",
        message: "หน้านี้จำกัดเฉพาะนักกายภาพบำบัดหรือผู้ดูแลระบบเท่านั้น",
        error: null,
        statusCode: 403
      });
    }

    // ถ้าต้องการ staff และมี role เป็น staff, physical_therapist หรือ admin
    if (requiredRole === 'staff' && (userRole === 'staff' || userRole === 'physical_therapist' || userRole === 'admin')) {
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

// Check if user is physical therapist or admin
function checkPhysicalTherapist(req, res, next) {
  if (!req.isAuthenticated()) {
    if (expectsJson(req)) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }
    return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
  }

  const userRole = req.user.role || 'staff';
  if (userRole !== 'physical_therapist' && userRole !== 'admin') {
    if (expectsJson(req)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็นนักกายภาพบำบัดหรือ Admin)'
      });
    }

    return res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "หน้านี้จำกัดเฉพาะนักกายภาพบำบัดหรือผู้ดูแลระบบเท่านั้น",
      error: null,
      statusCode: 403
    });
  }

  next();
}

// Check if user is staff, physical therapist or admin (OLD - ใช้สำหรับหน้าที่ Staff ควรเข้าถึงได้ทั้งหมด)
function checkStaff(req, res, next) {
  if (!req.isAuthenticated()) {
    if (expectsJson(req)) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }
    return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
  }

  const userRole = req.user.role || 'staff';
  if (userRole !== 'staff' && userRole !== 'physical_therapist' && userRole !== 'admin') {
    if (expectsJson(req)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'
      });
    }

    return res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
      error: null,
      statusCode: 403
    });
  }

  next();
}

// Check if user is staff only (สำหรับหน้าที่ Staff เข้าถึงได้เฉพาะ)
function checkStaffOnly(req, res, next) {
  if (!req.isAuthenticated()) {
    if (expectsJson(req)) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }
    return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
  }

  const userRole = req.user.role || 'staff';
  
  // Staff เข้าถึงได้
  if (userRole === 'staff') {
    return next();
  }
  
  // Physical Therapist และ Admin เข้าถึงได้
  if (userRole === 'physical_therapist' || userRole === 'admin') {
    return next();
  }

  // ถ้าไม่ใช่ role ที่อนุญาต
  if (expectsJson(req)) {
    return res.status(403).json({
      success: false,
      message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'
    });
  }

  return res.status(403).render('error', {
    title: "ไม่มีสิทธิ์เข้าถึง",
    message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
    error: null,
    statusCode: 403
  });
}

// Check if user is NOT staff (สำหรับหน้าที่ Staff เข้าถึงไม่ได้)
function checkNotStaff(req, res, next) {
  if (!req.isAuthenticated()) {
    if (expectsJson(req)) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }
    return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
  }

  const userRole = req.user.role || 'staff';
  
  // Staff เข้าถึงไม่ได้
  if (userRole === 'staff') {
    if (expectsJson(req)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Staff ไม่สามารถเข้าถึงได้)'
      });
    }

    return res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "หน้าที่นี้จำกัดเฉพาะนักกายภาพบำบัดและผู้ดูแลระบบเท่านั้น",
      error: null,
      statusCode: 403
    });
  }
  
  // Physical Therapist และ Admin เข้าถึงได้
  next();
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
  checkPhysicalTherapist,
  checkStaff,
  checkStaffOnly,
  checkNotStaff,
  redirectIfAuthenticated,
  makeUserAvailable,
  logRequests,
  handleErrors,
  handle404
};