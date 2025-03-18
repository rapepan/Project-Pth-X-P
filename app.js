const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const passportConfig = require("./config/passportConfig"); // ใช้ passportConfig.js สำหรับตั้งค่า Passport
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

  patientModel.searchPatients(searchTerm, searchType, (err, results) => {
    if (err) {
      res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    } else {
      res.render("patients", {
        title: "ข้อมูลผู้ป่วย",
        patients: results,
        searchTerm: searchTerm,
        searchType: searchType,
      });
    }
  });
});

// หน้าแสดงประวัติการรักษาของผู้ป่วย
app.get("/patients/history/:id", checkRole("user"), (req, res) => {
  const patientId = req.params.id;

  // ดึงข้อมูลล่าสุดจาก patient (is_active = true)
  const query = "SELECT * FROM patient WHERE id = ? AND is_active = true";
  db.query(query, [patientId], (err, result) => {
    if (err) {
      res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยล่าสุดได้");
      return;
    }

    // ดึงข้อมูลเก่าจาก patient_history (is_active = false)
    const historyQuery = "SELECT * FROM patient_history WHERE patient_id = ? AND is_active = false ORDER BY updated_at DESC";
    db.query(historyQuery, [patientId], (err, historyResults) => {
      if (err) {
        res.status(500).send("ไม่สามารถดึงข้อมูลประวัติได้");
        return;
      }

      res.render("patientHistory", {
        title: "ประวัติการรักษาผู้ป่วย",
        patient: result[0],  // ข้อมูลล่าสุดจาก patient
        history: historyResults  // ข้อมูลเก่าจาก patient_history
      });
    });
  });
});

// หน้าอัปเดตข้อมูลผู้ป่วย
app.get("/patients/update/:id", checkRole("user"), (req, res) => {
  const patientId = req.params.id;

  patientModel.getPatientById(patientId, (err, patient) => {
    if (err) {
      res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    } else {
      res.render("updatePatient", {
        title: "อัปเดตข้อมูลผู้ป่วย",
        patient: patient,
      });
    }
  });
});

// อัปเดตข้อมูลผู้ป่วยและเก็บประวัติการอัปเดต
app.post("/patients/update/:id", checkRole("user"), (req, res) => {
  const patientId = req.params.id;
  const { height, weight, bmi, blood_pressure, treatment_history } = req.body;

  // ดึงข้อมูลเก่าจากฐานข้อมูล
  const query = "SELECT * FROM patient WHERE id = ?";
  
  db.query(query, [patientId], (err, result) => {
    if (err) {
      res.status(500).send("ไม่สามารถดึงข้อมูลได้");
      return; 
    }
    if (result.length === 0) {
      res.status(404).send("ไม่พบข้อมูลผู้ป่วย");
      return;
    }

    const patient = result[0]; // ข้อมูลผู้ป่วยเก่า

    // บันทึกข้อมูลที่มีการเปลี่ยนแปลงใน patient_history
    const historyQuery = `
      INSERT INTO patient_history (patient_id, HN, name, national_id, age, gender, address, height, weight, bmi, blood_pressure, chronic_diseases, reason_for_visit, treatment_history, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const historyValues = [
      patientId,
      patient.HN,
      patient.name,
      patient.national_id,
      patient.age,
      patient.gender,
      patient.address,
      patient.height,
      patient.weight,
      patient.bmi,
      patient.blood_pressure,
      patient.chronic_diseases,
      patient.reason_for_visit,
      patient.treatment_history,
      false // สถานะข้อมูลเก่า
    ];

    // อัปเดตข้อมูลใน patients
    const updateQuery = "UPDATE patient SET height = ?, weight = ?, bmi = ?, blood_pressure = ?, treatment_history = ?, is_active = TRUE WHERE id = ?";
    db.query(updateQuery, [height, weight, bmi, blood_pressure, treatment_history, patientId], (err, result) => {
      if (err) {
        res.status(500).send("ไม่สามารถอัปเดตข้อมูลได้");
      } else {
        // บันทึกประวัติการอัปเดต
        db.query(historyQuery, historyValues, (err, result) => {
          if (err) {
            res.status(500).send("ไม่สามารถบันทึกประวัติได้");
          } else {
            res.redirect("/patients");
          }
        });
      }
    });
  });
});

// หน้าแสดงฟอร์มสำหรับเพิ่มข้อมูลผู้ป่วยใหม่
app.get("/patients/add", checkRole('user'), (req, res) => {
  res.render("patientForm"); // แสดงหน้า patientForm.ejs
});

// เส้นทางสำหรับรับข้อมูลจากฟอร์มและบันทึกข้อมูลผู้ป่วยใหม่
app.post("/patients/add", checkRole('user'), (req, res) => {
  const { name, national_id, age, gender, address, height, weight, bmi, blood_pressure, chronic_diseases, reason_for_visit, treatment_history } = req.body;

// สร้าง HN ใหม่ (คุณอาจใช้วิธีการสร้าง HN ตามที่ได้กล่าวไว้ก่อนหน้านี้)
generateHN((err, newHN) => {
  if (err) {
    return res.status(500).send("ไม่สามารถสร้าง HN ได้");
  }

  // บันทึกข้อมูลลงฐานข้อมูล
  const query = "INSERT INTO patient (HN, name, national_id, age, gender, address, height, weight, bmi, blood_pressure, chronic_diseases, reason_for_visit, treatment_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [newHN, name, national_id, age, gender, address, height, weight, bmi, blood_pressure, chronic_diseases, reason_for_visit, treatment_history];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).send("ไม่สามารถบันทึกข้อมูลผู้ป่วยได้");
    }
    res.redirect("/patients"); // หลังจากบันทึกแล้วให้กลับไปที่หน้าแสดงข้อมูลผู้ป่วย
  });
});
});

// ฟังก์ชันสำหรับสร้าง HN 
function generateHN(callback) {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // เอาแค่ 2 หลักสุดท้ายของปี
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // เดือนต้องเป็นสองหลัก
  const day = now.getDate().toString().padStart(2, '0'); // วันต้องเป็นสองหลัก

  const datePart = year + month + day; // ปีเดือนวัน เช่น "250318"

  // สร้าง query เพื่อหาค่า HN ที่สูงสุดจากฐานข้อมูลในวันที่เดียวกัน
  const query = `SELECT MAX(CAST(SUBSTRING(HN, 7) AS UNSIGNED)) AS maxHN FROM patient WHERE HN LIKE '${datePart}%'`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error in SQL query:", err); // แสดงข้อผิดพลาด SQL
      return callback(err);
    }

    console.log("SQL result:", result); // แสดงผลลัพธ์จาก query

    let newHN = datePart + "01";  // กำหนดค่าเริ่มต้นเป็น "01" หากไม่พบข้อมูลในฐานข้อมูล
    if (result[0].maxHN !== null) {
      // เพิ่มเลข 1 ไปที่ HN ที่สูงสุดที่ดึงมา
      newHN = datePart + String(result[0].maxHN + 1).padStart(2, "0");
    }

    callback(null, newHN); // ส่งค่า HN ที่สร้างไปยัง callback
  });
}

// ตั้งค่า port ที่จะใช้งาน
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running 🚀`);
});
