const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const userController = require("./controllers/userController"); // เรียกใช้งาน userController.js
const userRoutes = require("./routes/userRoutes"); // เรียกใช้งาน userRoutes.js
const patientModel = require("./models/patientModel"); // นำเข้า patientModel เพื่อใช้งาน
const db = require("./config/db"); // เชื่อมต่อฐานข้อมูล MySQL
const LocalStrategy = require("passport-local").Strategy;
const app = express();

// ใช้ body-parser สำหรับการรับข้อมูลจากฟอร์ม
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ตั้งค่าให้ Express ใช้ EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ตั้งค่า session
app.use(
  session({
    secret: "PTHKey", // เปลี่ยนเป็นคีย์ที่คุณต้องการ
    resave: false,
    saveUninitialized: false,
  })
);

// ตั้งค่า Passport.js
app.use(passport.initialize());
app.use(passport.session());

// ใช้ routes ของ user
app.use("/register", userRoutes); // เมื่อไปที่ /register จะใช้ userRoutes
app.use("/login", userRoutes); // เมื่อไปที่ /login จะใช้ userRoutes
// ใช้เส้นทางของ userRoutes
app.use("/", userRoutes); // ใช้ '/' เพราะใน userRoutes จะมี /register และ /login อยู่แล้ว

// Route สำหรับหน้า Register
app.get("/register", (req, res) => {
  res.render("register", { message: null }); // ส่งหน้า register.ejs
});

// ตั้งค่า LocalStrategy ของ Passport.js
passport.use(
  new LocalStrategy((username, password, done) => {
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: "ไม่พบผู้ใช้" });

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "รหัสผ่านไม่ถูกต้อง" });
        }
      });
    });
  })
);

// การ serialize และ deserialize
passport.serializeUser((user, done) => {
  done(null, user.id); // เก็บ ID ของผู้ใช้ในการเก็บใน session
});

passport.deserializeUser((id, done) => {
  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [id], (err, user) => {
    done(err, user[0]);
  });
});

// หน้า index
app.get("/index", checkRole('user'), (req, res) => {
  res.render("index", { title: "PTN-X-P", user: req.user });
});

// Route สำหรับหน้าแรก (login)
app.get("/", (req, res) => {
  res.redirect("/login"); // เปลี่ยนหน้าแรกให้ไปที่หน้า login ทันที
});

// ตั้งค่าเส้นทาง GET สำหรับหน้า login
app.get("/login", (req, res) => {
  res.render("login"); // ส่งหน้า login.ejs
});

// รับข้อมูลจากฟอร์มเข้าสู่ระบบ
app.post("/login", userController.loginUser); // ใช้ userController ในการจัดการการล็อกอิน

// ระบบออกจากระบบ
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login"); // กลับไปหน้า login
  });
});

// ฟังก์ชันการตรวจสอบสิทธิ์
function checkRole(role) {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      // ตรวจสอบว่าเป็นผู้ที่ล็อกอินแล้ว
      return next(); // ถ้าเป็นผู้ที่ล็อกอินแล้ว ให้ทำงานต่อไป
    }
    res.redirect("/login"); // ถ้าไม่ได้ล็อกอิน ให้ไปหน้า login
  };
}

// Route สำหรับหน้า Dashboard
app.get("/dashboard", checkRole("user"), (req, res) => {
  res.render("dashboard", { title: "Dashboard", user: req.user });
});

// เส้นทางสำหรับหน้า Dashboard
app.get("/dashboard", checkRole('user'),(req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login"); // ถ้ายังไม่ได้ล็อกอิน จะส่งไปหน้า login
  }
  res.render("dashboard", { title: "Dashboard", user: req.user }); // ส่งข้อมูลผู้ใช้ไปที่หน้า dashboard
});

// หน้าแสดงข้อมูลผู้ป่วย
app.get("/patients", checkRole("user"), (req, res) => {
  const searchTerm = req.query.search || ""; // ค่าค้นหาจากฟอร์ม
  const searchType = req.query.searchType || "HN"; // ค่าประเภทการค้นหาจากฟอร์ม (default = 'name')

  let query = "SELECT * FROM patient";
  let queryParams = [];

  // ตรวจสอบประเภทการค้นหา (HN, fname, national_id)
  if (searchTerm) {
    if (searchType === "HN") {
      query += " WHERE HN LIKE ?";
      queryParams.push(`%${searchTerm}%`);
    } else if (searchType === "fname") {
      query += " WHERE fname LIKE ?";
      queryParams.push(`%${searchTerm}%`);
    } else if (searchType === "national_id") {
      query += " WHERE national_id LIKE ?";
      queryParams.push(`%${searchTerm}%`);
    }
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    } else {
      res.render("patients", { title: "ค้นหาผู้ป่วย", patients: results, searchTerm: searchTerm, searchType: searchType, });
    }
  });
});


// หน้าแสดงฟอร์มสำหรับเพิ่มข้อมูลผู้ป่วยใหม่
app.get("/patients/add", checkRole('user'), (req, res) => {
  res.render("patientForm"); // แสดงหน้า patientForm.ejs
});

