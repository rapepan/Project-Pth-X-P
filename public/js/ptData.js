// ptData.js - JavaScript สำหรับหน้าข้อมูลกายภาพบำบัด

document.addEventListener('DOMContentLoaded', function() {
    console.log('PT Data page loaded');
    
    // Initialize page
    initializePTData();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize PT Data page
function initializePTData() {
    // Load measurement templates
    loadMeasurementTemplates();
    
    // Initialize form validation
    setupFormValidation();
    
    // Load any existing data
    loadExistingData();
    
    // Initialize chart if needed
    initializeChart();
}

// Setup event listeners
function setupEventListeners() {
    // Modal close on outside click
    document.addEventListener('click', function(e) {
        const modals = ['createPTDataModal', 'progressChartModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (e.target === modal) {
                if (modalId === 'createPTDataModal') {
                    hideCreatePTDataForm();
                } else if (modalId === 'progressChartModal') {
                    hideProgressChart();
                }
            }
        });
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideCreatePTDataForm();
            hideProgressChart();
        }
    });
    
    // Auto-fill measurement details based on type
    const assessmentTypeSelect = document.querySelector('select[name="assessmentType"]');
    if (assessmentTypeSelect) {
        assessmentTypeSelect.addEventListener('change', function() {
            autoFillMeasurementFields(this.value);
        });
    }
    
    // Date validation
    const dateInput = document.querySelector('input[name="assessmentDate"]');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            validateDate(this);
        });
    }
}

// Load measurement templates
function loadMeasurementTemplates() {
    // Mock measurement templates - ในระบบจริงจะดึงจาก API
    const templates = {
        'ROM': {
            name: 'การเคลื่อนไหวของข้อต่อ',
            defaultMeasurements: [
                { name: 'Flexion', unit: '°', value: '' },
                { name: 'Extension', unit: '°', value: '' },
                { name: 'Abduction', unit: '°', value: '' },
                { name: 'Adduction', unit: '°', value: '' }
            ]
        },
        'MMT': {
            name: 'ความแข็งแรงของกล้ามเนื้อ',
            defaultMeasurements: [
                { name: 'Deltoid', unit: '/5', value: '' },
                { name: 'Biceps', unit: '/5', value: '' },
                { name: 'Triceps', unit: '/5', value: '' },
                { name: 'Quadriceps', unit: '/5', value: '' }
            ]
        },
        'Pain': {
            name: 'การประเมินความเจ็บปวด',
            defaultMeasurements: [
                { name: 'Pain Scale', unit: '/10', value: '' },
                { name: 'Location', unit: '', value: '' },
                { name: 'Duration', unit: 'นาที', value: '' }
            ]
        },
        'Function': {
            name: 'การประเมินการทำงาน',
            defaultMeasurements: [
                { name: 'ADL Score', unit: '%', value: '' },
                { name: 'Mobility', unit: '/10', value: '' },
                { name: 'Independence', unit: '%', value: '' }
            ]
        },
        'Balance': {
            name: 'การประเมินการทรงตัว',
            defaultMeasurements: [
                { name: 'Static Balance', unit: 'วินาที', value: '' },
                { name: 'Dynamic Balance', unit: '/10', value: '' },
                { name: 'Fall Risk', unit: 'Low/Med/High', value: '' }
            ]
        },
        'Gait': {
            name: 'การประเมินการเดิน',
            defaultMeasurements: [
                { name: 'Speed', unit: 'm/min', value: '' },
                { name: 'Cadence', unit: 'steps/min', value: '' },
                { name: 'Stride Length', unit: 'cm', value: '' }
            ]
        }
    };
    
    // Store templates globally
    window.measurementTemplates = templates;
}

