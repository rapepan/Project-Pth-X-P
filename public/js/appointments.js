// appointments.js - JavaScript สำหรับระบบนัดหมาย

document.addEventListener('DOMContentLoaded', function() {
    initializeAppointments();
});

function initializeAppointments() {
    // Initialize date pickers
    initializeDatePickers();
    
    // Initialize time pickers
    initializeTimePickers();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize status updates
    initializeStatusUpdates();
    
    // Initialize search functionality
    initializeSearch();
    
    
    // Initialize animations
    initializeAnimations();
}

// ===== DATE PICKER INITIALIZATION =====
function initializeDatePickers() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        input.setAttribute('min', today);
        
        // Add change event listener
        input.addEventListener('change', function() {
            validateAppointmentDate(this);
        });
    });
}

// ===== TIME PICKER INITIALIZATION =====
function initializeTimePickers() {
    const timeInputs = document.querySelectorAll('input[type="time"]');
    
    timeInputs.forEach(input => {
        // Set default time if empty
        if (!input.value) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = (Math.ceil(now.getMinutes() / 15) * 15).toString().padStart(2, '0');
            input.value = `${hours}:${minutes}`;
        }
        
        // Add change event listener
        input.addEventListener('change', function() {
            validateAppointmentTime(this);
        });
    });
}

// ===== FORM VALIDATION =====
function initializeFormValidation() {
    const forms = document.querySelectorAll('.appointment-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateAppointmentForm(this)) {
                e.preventDefault();
                return false;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
            }
        });
    });
}

function validateAppointmentForm(form) {
    let isValid = true;
    const errors = [];
    
    // Clear previous errors
    clearFormErrors(form);
    
    // Validate HN
    const hnInput = form.querySelector('input[name="HN"]');
    if (!hnInput || !hnInput.value.trim()) {
        showFieldError(hnInput, 'กรุณากรอกเลข HN');
        isValid = false;
    }
    
    // Validate patient name
    const nameInput = form.querySelector('input[name="patient_name"]');
    if (!nameInput || !nameInput.value.trim()) {
        showFieldError(nameInput, 'กรุณากรอกชื่อผู้ป่วย');
        isValid = false;
    }
    
    // Validate appointment date
    const dateInput = form.querySelector('input[name="appointment_date"]');
    if (!dateInput || !dateInput.value) {
        showFieldError(dateInput, 'กรุณาเลือกวันที่นัดหมาย');
        isValid = false;
    } else if (!validateAppointmentDate(dateInput)) {
        isValid = false;
    }
    
    // Validate appointment time
    const timeInput = form.querySelector('input[name="appointment_time"]');
    if (!timeInput || !timeInput.value) {
        showFieldError(timeInput, 'กรุณาเลือกเวลานัดหมาย');
        isValid = false;
    } else if (!validateAppointmentTime(timeInput)) {
        isValid = false;
    }
    
    // Validate appointment type
    const typeSelect = form.querySelector('select[name="appointment_type"]');
    if (!typeSelect || !typeSelect.value) {
        showFieldError(typeSelect, 'กรุณาเลือกประเภทนัดหมาย');
        isValid = false;
    }
    
    // Show general error if any validation fails
    if (!isValid) {
        showGeneralError(form, 'กรุณาตรวจสอบข้อมูลที่กรอก');
    }
    
    return isValid;
}

function validateAppointmentDate(dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showFieldError(dateInput, 'ไม่สามารถนัดหมายในวันที่ผ่านมาแล้ว');
        return false;
    }
    
    clearFieldError(dateInput);
    return true;
}

function validateAppointmentTime(timeInput) {
    const selectedTime = timeInput.value;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Check if time is within business hours (8:00 - 17:00)
    if (hours < 8 || hours >= 17) {
        showFieldError(timeInput, 'เวลาทำการ: 08:00 - 17:00 น.');
        return false;
    }
    
    clearFieldError(timeInput);
    return true;
}

function showFieldError(field, message) {
    if (!field) return;
    
    clearFieldError(field);
    
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('is-invalid');
    
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors(form) {
    const invalidFields = form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
        clearFieldError(field);
    });
    
    const existingGeneralError = form.querySelector('.general-error');
    if (existingGeneralError) {
        existingGeneralError.remove();
    }
}