app.post("/patients/add", checkRole('user'), (req, res) => {
  const { fname, lname, national_id, gender, phone, age, dob, allergy_history, chronic_diseases, housenumber, moo, soi, subdistrict, district, province, postcode, 
          emergency_fname, emergency_lname, emergency_phone, relationships } = req.body;

  // สร้าง HN ใหม่
  generateHN((err, newHN) => {
    if (err) {
      console.error("Error generating HN:", err);
      return res.status(500).send("ไม่สามารถสร้าง HN ได้");
    }

    // บันทึกข้อมูลลงฐานข้อมูล
    const query = "INSERT INTO patient (HN, fname, lname, national_id, gender, phone, age, dob, allergy_history, chronic_diseases, housenumber, moo, soi, subdistrict, district, province, postcode, emergency_fname, emergency_lname, emergency_phone, relationships) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    const values = [
      newHN, fname, lname, national_id, gender, phone, age, dob, allergy_history, chronic_diseases, housenumber, moo, soi, subdistrict, district, province, postcode,
      emergency_fname, emergency_lname, emergency_phone, relationships
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error during insert:", err);
        return res.status(500).send("ไม่สามารถบันทึกข้อมูลผู้ป่วยได้");
      }
      res.redirect("/patients"); // หลังจากบันทึกแล้วให้กลับไปที่หน้าแสดงข้อมูลผู้ป่วย
    });
  });
});

