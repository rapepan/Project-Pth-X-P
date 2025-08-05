// Middleware for authentication and authorization

// Check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
}

// Check user role
function checkRole(requiredRole) {
  return function (req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
    }

    // If no specific role required, just check authentication
    if (!requiredRole) {
      return next();
    }

    // Check if user has required role
    if (req.user.role === requiredRole || req.user.role === 'admin') {
      return next();
    }

    res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
      error: null
    });
  };
}

// Check if user is admin
function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?message=กรุณาเข้าสู่ระบบก่อน");
  }

  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "คุณไม่มีสิทธิ์ผู้ดูแลระบบ",
      error: null
    });
  }

  next();
}

// Redirect if already authenticated (for login/register pages)
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
function handleErrors(err, req, res, next) {
  console.error('Error occurred:', err);

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).render('error', {
      title: "ข้อมูลซ้ำ",
      message: "ข้อมูลที่กรอกมีอยู่ในระบบแล้ว",
      error: process.env.NODE_ENV === 'development' ? err : null
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).render('error', {
      title: "เกิดข้อผิดพลาดในฐานข้อมูล",
      message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
      error: process.env.NODE_ENV === 'development' ? err : null
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).render('error', {
      title: "ข้อมูลไม่ถูกต้อง",
      message: "กรุณาตรวจสอบข้อมูลที่กรอก",
      error: process.env.NODE_ENV === 'development' ? err : null
    });
  }

  // Default error
  res.status(err.status || 500).render('error', {
    title: "เกิดข้อผิดพลาด",
    message: err.message || "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err : null
  });
}

// 404 handler
function handle404(req, res) {
  res.status(404).render('error', {
    title: "ไม่พบหน้าที่ต้องการ",
    message: `ไม่พบหน้า ${req.url} ที่คุณต้องการ`,
    error: null
  });
}

module.exports = {
  isAuthenticated,
  checkRole,
  isAdmin,
  redirectIfAuthenticated,
  makeUserAvailable,
  logRequests,
  handleErrors,
  handle404
};