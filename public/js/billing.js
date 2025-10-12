// billing.js - JavaScript สำหรับหน้าจัดการค่าใช้จ่าย

// ฟังก์ชันอัปเดตยอดรวมของแต่ละบริการ
function updateServiceTotal(input) {
    const index = input.dataset.index;
    const price = parseFloat(input.dataset.price);
    const quantity = parseInt(input.value) || 0;
    const total = price * quantity;
    
    // อัปเดตการแสดงผล
    const totalDisplay = document.getElementById(`total_${index}`);
    if (totalDisplay) {
        totalDisplay.textContent = total.toLocaleString('th-TH', {minimumFractionDigits: 2});
    }
    
    // อัปเดตยอดรวมทั้งหมด
    updateSubtotal();
    updateSelectedServicesInput();
}

// ฟังก์ชันอัปเดตยอดรวมก่อนหักส่วนลด
function updateSubtotal() {
    let subtotal = 0;
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    quantityInputs.forEach(input => {
        const price = parseFloat(input.dataset.price);
        const quantity = parseInt(input.value) || 0;
        subtotal += price * quantity;
    });
    
    // อัปเดตการแสดงผล
    const subtotalElement = document.getElementById('subtotalAmount');
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    
    if (subtotalElement) {
        subtotalElement.textContent = subtotal.toLocaleString('th-TH', {minimumFractionDigits: 2});
    }
    
    if (subtotalDisplay) {
        subtotalDisplay.textContent = subtotal.toLocaleString('th-TH', {minimumFractionDigits: 2});
    }
    
    // อัปเดตการคำนวณส่วนลดและภาษี
    updateDiscountCalculation();
}

// ฟังก์ชันอัปเดตการคำนวณส่วนลด
function updateDiscountCalculation() {
    const discountType = document.getElementById('discountType');
    const discountInput = document.getElementById('discountAmount');
    const reasonInput = document.getElementById('discountReason');
    
    if (!discountType || !discountInput || !reasonInput) return;
    
    if (discountType.value === 'none') {
        discountInput.disabled = true;
        reasonInput.disabled = true;
        discountInput.value = 0;
        reasonInput.value = '';
    } else {
        discountInput.disabled = false;
        reasonInput.disabled = false;
    }
    
    updateTotalCalculation();
}

