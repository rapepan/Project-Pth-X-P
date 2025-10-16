// Enhanced Patient Examination Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupCheckboxBehaviors();
    setupInputVisibility();
    setupDetailInputToggle(); // เพิ่มฟังก์ชันใหม่
    setupSubOptionsToggle(); // เพิ่มฟังก์ชันสำหรับ sub-options
    setupFormValidation();
    setupAnimations();
    preventEnterSubmit();
});

// Initialize form
function initializeForm() {
    console.log('Patient Examination Form initialized');
}

// Setup checkbox behaviors
function setupCheckboxBehaviors() {
    // Add click handlers to radio options
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');

        // Add checked class if already checked
        if (checkbox && checkbox.checked) {
            option.classList.add('checked');
        }

        // Add change handler to checkbox
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                toggleRadioOption(option, this);
            });
        }

        // Add click handler to the entire radio option
        option.addEventListener('click', function(e) {
            // Don't trigger if clicking on the input itself
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
    });
}

// Toggle radio option visual state
function toggleRadioOption(option, checkbox) {
    if (checkbox.checked) {
        option.classList.add('checked');
        // ใช้ CSS class แทนการตั้งค่า inline
    } else {
        option.classList.remove('checked');
        // ล้าง inline styles เพื่อให้กลับไปใช้ CSS default
        option.style.backgroundColor = '';
        option.style.borderColor = '';
        option.style.transform = '';
        option.style.boxShadow = '';
    }
}

// Setup input visibility based on checkbox state
function setupInputVisibility() {
    // Get all checkbox items that contain input-detail
    const checkboxItems = document.querySelectorAll('.checkbox-item');

    checkboxItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const inputDetail = item.querySelector('.input-detail');

        if (checkbox && inputDetail) {
            // Initial state - hide if not checked
            inputDetail.style.display = checkbox.checked ? 'block' : 'none';

            // Toggle visibility when checkbox changes
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    inputDetail.style.display = 'block';
                    // Focus on the input field inside
                    const input = inputDetail.querySelector('input, textarea');
                    if (input) {
                        setTimeout(() => input.focus(), 100);
                    }
                } else {
                    inputDetail.style.display = 'none';
                }
            });
        }
    });
}

// Setup detail input toggle - แสดง/ซ่อนช่อง input ตามการเลือก checkbox
function setupDetailInputToggle() {
    // หา checkbox ทั้งหมดที่มีการเชื่อมกับ detail input
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        const checkboxId = checkbox.id;

        // หา detail-input ที่มี data-toggle ตรงกับ checkbox id นี้
        const relatedInputs = document.querySelectorAll(`.detail-input[data-toggle="${checkboxId}"]`);

        if (relatedInputs.length > 0) {
            console.log(`Found ${relatedInputs.length} related inputs for ${checkboxId}`);
            // เริ่มต้น: แสดง input ถ้า checkbox ถูกเลือก หรือมีข้อมูลอยู่แล้ว
            relatedInputs.forEach(input => {
                if (checkbox.checked || input.value.trim() !== '') {
                    input.classList.add('show');
                } else {
                    input.classList.remove('show');
                }
            });

            // เพิ่ม event listener สำหรับการเปลี่ยนแปลง
            checkbox.addEventListener('change', function() {
                relatedInputs.forEach(input => {
                    if (this.checked) {
                        // แสดง input พร้อม animation
                        input.classList.add('show');
                        // โฟกัสที่ input เมื่อแสดง (เฉพาะเมื่อไม่มีข้อมูลอยู่แล้ว)
                        if (input.value.trim() === '') {
                            setTimeout(() => {
                                input.focus();
                            }, 300);
                        }
                    } else {
                        // ซ่อน input แต่เก็บค่าข้อมูลไว้
                        input.classList.remove('show');
                        // ไม่ล้างค่าเมื่อยกเลิกเลือก - เก็บข้อมูลไว้
                    }
                });
            });
        }
    });
}