function showGeneralError(form, message) {
    const existingError = form.querySelector('.general-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger general-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    form.insertBefore(errorDiv, form.firstChild);
}

// ===== STATUS UPDATES =====
function initializeStatusUpdates() {
    const statusButtons = document.querySelectorAll('.status-update-btn');
    
    statusButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const appointmentId = this.dataset.appointmentId;
            const newStatus = this.dataset.status;
            const statusText = this.dataset.statusText;
            
            if (confirm(`คุณต้องการเปลี่ยนสถานะเป็น "${statusText}" หรือไม่?`)) {
                updateAppointmentStatus(appointmentId, newStatus);
            }
        });
    });
}

async function updateAppointmentStatus(appointmentId, status) {
    try {
        const response = await fetch(`/appointments/${appointmentId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('อัปเดตสถานะสำเร็จ', 'success');
            // Reload page to show updated status
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error');
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        showNotification('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error');
    }
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.querySelector('#appointmentSearch');
    const searchForm = document.querySelector('#searchForm');
    
    if (searchInput && searchForm) {
        // Debounce search input
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 2 || this.value.length === 0) {
                    performSearch(this.value);
                }
            }, 500);
        });
        
        // Handle form submission
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch(searchInput.value);
        });
    }
}

function performSearch(searchTerm) {
    const url = new URL(window.location);
    if (searchTerm.trim()) {
        url.searchParams.set('search', searchTerm.trim());
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.delete('page'); // Reset pagination
    
    window.location.href = url.toString();
}


// ===== ANIMATIONS =====
function initializeAnimations() {
    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe appointment cards
    const appointmentCards = document.querySelectorAll('.appointment-card');
    appointmentCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Animate stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// ===== UTILITY FUNCTIONS =====
function formatThaiDate(dateString) {
    const date = new Date(dateString);
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    
    return `${day} ${month} ${year}`;
}

function formatThaiTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes} น.`;
}

function getStatusColor(status) {
    const colors = {
        'scheduled': '#ffc107',
        'confirmed': '#28a745',
        'completed': '#007bff',
        'cancelled': '#dc3545',
        'no_show': '#6c757d'
    };
    return colors[status] || '#6c757d';
}

function getStatusText(status) {
    const texts = {
        'scheduled': 'รอการยืนยัน',
        'confirmed': 'ยืนยันแล้ว',
        'completed': 'เสร็จสิ้น',
        'cancelled': 'ยกเลิก',
        'no_show': 'ไม่มาตามนัด'
    };
    return texts[status] || status;
}

function getAppointmentTypeText(type) {
    const texts = {
        'examination': 'การตรวจร่างกาย',
        'treatment': 'การรักษา',
        'consultation': 'การปรึกษา',
        'follow_up': 'การติดตามผล',
        'other': 'อื่นๆ'
    };
    return texts[type] || type;
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Prompt', sans-serif;
        font-weight: 500;
        max-width: 400px;
        word-wrap: break-word;
        cursor: pointer;
        transition: all 0.3s ease-out;
        transform: translateX(100%);
        opacity: 0;
    `;
    
    // Set colors based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#d4edda';
            notification.style.color = '#155724';
            notification.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            notification.style.backgroundColor = '#f8d7da';
            notification.style.color = '#721c24';
            notification.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            notification.style.backgroundColor = '#fff3cd';
            notification.style.color = '#856404';
            notification.style.border = '1px solid #ffeaa7';
            break;
        default:
            notification.style.backgroundColor = '#d1ecf1';
            notification.style.color = '#0c5460';
            notification.style.border = '1px solid #bee5eb';
    }
    
    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i> ';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-triangle"></i> ';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-circle"></i> ';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i> ';
    }
    
    notification.innerHTML = icon + message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Auto-hide after 5 seconds (8 seconds for errors)
    const hideDelay = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        hideNotification(notification);
    }, hideDelay);
    
    // Click to dismiss
    notification.addEventListener('click', function() {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== PRINT FUNCTIONALITY =====
function printAppointmentCard(appointmentId) {
    const printWindow = window.open(`/appointments/${appointmentId}/card`, '_blank');
    if (printWindow) {
        printWindow.onload = function() {
            printWindow.print();
        };
    }
}

// ===== EXPORT FUNCTIONALITY =====
function exportAppointments(format = 'csv') {
    const url = new URL(window.location);
    url.searchParams.set('export', format);
    
    window.location.href = url.toString();
}

// Global functions for use in HTML
window.updateAppointmentStatus = updateAppointmentStatus;
window.printAppointmentCard = printAppointmentCard;
window.exportAppointments = exportAppointments;
window.showNotification = showNotification;
window.formatThaiDate = formatThaiDate;
window.formatThaiTime = formatThaiTime;
window.getAppointmentTypeText = getAppointmentTypeText;