// Show create PT Data form modal
function showCreatePTDataForm() {
    const modal = document.getElementById('createPTDataModal');
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

// Hide create PT Data form modal
function hideCreatePTDataForm() {
    const modal = document.getElementById('createPTDataModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form
        clearCreatePTDataForm();
    }
}

// Show progress chart modal
function showProgressChart() {
    const modal = document.getElementById('progressChartModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Initialize chart
        initializeProgressChart();
    }
}

// Hide progress chart modal
function hideProgressChart() {
    const modal = document.getElementById('progressChartModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Auto-fill measurement fields based on assessment type
function autoFillMeasurementFields(type) {
    if (!window.measurementTemplates || !type) return;
    
    const template = window.measurementTemplates[type];
    if (!template) return;
    
    // Clear existing measurements
    const measurementsGrid = document.getElementById('measurementsGrid');
    if (measurementsGrid) {
        measurementsGrid.innerHTML = '';
    }
    
    // Add default measurements
    template.defaultMeasurements.forEach((measurement, index) => {
        addMeasurement(measurement.name, measurement.unit);
    });
}

// Add measurement field
function addMeasurement(name = '', unit = '') {
    const measurementsGrid = document.getElementById('measurementsGrid');
    if (!measurementsGrid) return;
    
    const measurementCount = measurementsGrid.children.length;
    const measurementItem = document.createElement('div');
    measurementItem.className = 'measurement-item';
    measurementItem.innerHTML = `
        <input type="text" name="measurements[${measurementCount}][name]" class="form-control" 
               placeholder="ชื่อการวัด" value="${name}" required>
        <input type="number" name="measurements[${measurementCount}][value]" class="form-control" 
               placeholder="ค่า" step="0.01" required>
        <input type="text" name="measurements[${measurementCount}][unit]" class="form-control" 
               placeholder="หน่วย" value="${unit}">
        <button type="button" class="btn-remove" onclick="removeMeasurement(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    measurementsGrid.appendChild(measurementItem);
}

// Remove measurement field
function removeMeasurement(button) {
    const measurementItem = button.closest('.measurement-item');
    if (measurementItem) {
        measurementItem.remove();
        // Re-index remaining measurements
        reindexMeasurements();
    }
}

// Re-index measurement fields
function reindexMeasurements() {
    const measurementsGrid = document.getElementById('measurementsGrid');
    if (!measurementsGrid) return;
    
    const measurementItems = measurementsGrid.querySelectorAll('.measurement-item');
    measurementItems.forEach((item, index) => {
        const nameInput = item.querySelector('input[name*="[name]"]');
        const valueInput = item.querySelector('input[name*="[value]"]');
        const unitInput = item.querySelector('input[name*="[unit]"]');
        
        if (nameInput) nameInput.name = `measurements[${index}][name]`;
        if (valueInput) valueInput.name = `measurements[${index}][value]`;
        if (unitInput) unitInput.name = `measurements[${index}][unit]`;
    });
}

// Validate date input
function validateDate(input) {
    const selectedDate = new Date(input.value);
    const today = new Date();
    
    if (selectedDate > today) {
        showFieldError(input, 'วันที่ประเมินไม่สามารถเป็นวันในอนาคตได้');
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
    
    // Validate date
    const dateInput = form.querySelector('input[name="assessmentDate"]');
    if (dateInput && dateInput.value) {
        if (!validateDate(dateInput)) {
            isValid = false;
        }
    }
    
    // Validate measurements
    const measurements = form.querySelectorAll('.measurement-item');
    if (measurements.length === 0) {
        showAlert('กรุณาเพิ่มการวัดอย่างน้อย 1 รายการ', 'error');
        isValid = false;
    }
    
    // Validate measurement values
    measurements.forEach(measurement => {
        const nameInput = measurement.querySelector('input[name*="[name]"]');
        const valueInput = measurement.querySelector('input[name*="[value]"]');
        
        if (nameInput && nameInput.value.trim() && valueInput && !valueInput.value.trim()) {
            showFieldError(valueInput, 'กรุณากรอกค่าการวัด');
            isValid = false;
        }
    });
    
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

// Clear create PT Data form
function clearCreatePTDataForm() {
    const form = document.querySelector('#createPTDataModal form');
    if (form) {
        form.reset();
        
        // Clear measurements grid
        const measurementsGrid = document.getElementById('measurementsGrid');
        if (measurementsGrid) {
            measurementsGrid.innerHTML = '';
        }
        
        // Clear any field errors
        const fieldErrors = form.querySelectorAll('.field-error');
        fieldErrors.forEach(error => error.remove());
        
        // Reset border colors
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.style.borderColor = '');
    }
}

// Initialize chart
function initializeChart() {
    // Chart initialization will be done when modal is opened
    console.log('Chart initialized');
}

// Initialize progress chart
function initializeProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    
    // Mock chart data - ในระบบจริงจะดึงจาก API
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw mock chart
    drawMockChart(ctx, canvas.width, canvas.height);
}

// Draw mock chart
function drawMockChart(ctx, width, height) {
    // Chart styling
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('กราฟความก้าวหน้าผู้ป่วย', width / 2, 30);
    
    // Chart area
    const chartWidth = width - 80;
    const chartHeight = height - 80;
    const chartX = 40;
    const chartY = 50;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();
    
    // Mock data points
    const dataPoints = [
        { x: 0, strength: 3, rom: 45, pain: 7 },
        { x: 1, strength: 3.5, rom: 50, pain: 6 },
        { x: 2, strength: 4, rom: 55, pain: 5 },
        { x: 3, strength: 4.5, rom: 60, pain: 4 },
        { x: 4, strength: 4.8, rom: 65, pain: 3 }
    ];
    
    // Draw data lines
    const colors = ['#667eea', '#4ecdc4', '#ff6b6b'];
    const labels = ['ความแข็งแรง', 'การเคลื่อนไหว', 'ความเจ็บปวด'];
    
    colors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        dataPoints.forEach((point, pointIndex) => {
            const x = chartX + (point.x / (dataPoints.length - 1)) * chartWidth;
            const value = index === 0 ? point.strength : (index === 1 ? point.rom : point.pain);
            const maxValue = index === 2 ? 10 : (index === 1 ? 90 : 5);
            const y = chartY + chartHeight - (value / maxValue) * chartHeight;
            
            if (pointIndex === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw points
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.stroke();
    });
    
    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    dataPoints.forEach((point, index) => {
        const x = chartX + (point.x / (dataPoints.length - 1)) * chartWidth;
        ctx.fillText(`สัปดาห์ ${point.x + 1}`, x, chartY + chartHeight + 20);
    });
}

// Load existing data
function loadExistingData() {
    // Load any existing form data from localStorage or server
    const savedData = localStorage.getItem('ptDataFormData');
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
    const form = document.querySelector('#createPTDataModal form');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem('ptDataFormData', JSON.stringify(data));
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

// Get progress tracking data (mock function)
function getProgressTracking(HN) {
    // Mock data - ในระบบจริงจะดึงจาก API
    const progressData = {
        totalAssessments: 12,
        improvementRate: 85,
        currentGoals: 3,
        completedGoals: 2
    };
    
    showAlert(`ข้อมูลความก้าวหน้า: รวม ${progressData.totalAssessments} ครั้ง, อัตราการดีขึ้น ${progressData.improvementRate}%`, 'info');
    
    return progressData;
}

// Export functions for global access
window.showCreatePTDataForm = showCreatePTDataForm;
window.hideCreatePTDataForm = hideCreatePTDataForm;
window.showProgressChart = showProgressChart;
window.hideProgressChart = hideProgressChart;
window.addMeasurement = addMeasurement;
window.removeMeasurement = removeMeasurement;
window.getProgressTracking = getProgressTracking;
