-- สร้างตาราง appointments สำหรับระบบนัดหมาย
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    HN VARCHAR(20) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type ENUM('examination', 'treatment', 'consultation', 'follow_up') DEFAULT 'examination',
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (HN) REFERENCES patient(HN) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_HN (HN),
    INDEX idx_status (status)
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO appointments (HN, patient_name, appointment_date, appointment_time, appointment_type, status, notes, created_by) VALUES
('25001', 'สมชาย ใจดี', '2025-01-15', '09:00:00', 'examination', 'scheduled', 'นัดตรวจร่างกายครั้งแรก', 1),
('25002', 'สมหญิง รักดี', '2025-01-15', '10:30:00', 'treatment', 'confirmed', 'นัดทำกายภาพบำบัด', 1),
('25003', 'สมศักดิ์ เก่งดี', '2025-01-16', '14:00:00', 'follow_up', 'scheduled', 'นัดติดตามผล', 1);
