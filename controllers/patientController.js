const patientModel = require("../models/patientModel");

// ดึงข้อมูลผู้ป่วย
const getPatients = (req, res) => {
  patientModel.getPatients((err, results) => {
    if (err) {
      res.status(500).send("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
    } else {
      res.render("patients", { title: "ข้อมูลผู้ป่วย", patients: results });
    }
  });
};

// เพิ่มข้อมูลผู้ป่วยใหม่
const addPatient = (req, res) => {
  const patientData = req.body;
  patientModel.addPatient(patientData, (err, results) => {
    if (err) {
      res.status(500).send("ไม่สามารถเพิ่มข้อมูลผู้ป่วยได้");
    } else {
      res.redirect("/"); // กลับไปหน้าแรกหลังจากเพิ่มข้อมูล
    }
  });
};

module.exports = {
  getPatients,
  addPatient,
};
