        function toggleCheckbox(item) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        }

        function goBack() {
            // ตรวจสอบว่าอยู่ในหน้า patientexamination หรือไม่
            const currentPath = window.location.pathname;
            
            if (currentPath.includes('/patientexamination/')) {
                // ถ้าเป็นหน้า patientexamination ให้ไปที่ examinationHistory
                const hn = currentPath.split('/')[2]; // ดึง HN จาก path
                window.location.href = '/examinationroom/' + hn;
            } else {
                // ถ้าไม่ใช่ให้ไปหน้าหลัก
                window.location.href = '/index';
            }
        }

        // Initialize form
        document.addEventListener('DOMContentLoaded', function() {
            // Add animation to form sections
            const sections = document.querySelectorAll('.form-section');
            sections.forEach((section, index) => {
                setTimeout(() => {
                    section.style.opacity = '0';
                    section.style.transform = 'translateY(20px)';
                    section.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    }, 100);
                }, index * 100);
            });

            // Form validation
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    const patientName = document.querySelector('input[name="patientName"]').value;
                    
                    if (!patientName.trim()) {
                        e.preventDefault();
                        alert('กรุณากรอกชื่อผู้ป่วย');
                        return false;
                    }
                });
            }
        });

        // Toggle checkbox and add visual feedback
        function toggleCheckbox(element) {
            const checkbox = element.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                element.classList.add('checked');
            } else {
                element.classList.remove('checked');
            }
        }


        // Initialize checked states on page load
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.closest('.checkbox-item').classList.add('checked');
                }
            });
        });