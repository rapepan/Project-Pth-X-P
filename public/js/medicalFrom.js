// คำนวณ BMI อัตโนมัติ
function calculateBMI() {
    const weight = parseFloat(document.getElementById("weight").value);
    const height = parseFloat(document.getElementById("height").value);
    
    if (weight > 0 && height > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        document.getElementById("bmi").value = bmi.toFixed(2);
    }
}

// เพิ่ม event listeners
document.addEventListener('DOMContentLoaded', function() {
    const weightInput = document.getElementById("weight");
    const heightInput = document.getElementById("height");
    
    if (weightInput) {
        weightInput.addEventListener("input", calculateBMI);
    }
    
    if (heightInput) {
        heightInput.addEventListener("input", calculateBMI);
    }
});

// ไม่ต้อง append หน่วยเข้าไปในค่า - ให้ส่งเป็นตัวเลขล้วนๆ
document.getElementById("historyForm").addEventListener("submit", function(event) {
    // ตรวจสอบค่าว่างก่อนส่ง
    const requiredFields = ['weight', 'height', 'bloodPressure', 'pulse', 'o2Sat', 'respiratoryRate', 'symptoms', 'currentHistory', 'pastHistory'];
    
    for (let field of requiredFields) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            event.preventDefault();
            alert(`กรุณากรอก${element.placeholder}`);
            element.focus();
            return false;
        }
    }
    
    // คำนวณ BMI ก่อนส่ง
    calculateBMI();
    
    console.log("Submitting form with data:", {
        weight: document.getElementById("weight").value,
        height: document.getElementById("height").value,
        bloodPressure: document.getElementById("bloodPressure").value,
        pulse: document.getElementById("pulse").value,
        o2Sat: document.getElementById("o2Sat").value,
        respiratoryRate: document.getElementById("respiratoryRate").value,
        bmi: document.getElementById("bmi").value
    });
});

function goBack() {
    window.history.back();
}