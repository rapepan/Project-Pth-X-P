        function toggleCheckbox(item) {
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        }

        function clearForm() {
            if (confirm('คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?')) {
                // Clear all inputs except readonly ones
                document.querySelectorAll('input[type="text"]:not([readonly]), input[type="number"]:not([readonly]), textarea, select:not([disabled])').forEach(input => {
                    input.value = '';
                });
                
                // Clear all checkboxes
                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Remove checked class from checkbox items
                document.querySelectorAll('.checkbox-item').forEach(item => {
                    item.classList.remove('checked');
                });
                
                alert('ล้างข้อมูลเรียบร้อยแล้ว');
            }
        }

        function printForm() {
            window.print();
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

        // Clear form data
        function clearForm() {
            if (confirm('คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?')) {
                document.getElementById('examinationForm').reset();
                
                // Remove checked class from all checkbox items
                document.querySelectorAll('.checkbox-item').forEach(item => {
                    item.classList.remove('checked');
                });
            }
        }

        // Print form
        function printForm() {
            window.print();
        }

        // Initialize checked states on page load
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.closest('.checkbox-item').classList.add('checked');
                }
            });
        });