// เส้นทางสำหรับหน้าแสดงห้องตรวจ
app.get("/examinationroom/:id?", checkRole("user"), (req, res) => {
  const patientId = req.params.id;

  if (patientId) {
    // ถ้ามี patientId ใน URL
    const query = "SELECT * FROM patient WHERE id = ?";
    db.query(query, [patientId], (err, result) => {
      if (err) {
        return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
      }

      if (result.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      // ส่งข้อมูล patient ไปยังหน้า examinationroom
      res.render("examinationroom", { title: "ห้องตรวจ", patient: result[0], user: req.user });
    });
  } else {
    // ถ้าไม่มี patientId ใน URL ส่งค่า default ไป
    res.render("examinationroom", { title: "ห้องตรวจ", patient: null, user: req.user });
  }
});

// เส้นทางสำหรับแสดงข้อมูลการซักประวัติ
app.get("/medicalFrom", checkRole("user"), (req, res) => {
  res.render("medicalFrom", { title: "ซักประวัติ", user: req.user });
});

// เส้นทางสำหรับหน้า medicalFrom โดยการรับ id ของผู้ป่วย
app.get("/medicalFrom/:id", checkRole("user"), (req, res) => {
  const patientId = req.params.id; // รับ id จาก URL

  // ดึงข้อมูลผู้ป่วยจากฐานข้อมูล
  const query = "SELECT * FROM patient WHERE id = ?";
  db.query(query, [patientId], (err, result) => {
    if (err) {
      return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    }

    if (result.length === 0) {
      return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
    }

    // ส่งข้อมูลผู้ป่วยไปยัง medicalFrom.ejs
    res.render("medicalFrom", { title: "ซักประวัติ", patient: result[0], user: req.user,});
  });
});

// Route สำหรับการบันทึกข้อมูลการซักประวัติผู้ป่วย
app.post("/medicalFrom/:id", checkRole("user"), (req, res) => {
  const patientId = req.params.id;
  const { 
    weight, height, bloodPressure, pulse, o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory 
  } = req.body;

  // ดึงข้อมูลชื่อและนามสกุลจากตาราง patient
  const queryPatient = "SELECT fname, lname FROM patient WHERE id = ?";
  db.query(queryPatient, [patientId], (err, result) => {
    if (err) {
      console.error("Error fetching patient data:", err);
      return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    }

    if (result.length === 0) {
      return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
    }

    // ดึงชื่อและนามสกุล
    const fname = result[0].fname;
    const lname = result[0].lname;

    // query สำหรับบันทึกข้อมูลการซักประวัติ
    const query = `
      INSERT INTO medicalfrom (patient_id, fname, lname, weight, height, bloodPressure, pulse, o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      patientId, fname, lname, weight, height, bloodPressure, pulse, o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error during insert:", err);
        return res.status(500).send("ไม่สามารถบันทึกข้อมูลการซักประวัติได้");
      }
      res.redirect(`/examinationroom/${patientId}`); // หลังจากบันทึกเสร็จจะกลับไปที่หน้าข้อมูลผู้ป่วย
    });
  });
});

// Route สำหรับแสดงข้อมูลการซักประวัติ
app.get("/medicalHistory/:id?", checkRole("user"), (req, res) => {
  const patientId = req.params.id;

  // ถ้าไม่พบ patientId, ไม่ต้องดึงข้อมูลจากฐานข้อมูล
  if (!patientId) {
    return res.render("medicaHistory", { title: "ประวัติผู้ป่วย" });
  }

  // ดึงข้อมูลจากตาราง patient
  const patientQuery = "SELECT * FROM patient WHERE id = ?";
  db.query(patientQuery, [patientId], (err, patientResult) => {
    if (err) {
      return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    }

    if (patientResult.length === 0) {
      return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
    }

    // ดึงข้อมูลจากตาราง medicalfrom
    const medicalHistoryQuery = "SELECT * FROM medicalfrom WHERE patient_id = ?";
    db.query(medicalHistoryQuery, [patientId], (err, medicalHistoryResult) => {
      if (err) {
        return res.status(500).send("ไม่สามารถดึงข้อมูลการซักประวัติได้");
      }

      // ส่งข้อมูลผู้ป่วยและการซักประวัติเข้าไปที่หน้า medicalHistory.ejs
      res.render("medicaHistory", { title: "ประวัติผู้ป่วย", patient: patientResult[0], medicalfrom: medicalHistoryResult[0] });
    });
  });
});

// Route สำหรับหน้าแก้ไขข้อมูลการซักประวัติ
app.get("/medicalHistory/edit/:patientId", checkRole("user"), (req, res) => {
  const patientId = req.params.patientId;

  // ดึงข้อมูลการซักประวัติจากฐานข้อมูล
  const queryMedicalHistory = "SELECT * FROM medicalfrom WHERE patient_id = ?";
  db.query(queryMedicalHistory, [patientId], (err, medicalHistoryResult) => {
    if (err) {
      return res.status(500).send("ไม่สามารถดึงข้อมูลการซักประวัติได้");
    }

    if (medicalHistoryResult.length === 0) {
      return res.status(404).send("ไม่พบข้อมูลการซักประวัติ");
    }

    // ดึงข้อมูลผู้ป่วยจากฐานข้อมูล
    const queryPatient = "SELECT * FROM patient WHERE id = ?";
    db.query(queryPatient, [patientId], (err, patientResult) => {
      if (err) {
        return res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
      }

      if (patientResult.length === 0) {
        return res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      }

      // ส่งข้อมูลไปยังฟอร์มสำหรับการแก้ไข
      res.render("editMedicalHistory", { title: "แก้ไขข้อมูลการซักประวัติ", medicalHistory: medicalHistoryResult[0], patient: patientResult[0], patientId: patientId });
    });
  });
});

// Route สำหรับบันทึกการแก้ไขข้อมูลการซักประวัติ
app.post("/medicalHistory/edit/:patientId", checkRole("user"), (req, res) => {
  const patientId = req.params.patientId;
  const { weight, height, bloodPressure, pulse, o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory } = req.body;

  // query สำหรับอัพเดตข้อมูลการซักประวัติ
  const query = `
    UPDATE medicalfrom SET weight = ?, height = ?, bloodPressure = ?, pulse = ?, o2Sat = ?, respiratoryRate = ?, bmi = ?, 
           symptoms = ?, currentHistory = ?, pastHistory = ? WHERE patient_id = ?
  `;

  const values = [weight, height, bloodPressure, pulse, o2Sat, respiratoryRate, bmi, symptoms, currentHistory, pastHistory, patientId];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error during update:", err);
      return res.status(500).send("ไม่สามารถอัพเดตข้อมูลการซักประวัติได้");
    }
    res.redirect(`/medicalHistory/${patientId}`);
  });
});

// Route สำหรับลบข้อมูลการซักประวัติ
app.get("/medicalHistory/delete/:patientId", checkRole("user"), (req, res) => {
  const patientId = req.params.patientId;

  // query สำหรับลบข้อมูลการซักประวัติ
  const query = "DELETE FROM medicalfrom WHERE patient_id = ?";

  db.query(query, [patientId], (err, result) => {
    if (err) {
      console.error("Error during delete:", err);
      return res.status(500).send("ไม่สามารถลบข้อมูลการซักประวัติได้");
    }

    res.redirect(`/patients`);
  });
});

// ฟังก์ชันสำหรับสร้าง HN โดยใช้แค่ปี
function generateHN(callback) {
  const now = new Date();
  const year = (now.getFullYear() + 543).toString().slice(-2); // ใช้ปี พ.ศ. และตัดเอาแค่ 2 หลักสุดท้าย เช่น ปี 2568 เป็น 68

  const yearPart = year; // ปีเป็น 2 หลัก เช่น "68"

  const query = `SELECT MAX(CAST(SUBSTRING(HN, 3) AS UNSIGNED)) AS maxHN FROM patient WHERE HN LIKE '${yearPart}%'`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error in SQL query:", err); // แสดงข้อผิดพลาด SQL
      return callback(err);
    }

    let newHN = yearPart + "0001";  // กำหนดค่าเริ่มต้นเป็น "0001" หากไม่พบข้อมูลในฐานข้อมูล
    if (result[0].maxHN !== null) {
      // เพิ่มเลข 1 ไปที่ HN ที่สูงสุดที่ดึงมา และเพิ่มเลขลำดับที่เป็น 3 หลัก
      newHN = yearPart + String(result[0].maxHN + 1).padStart(4, "0");
    }

    callback(null, newHN);
  });
}

// ตั้งค่า port ที่จะใช้งาน
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running 🚀`);
});