// ฟังก์ชันอัปเดตการคำนวณยอดรวมทั้งหมด
function updateTotalCalculation() {
    const subtotalElement = document.getElementById('subtotalDisplay');
    if (!subtotalElement) return;
    
    const subtotal = parseFloat(subtotalElement.textContent.replace(/,/g, ''));
    const discountType = document.getElementById('discountType');
    const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;
    
    let afterDiscount = subtotal;
    if (discountType && discountType.value === 'percentage') {
        afterDiscount = subtotal - (subtotal * discountAmount / 100);
    } else if (discountType && discountType.value === 'fixed') {
        afterDiscount = subtotal - discountAmount;
    }
    
        // ไม่มีภาษี
        const taxAmount = 0;
        const finalTotal = afterDiscount;
    
    // ไม่แสดงภาษี
    
    // แสดง/ซ่อนส่วนลด
    const discountLine = document.getElementById('discountLine');
    const discountDisplay = document.getElementById('discountDisplay');
    
    if (discountLine && discountDisplay) {
        if (discountType && discountType.value !== 'none' && discountAmount > 0) {
            discountLine.style.display = 'flex';
            if (discountType.value === 'percentage') {
                discountDisplay.textContent = `-${discountAmount}%`;
            } else {
                discountDisplay.textContent = `-${discountAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
            }
        } else {
            discountLine.style.display = 'none';
        }
    }
    
    const finalTotalDisplay = document.getElementById('finalTotalDisplay');
    if (finalTotalDisplay) {
        finalTotalDisplay.textContent = finalTotal.toLocaleString('th-TH', {minimumFractionDigits: 2});
    }
}

// ฟังก์ชันอัปเดต selectedServices input
function updateSelectedServicesInput() {
    const selectedServicesInput = document.getElementById('selectedServicesInput');
    if (!selectedServicesInput) return;
    
    try {
        const originalServices = JSON.parse(selectedServicesInput.value);
        const updatedServices = originalServices.map((service, index) => {
            const quantityInput = document.querySelector(`input[name="quantity_${index}"]`);
            const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : service.quantity || 1;
            
            return {
                ...service,
                quantity: quantity
            };
        });
        
        selectedServicesInput.value = JSON.stringify(updatedServices);
    } catch (error) {
        console.error('Error updating selected services:', error);
    }
}

// ฟังก์ชันตรวจสอบฟอร์มก่อนส่ง
function validateForm() {
    const selectedServicesInput = document.getElementById('selectedServicesInput');
    if (!selectedServicesInput || !selectedServicesInput.value) {
        alert('ไม่พบข้อมูลบริการ กรุณาลองใหม่อีกครั้ง');
        return false;
    }
    
    try {
        const services = JSON.parse(selectedServicesInput.value);
        if (!services || services.length === 0) {
            alert('กรุณาเลือกบริการอย่างน้อย 1 รายการ');
            return false;
        }
        
        // ตรวจสอบว่ามีบริการที่มีจำนวนมากกว่า 0
        const validServices = services.filter(service => service.quantity > 0);
        if (validServices.length === 0) {
            alert('กรุณาระบุจำนวนบริการอย่างน้อย 1 รายการ');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating form:', error);
        alert('ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        return false;
    }
}

// ฟังก์ชันแสดงตัวอย่างใบเสร็จ
function previewBill() {
    // TODO: Implement bill preview functionality
    alert('ฟีเจอร์แสดงตัวอย่างใบเสร็จกำลังพัฒนา');
}

// ฟังก์ชันพิมพ์ใบเสร็จ
function printBill() {
    // TODO: Implement print functionality
    alert('ฟีเจอร์พิมพ์ใบเสร็จกำลังพัฒนา');
}

// ฟังก์ชันส่งอีเมลใบเสร็จ
function emailBill() {
    // TODO: Implement email functionality
    alert('ฟีเจอร์ส่งอีเมลใบเสร็จกำลังพัฒนา');
}

// ฟังก์ชันบันทึกเป็น PDF
function saveAsPDF() {
    // TODO: Implement PDF save functionality
    alert('ฟีเจอร์บันทึกเป็น PDF กำลังพัฒนา');
}

// ฟังก์ชันเพิ่ม hidden input สำหรับ totalAmount
function addTotalAmountInput() {
    const form = document.getElementById('billingForm');
    if (!form) return;
    
    // ลบ input เดิมถ้ามี
    const existingInput = form.querySelector('input[name="totalAmount"]');
    if (existingInput) {
        existingInput.remove();
    }
    
    // เพิ่ม input ใหม่
    const finalTotalDisplay = document.getElementById('finalTotalDisplay');
    if (finalTotalDisplay) {
        const totalAmount = parseFloat(finalTotalDisplay.textContent.replace(/,/g, '')) || 0;
        
        const totalAmountInput = document.createElement('input');
        totalAmountInput.type = 'hidden';
        totalAmountInput.name = 'totalAmount';
        totalAmountInput.value = totalAmount;
        
        form.appendChild(totalAmountInput);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // อัปเดตการคำนวณเมื่อโหลดหน้า
    updateDiscountCalculation();
    
    // เพิ่ม event listener สำหรับฟอร์ม
    const billingForm = document.getElementById('billingForm');
    if (billingForm) {
        billingForm.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
                return false;
            }
            
            // อัปเดตข้อมูลบริการก่อนส่ง
            updateSelectedServicesInput();
            
            // เพิ่ม totalAmount input ก่อนส่งฟอร์ม
            addTotalAmountInput();
            
            // Debug: ตรวจสอบข้อมูลที่จะส่ง
            console.log('Form data being submitted:');
            console.log('selectedServices:', document.getElementById('selectedServicesInput').value);
            console.log('totalAmount:', document.querySelector('input[name="totalAmount"]').value);
            
            // แสดง loading state
            const submitButton = billingForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสร้างใบเสร็จ...';
            }
        });
    }
    
    // เพิ่ม event listener สำหรับการเปลี่ยนแปลงส่วนลด
    const discountTypeSelect = document.getElementById('discountType');
    if (discountTypeSelect) {
        discountTypeSelect.addEventListener('change', updateDiscountCalculation);
    }
    
    const discountAmountInput = document.getElementById('discountAmount');
    if (discountAmountInput) {
        discountAmountInput.addEventListener('input', updateTotalCalculation);
    }
    
    // เพิ่ม event listener สำหรับการเปลี่ยนแปลงจำนวน
    const quantityInputs = document.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
        input.addEventListener('input', function() {
            updateServiceTotal(this);
        });
    });
    
    // Auto-calculate tax when subtotal changes
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    if (subtotalDisplay) {
        // Use MutationObserver to watch for changes in subtotal
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    updateTotalCalculation();
                }
            });
        });
        
        observer.observe(subtotalDisplay, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }
});

// ฟังก์ชันการชำระเงิน
function processPayment() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const finalTotal = parseFloat(document.getElementById('finalTotalDisplay').textContent.replace(/,/g, '')) || 0;
    
    let amountReceived = 0;
    let change = 0;
    
    // สำหรับเงินสด ต้องตรวจสอบจำนวนเงินที่รับ
    if (paymentMethod === 'cash') {
        amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
        
        // Validation
        if (amountReceived < finalTotal) {
            alert('จำนวนเงินที่รับต้องไม่น้อยกว่ายอดรวม');
            return;
        }
        
        // Calculate change
        if (amountReceived > finalTotal) {
            change = amountReceived - finalTotal;
        }
    } else {
        // สำหรับวิธีอื่น ให้จำนวนเงินที่รับเท่ากับยอดรวม
        amountReceived = finalTotal;
    }
    
    // Show payment status
    document.getElementById('paymentStatusSection').style.display = 'block';
    
    // Update payment status display
    const methodNames = {
        'cash': 'เงินสด',
        'transfer': 'โอนเงิน',
        'card': 'บัตรเครดิต/เดบิต',
        'insurance': 'ประกันสุขภาพ'
    };
    
    document.getElementById('paymentMethodDisplay').textContent = methodNames[paymentMethod] || paymentMethod;
    
    // แสดงจำนวนเงินที่รับเฉพาะเมื่อชำระเงินสด
    if (paymentMethod === 'cash') {
        document.getElementById('amountReceivedDisplay').textContent = `จำนวนเงินที่รับ: ${amountReceived.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท<br>`;
        if (change > 0) {
            document.getElementById('changeDisplay').textContent = `เงินทอน: ${change.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท`;
        } else {
            document.getElementById('changeDisplay').textContent = '';
        }
    } else {
        // สำหรับวิธีอื่น ไม่แสดงจำนวนเงินที่รับ
        document.getElementById('amountReceivedDisplay').textContent = '';
        document.getElementById('changeDisplay').textContent = '';
    }
    
    // Enable create bill button
    document.getElementById('createBillBtn').disabled = false;
    document.getElementById('createBillBtn').classList.add('enabled');
    
    // Hide payment button and disable inputs
    document.getElementById('paymentBtn').style.display = 'none';
    document.getElementById('amountReceived').disabled = true;
    
    // Show success message
    console.log('ชำระเงินเรียบร้อยแล้ว สามารถสร้างใบเสร็จได้');
}

// Event listener สำหรับการเปลี่ยนแปลงวิธีการชำระเงิน
document.addEventListener('DOMContentLoaded', function() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const amountReceivedInput = document.getElementById('amountReceived');
    const amountReceivedGroup = document.getElementById('amountReceivedGroup');
    const changeGroup = document.getElementById('changeGroup');
    const changeAmountInput = document.getElementById('changeAmount');
    
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
            if (this.value === 'cash') {
                // แสดงช่องกรอกจำนวนเงินสำหรับเงินสด
                amountReceivedGroup.style.display = 'block';
                amountReceivedInput.disabled = false;
                amountReceivedInput.required = true;
                amountReceivedInput.focus();
            } else {
                // ซ่อนช่องกรอกจำนวนเงินสำหรับวิธีอื่น
                amountReceivedGroup.style.display = 'none';
                amountReceivedInput.disabled = true;
                amountReceivedInput.required = false;
                amountReceivedInput.value = 0;
                changeGroup.style.display = 'none';
            }
        });
    }
    
    if (amountReceivedInput) {
        amountReceivedInput.addEventListener('input', function() {
            const paymentMethod = document.getElementById('paymentMethod').value;
            if (paymentMethod === 'cash') {
                const amountReceived = parseFloat(this.value) || 0;
                const finalTotal = parseFloat(document.getElementById('finalTotalDisplay').textContent.replace(/,/g, '')) || 0;
                
                if (amountReceived > finalTotal) {
                    const change = amountReceived - finalTotal;
                    changeGroup.style.display = 'block';
                    changeAmountInput.value = change.toFixed(2);
                } else {
                    changeGroup.style.display = 'none';
                }
            }
        });
    }
});

// Handle view bill button
document.addEventListener('DOMContentLoaded', function() {
    const viewBillBtn = document.getElementById('viewBillBtn');
    if (viewBillBtn) {
        // Extract bill ID from URL if available
        const urlParams = new URLSearchParams(window.location.search);
        const billId = urlParams.get('billId');
        if (billId) {
            viewBillBtn.href = `/billing/detail/${billId}`;
        }
    }
});

// Print bill function
function printBill() {
    const urlParams = new URLSearchParams(window.location.search);
    const billId = urlParams.get('billId');
    if (billId) {
        window.open(`/billing/detail/${billId}?print=true`, '_blank');
    } else {
        alert('ไม่พบใบเสร็จที่จะพิมพ์');
    }
}

// Export functions for global use
window.updateServiceTotal = updateServiceTotal;
window.updateSubtotal = updateSubtotal;
window.updateDiscountCalculation = updateDiscountCalculation;
window.updateTotalCalculation = updateTotalCalculation;
window.updateSelectedServicesInput = updateSelectedServicesInput;
window.validateForm = validateForm;
window.previewBill = previewBill;
window.printBill = printBill;
window.emailBill = emailBill;
window.saveAsPDF = saveAsPDF;
window.processPayment = processPayment;
window.addTotalAmountInput = addTotalAmountInput;
