// procedure.js - JavaScript สำหรับหน้าการรักษา

document.addEventListener('DOMContentLoaded', function() {
    console.log('Procedure page loaded');
    
    // Initialize page
    initializeProcedure();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize procedure page
function initializeProcedure() {
    // Load procedure templates
    loadProcedureTemplates();
    
    // Initialize form validation
    setupFormValidation();
    
    // Load any existing data
    loadExistingData();
}

// Setup event listeners
function setupEventListeners() {
    // Modal close on outside click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('createProcedureModal');
        if (e.target === modal) {
            hideCreateProcedureForm();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideCreateProcedureForm();
        }
    });
    
    // Auto-fill procedure details based on type
    const procedureTypeSelect = document.querySelector('select[name="procedureType"]');
    if (procedureTypeSelect) {
        procedureTypeSelect.addEventListener('change', function() {
            autoFillProcedureDetails(this.value);
        });
    }
    
    // Duration validation
    const durationInput = document.querySelector('input[name="duration"]');
    if (durationInput) {
        durationInput.addEventListener('input', function() {
            validateDuration(this);
        });
    }
}

// Load procedure templates
function loadProcedureTemplates() {
    // Mock procedure templates - ในระบบจริงจะดึงจาก API
    const templates = {
        'manual': {
            name: 'การบำบัดด้วยมือ',
            defaultDuration: 30,
            commonTechniques: 'การดัด, การยืด, การปรับแนวกระดูก',
            frequency: '3 ครั้ง/สัปดาห์'
        },
        'electrotherapy': {
            name: 'การรักษาด้วยไฟฟ้า',
            defaultDuration: 20,
            commonTechniques: 'TENS, Ultrasound, IFC',
            frequency: 'ทุกวัน'
        },
        'exercise': {
            name: 'การออกกำลังกาย',
            defaultDuration: 45,
            commonTechniques: 'การยืด, การเสริมสร้างกล้ามเนื้อ, การฝึกการทรงตัว',
            frequency: 'ทุกวัน'
        },
        'thermal': {
            name: 'การรักษาด้วยความร้อน/เย็น',
            defaultDuration: 15,
            commonTechniques: 'ประคบร้อน, ประคบเย็น, Paraffin wax',
            frequency: '2 ครั้ง/วัน'
        },
        'traction': {
            name: 'การดึง',
            defaultDuration: 20,
            commonTechniques: 'การดึงคอ, การดึงหลัง',
            frequency: 'ทุกวัน'
        },
        'massage': {
            name: 'การนวด',
            defaultDuration: 30,
            commonTechniques: 'การนวดแบบสวีดิช, การนวดแบบลึก',
            frequency: '3 ครั้ง/สัปดาห์'
        }
    };
    
    // Store templates globally
    window.procedureTemplates = templates;
}

// Show create procedure form modal
function showCreateProcedureForm() {
    const modal = document.getElementById('createProcedureModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus first input
        const firstInput = modal.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Hide create procedure form modal
function hideCreateProcedureForm() {
    const modal = document.getElementById('createProcedureModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';

        // Clear form
        clearCreateProcedureForm();
    }
}

// Auto-fill procedure details based on type
function autoFillProcedureDetails(type) {
    if (!window.procedureTemplates || !type) return;
    
    const template = window.procedureTemplates[type];
    if (!template) return;
    
    // Auto-fill duration
    const durationInput = document.querySelector('input[name="duration"]');
    if (durationInput && !durationInput.value) {
        durationInput.value = template.defaultDuration;
    }
    
    // Auto-fill techniques
    const techniquesInput = document.querySelector('textarea[name="techniques"]');
    if (techniquesInput && !techniquesInput.value) {
        techniquesInput.value = template.commonTechniques;
    }
    
    // Auto-fill frequency
    const frequencyInput = document.querySelector('input[name="frequency"]');
    if (frequencyInput && !frequencyInput.value) {
        frequencyInput.value = template.frequency;
    }
}

// Validate duration input
function validateDuration(input) {
    const value = parseInt(input.value);
    
    if (value < 1) {
        showFieldError(input, 'ระยะเวลาต้องมากกว่า 0 นาที');
        return false;
    } else if (value > 120) {
        showFieldError(input, 'ระยะเวลาควรไม่เกิน 120 นาที');
        return false;
    } else {
        clearFieldError(input);
        return true;
    }
}

// Setup form validation
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                return false;
            }
        });
    });
}

// Validate form
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'กรุณากรอกข้อมูลนี้');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Validate duration
    const durationInput = form.querySelector('input[name="duration"]');
    if (durationInput && durationInput.value) {
        if (!validateDuration(durationInput)) {
            isValid = false;
        }
    }
    
    // Validate procedure name length
    const nameInput = form.querySelector('input[name="procedureName"]');
    if (nameInput && nameInput.value.trim().length < 3) {
        showFieldError(nameInput, 'ชื่อการรักษาต้องมีอย่างน้อย 3 ตัวอักษร');
        isValid = false;
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#dc3545';
}

// Clear field error
function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '';
}

// Clear create procedure form
function clearCreateProcedureForm() {
    const form = document.querySelector('#createProcedureModal form');
    if (form) {
        form.reset();
        
        // Clear any field errors
        const fieldErrors = form.querySelectorAll('.field-error');
        fieldErrors.forEach(error => error.remove());
        
        // Reset border colors
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.style.borderColor = '');
    }
}

// Load existing data
function loadExistingData() {
    // Load any existing form data from localStorage or server
    const savedData = localStorage.getItem('procedureFormData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            populateForm(data);
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Populate form with data
function populateForm(data) {
    // Implement form population logic
    console.log('Populating form with data:', data);
}

// Save form data
function saveFormData() {
    const form = document.querySelector('#createProcedureModal form');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem('procedureFormData', JSON.stringify(data));
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    const container = document.querySelector('.main-container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Get procedure statistics (mock function)
function getProcedureStatistics(HN) {
    // Mock data - ในระบบจริงจะดึงจาก API
    const statistics = {
        totalProcedures: 15,
        averageDuration: 28,
        mostCommonType: 'manual',
        effectivenessRate: 85
    };
    
    showAlert(`สถิติการรักษา: รวม ${statistics.totalProcedures} ครั้ง, เฉลี่ย ${statistics.averageDuration} นาที, อัตราความสำเร็จ ${statistics.effectivenessRate}%`, 'info');
    
    return statistics;
}

// Export functions for global access
window.showCreateProcedureForm = showCreateProcedureForm;
window.hideCreateProcedureForm = hideCreateProcedureForm;
window.getProcedureStatistics = getProcedureStatistics;
