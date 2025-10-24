        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        }
        updateTime();
        setInterval(updateTime, 1000);
        
        // Add form submission loading state
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    const submitBtn = document.getElementById('diagnosisSubmitBtn');
                    const btnText = submitBtn.querySelector('.btn-text');
                    const btnLoading = submitBtn.querySelector('.btn-loading');
                    
                    // แสดง loading state
                    btnText.style.display = 'none';
                    btnLoading.style.display = 'inline';
                    submitBtn.disabled = true;
                });
            }
        });

        // ICD-10 Search with Multiple Selection
        const icd10Search = document.getElementById('icd10Search');
        const icd10Results = document.getElementById('icd10Results');
        const selectedIcd10Codes = document.getElementById('selectedIcd10Codes');
        const hiddenIcd10Inputs = document.getElementById('hiddenIcd10Inputs');
        
        let selectedCodes = []; // Array to store selected ICD-10 codes

        if (icd10Search) {
            let searchTimeout;
            icd10Search.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const query = this.value.trim();
                
                if (query.length < 2) {
                    icd10Results.classList.remove('show');
                    return;
                }

                searchTimeout = setTimeout(() => {
                    // แสดงรายการ ICD-10 ที่ใช้บ่อยแทนการใช้ API
                    const commonICD10 = [
                        { code: 'M79.3', description: 'Panniculitis, unspecified' },
                        { code: 'M25.5', description: 'Pain in joint' },
                        { code: 'M79.6', description: 'Disorders of soft tissue, not elsewhere classified' },
                        { code: 'M54.2', description: 'Cervicalgia' },
                        { code: 'M54.5', description: 'Low back pain' },
                        { code: 'M79.1', description: 'Myalgia' },
                        { code: 'M25.6', description: 'Stiffness of joint, not elsewhere classified' },
                        { code: 'M79.2', description: 'Neuralgia and neuritis, unspecified' },
                        { code: 'M54.9', description: 'Dorsalgia, unspecified' },
                        { code: 'M25.9', description: 'Joint disorder, unspecified' }
                    ];
                    
                    const filteredResults = commonICD10.filter(item => 
                        item.code.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase())
                    );
                    
                    if (filteredResults.length > 0) {
                        icd10Results.innerHTML = filteredResults.map(item => {
                            const isSelected = selectedCodes.some(selected => selected.code === item.code);
                            const selectedClass = isSelected ? 'selected' : '';
                            return `
                                <div class="icd10-item ${selectedClass}" data-code="${item.code}" data-desc="${item.description}">
                                    <span class="icd10-code">${item.code}</span> - ${item.description}
                                    ${isSelected ? '<span class="selected-indicator">✓</span>' : ''}
                                </div>
                            `;
                        }).join('');
                        icd10Results.classList.add('show');

                        // Add click event to items
                        document.querySelectorAll('.icd10-item').forEach(item => {
                            item.addEventListener('click', function() {
                                const code = this.dataset.code;
                                const desc = this.dataset.desc;
                                
                                // Check if already selected
                                const existingIndex = selectedCodes.findIndex(selected => selected.code === code);
                                
                                if (existingIndex >= 0) {
                                    // Remove if already selected
                                    selectedCodes.splice(existingIndex, 1);
                                } else {
                                    // Add if not selected
                                    selectedCodes.push({ code: code, description: desc });
                                }
                                
                                updateSelectedCodesDisplay();
                                updateHiddenInputs();
                                icd10Search.value = ''; // Clear search
                                icd10Results.classList.remove('show');
                            });
                        });
                    } else {
                        icd10Results.innerHTML = '<div class="icd10-item">ไม่พบข้อมูล ICD-10 ที่ตรงกับคำค้นหา</div>';
                        icd10Results.classList.add('show');
                    }
                }, 300);
            });

            // Close results when clicking outside
            document.addEventListener('click', function(e) {
                if (!icd10Search.contains(e.target) && !icd10Results.contains(e.target)) {
                    icd10Results.classList.remove('show');
                }
            });
        }

        // Update selected codes display
        function updateSelectedCodesDisplay() {
            if (selectedCodes.length === 0) {
                selectedIcd10Codes.innerHTML = '<div class="no-selection">ยังไม่ได้เลือกรหัส ICD-10</div>';
            } else {
                selectedIcd10Codes.innerHTML = selectedCodes.map((item, index) => `
                    <div class="selected-code-item">
                        <span class="code">${item.code}</span>
                        <span class="description">${item.description}</span>
                        <button type="button" class="remove-btn" onclick="removeIcd10Code(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Remove ICD-10 code
        function removeIcd10Code(index) {
            selectedCodes.splice(index, 1);
            updateSelectedCodesDisplay();
            updateHiddenInputs();
        }

        // Update hidden inputs for form submission
        function updateHiddenInputs() {
            hiddenIcd10Inputs.innerHTML = '';
            
            // Add hidden inputs for each selected code
            selectedCodes.forEach((item, index) => {
                const codeInput = document.createElement('input');
                codeInput.type = 'hidden';
                codeInput.name = `icd10Codes[${index}][code]`;
                codeInput.value = item.code;
                
                const descInput = document.createElement('input');
                descInput.type = 'hidden';
                descInput.name = `icd10Codes[${index}][description]`;
                descInput.value = item.description;
                
                hiddenIcd10Inputs.appendChild(codeInput);
                hiddenIcd10Inputs.appendChild(descInput);
            });
        }