-- สร้างตาราง appointments สำหรับระบบนัดหมาย
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    HN VARCHAR(20) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20),
    patient_email VARCHAR(255),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type ENUM('examination', 'treatment', 'consultation', 'follow_up', 'other') DEFAULT 'examination',
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (HN) REFERENCES patient(HN) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_HN (HN),
    INDEX idx_status (status),
    INDEX idx_appointment_datetime (appointment_date, appointment_time)
);

