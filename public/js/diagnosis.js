        // Update time
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

        // ICD-10 Search
        const icd10Search = document.getElementById('icd10Search');
        const icd10Results = document.getElementById('icd10Results');
        const icd10Code = document.getElementById('icd10Code');
        const icd10Description = document.getElementById('icd10Description');

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
                        { code: 'M79.1', description: 'Myalgia' }
                    ];
                    
                    const filteredResults = commonICD10.filter(item => 
                        item.code.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase())
                    );
                    
                    if (filteredResults.length > 0) {
                        icd10Results.innerHTML = filteredResults.map(item => `
                            <div class="icd10-item" data-code="${item.code}" data-desc="${item.description}">
                                <span class="icd10-code">${item.code}</span> - ${item.description}
                            </div>
                        `).join('');
                        icd10Results.classList.add('show');

                        // Add click event to items
                        document.querySelectorAll('.icd10-item').forEach(item => {
                            item.addEventListener('click', function() {
                                icd10Code.value = this.dataset.code;
                                icd10Description.value = this.dataset.desc;
                                icd10Search.value = `${this.dataset.code} - ${this.dataset.desc}`;
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