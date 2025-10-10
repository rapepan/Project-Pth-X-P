// billing.js - JavaScript สำหรับหน้าจัดการค่าใช้จ่าย

document.addEventListener('DOMContentLoaded', function() {
    console.log('Billing page loaded');
    
    // Initialize page
    initializeBilling();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize billing page
function initializeBilling() {
    // Load services for dropdown
    loadServices();
    
    // Initialize form validation
    setupFormValidation();
    
    // Load any existing data
    loadExistingData();
}

// Setup event listeners
function setupEventListeners() {
    // Modal close on outside click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('createBillModal');
        if (e.target === modal) {
            hideCreateBillForm();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideCreateBillForm();
        }
    });
    
    // Auto-calculate totals
    document.addEventListener('input', function(e) {
        if (e.target.name === 'servicePrice' || e.target.name === 'discount') {
            calculateTotal();
        }
    });
}

// Show create bill form modal
function showCreateBillForm() {
    const modal = document.getElementById('createBillModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Hide create bill form modal
function hideCreateBillForm() {
    const modal = document.getElementById('createBillModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form
        clearCreateBillForm();
    }
}

// Load services for dropdown
function loadServices() {
    // Mock services data - ในระบบจริงจะดึงจาก API
    const services = [
        { id: 1, name: 'การตรวจประเมิน', price: 500 },
        { id: 2, name: 'การรักษาด้วยไฟฟ้า', price: 300 },
        { id: 3, name: 'การนวด', price: 400 },
        { id: 4, name: 'การออกกำลังกาย', price: 350 },
        { id: 5, name: 'การประคบร้อน/เย็น', price: 200 },
        { id: 6, name: 'การดึงคอ/หลัง', price: 450 },
        { id: 7, name: 'การตรวจความแข็งแรง', price: 250 },
        { id: 8, name: 'การฝึกการทรงตัว', price: 380 }
    ];
    
    // Store services globally for use in forms
    window.availableServices = services;
}

// Add service to bill
function addService() {
    const servicesList = document.getElementById('servicesList');
    if (!servicesList) return;
    
    const serviceCount = servicesList.children.length;
    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';
    serviceItem.innerHTML = `
        <select name="services[${serviceCount}][serviceId]" class="form-control" required>
            <option value="">เลือกบริการ</option>
            ${window.availableServices.map(service => 
                `<option value="${service.id}" data-price="${service.price}">${service.name} - ${service.price.toLocaleString()} บาท</option>`
            ).join('')}
        </select>
        <input type="number" name="services[${serviceCount}][quantity]" class="form-control" 
               placeholder="จำนวน" min="1" value="1" required>
        <button type="button" class="btn-remove" onclick="removeService(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    servicesList.appendChild(serviceItem);
    
    // Add event listener for price calculation
    const select = serviceItem.querySelector('select');
    select.addEventListener('change', calculateTotal);
    
    const quantity = serviceItem.querySelector('input[type="number"]');
    quantity.addEventListener('input', calculateTotal);
}

// Remove service from bill
function removeService(button) {
    const serviceItem = button.closest('.service-item');
    if (serviceItem) {
        serviceItem.remove();
        calculateTotal();
    }
}

// Calculate total amount
function calculateTotal() {
    const services = document.querySelectorAll('.service-item');
    let totalAmount = 0;
    
    services.forEach(service => {
        const select = service.querySelector('select');
        const quantity = service.querySelector('input[type="number"]');
        
        if (select.value && quantity.value) {
            const price = parseFloat(select.selectedOptions[0].dataset.price) || 0;
            const qty = parseFloat(quantity.value) || 0;
            totalAmount += price * qty;
        }
    });
    
    // Apply discount
    const discountInput = document.querySelector('input[name="discount"]');
    const discount = parseFloat(discountInput?.value) || 0;
    const discountAmount = (totalAmount * discount) / 100;
    const netAmount = totalAmount - discountAmount;
    
    // Update display (if exists)
    updateTotalDisplay(totalAmount, discountAmount, netAmount);
}

// Update total display
function updateTotalDisplay(total, discount, net) {
    // Remove existing total display
    const existingTotal = document.querySelector('.total-display');
    if (existingTotal) {
        existingTotal.remove();
    }
    
    // Create new total display
    const totalDisplay = document.createElement('div');
    totalDisplay.className = 'total-display';
    totalDisplay.innerHTML = `
        <div class="total-summary">
            <div class="total-item">
                <span>ยอดรวม:</span>
                <span class="amount">${total.toLocaleString()} บาท</span>
            </div>
            <div class="total-item">
                <span>ส่วนลด (${document.querySelector('input[name="discount"]').value || 0}%):</span>
                <span class="discount">${discount.toLocaleString()} บาท</span>
            </div>
            <div class="total-item total-net">
                <span>ยอดสุทธิ:</span>
                <span class="net-amount">${net.toLocaleString()} บาท</span>
            </div>
        </div>
    `;
    
    // Insert before form actions
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
        formActions.parentNode.insertBefore(totalDisplay, formActions);
    }
}

// Update payment status
function updatePaymentStatus(billId, status) {
    if (!confirm(`คุณต้องการ${status === 'paid' ? 'ชำระเงิน' : 'เปลี่ยนสถานะ'}ใบเสร็จนี้หรือไม่?`)) {
        return;
    }
    
    // Create form and submit
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/billing/${billId}/status`;
    
    const statusInput = document.createElement('input');
    statusInput.type = 'hidden';
    statusInput.name = 'status';
    statusInput.value = status;
    
    form.appendChild(statusInput);
    document.body.appendChild(form);
    form.submit();
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
    
    // Validate services
    const services = form.querySelectorAll('.service-item');
    if (services.length === 0) {
        showAlert('กรุณาเพิ่มบริการอย่างน้อย 1 รายการ', 'error');
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

// Clear create bill form
function clearCreateBillForm() {
    const servicesList = document.getElementById('servicesList');
    if (servicesList) {
        servicesList.innerHTML = '';
    }
    
    const form = document.querySelector('#createBillModal form');
    if (form) {
        form.reset();
    }
    
    const totalDisplay = document.querySelector('.total-display');
    if (totalDisplay) {
        totalDisplay.remove();
    }
}

// Load existing data
function loadExistingData() {
    // Load any existing form data from localStorage or server
    const savedData = localStorage.getItem('billingFormData');
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
    const form = document.querySelector('#createBillModal form');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem('billingFormData', JSON.stringify(data));
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

// Export functions for global access
window.showCreateBillForm = showCreateBillForm;
window.hideCreateBillForm = hideCreateBillForm;
window.addService = addService;
window.removeService = removeService;
window.updatePaymentStatus = updatePaymentStatus;