// Setup sub-options toggle - แสดง/ซ่อนตัวเลือกย่อยเมื่อเลือก checkbox หลัก
function setupSubOptionsToggle() {
    // หา checkbox หลักทั้งหมดที่มี sub-options
    const mainCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    
    mainCheckboxes.forEach(checkbox => {
        const checkboxId = checkbox.id;
        
        // หา sub-options-container ที่มี data-parent ตรงกับ checkbox id นี้
        const subOptionsContainer = document.querySelector(`.sub-options-container[data-parent="${checkboxId}"]`);
        
        if (subOptionsContainer) {
            // ตรวจสอบว่ามีข้อมูลใน sub-options หรือไม่
            const checkedBoxes = subOptionsContainer.querySelectorAll('input[type="checkbox"]:checked');
            const filledInputs = Array.from(subOptionsContainer.querySelectorAll('input[type="text"]')).filter(input => input.value.trim() !== '');
            const hasData = checkedBoxes.length > 0 || filledInputs.length > 0;
            
            // เริ่มต้น: แสดง sub-options ถ้า checkbox ถูกเลือก หรือมีข้อมูลอยู่แล้ว
            if (checkbox.checked || hasData) {
                subOptionsContainer.style.display = 'block';
                subOptionsContainer.style.opacity = '1';
            } else {
                subOptionsContainer.style.display = 'none';
                subOptionsContainer.style.opacity = '0';
            }
            
            // เพิ่ม event listener สำหรับการเปลี่ยนแปลง
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // แสดง sub-options พร้อม animation
                    subOptionsContainer.style.display = 'block';
                    subOptionsContainer.classList.add('slide-down');
                    subOptionsContainer.classList.remove('slide-up');
                    
                    // แสดง detail inputs ที่มีข้อมูลอยู่แล้ว
                    const subDetailInputs = subOptionsContainer.querySelectorAll('.detail-input');
                    subDetailInputs.forEach(input => {
                        if (input.value.trim() !== '') {
                            input.classList.add('show');
                        }
                    });
                } else {
                    // ซ่อน sub-options พร้อม animation
                    subOptionsContainer.classList.add('slide-up');
                    subOptionsContainer.classList.remove('slide-down');
                    
                    setTimeout(() => {
                        subOptionsContainer.style.display = 'none';
                    }, 300);
                    
                    // ไม่ล้างค่า checkbox และ input ใน sub-options - เก็บข้อมูลไว้
                    // เพียงแค่ซ่อน sub-options container
                }
            });
        }
    });
}

// Setup form validation
function setupFormValidation() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const observation = document.querySelector('textarea[name="observation"]');
            const palpation = document.querySelector('textarea[name="palpation"]');

            if (observation && !observation.value.trim()) {
                e.preventDefault();
                alert('กรุณากรอกข้อมูล Observation');
                observation.focus();
                return false;
            }

            if (palpation && !palpation.value.trim()) {
                e.preventDefault();
                alert('กรุณากรอกข้อมูล Palpation');
                palpation.focus();
                return false;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
            }
        });
    }
}

// Setup animations
function setupAnimations() {
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';

        setTimeout(() => {
            section.style.transition = 'all 0.5s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Prevent Enter key from submitting the form
function preventEnterSubmit() {
    const form = document.querySelector('form');
    if (form) {
        // Prevent Enter key on all input fields (except textarea)
        form.addEventListener('keydown', function(e) {
            // ถ้ากด Enter และไม่ใช่ใน textarea
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        });

        // Allow Enter key in textarea for line breaks
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    // Allow default behavior (new line) in textarea
                    // Don't prevent default
                    e.stopPropagation(); // Stop event from bubbling to form
                }
            });
        });

        // Also prevent Enter on regular text inputs
        const inputs = form.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Optional: move to next input field
                    const formElements = Array.from(form.querySelectorAll('input, textarea, select'));
                    const currentIndex = formElements.indexOf(e.target);
                    if (currentIndex < formElements.length - 1) {
                        formElements[currentIndex + 1].focus();
                    }
                    return false;
                }
            });
        });
    }
}

// Navigation function
function goBack() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('/patientexamination/')) {
        const hn = currentPath.split('/')[2];
        window.location.href = '/examinationroom/' + hn;
    } else {
        window.location.href = '/index';
    }
}

// Enhanced checkbox toggle function
function toggleCheckbox(element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
        toggleCheckboxItem(element, checkbox);
    }
}
