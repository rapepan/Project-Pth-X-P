        function goBack() {
            window.history.back();
        }
        
        // Set default values for optional fields
        document.addEventListener('DOMContentLoaded', function() {
            // Set default '-' for optional fields if empty on blur
            const optionalFields = ['chronic_diseases', 'allergy_history', 'moo', 'soi'];
            
            optionalFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    // Set default value if empty when leaving field
                    field.addEventListener('blur', function() {
                        if (this.value.trim() === '') {
                            this.value = '-';
                        }
                    });
                    
                    // Clear default value when focusing
                    field.addEventListener('focus', function() {
                        if (this.value === '-') {
                            this.value = '';
                        }
                    });
                }
            });
            
            // Add form submission loading state
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    const submitBtn = document.getElementById('patientSubmitBtn');
                    const btnText = submitBtn.querySelector('.btn-text');
                    const btnLoading = submitBtn.querySelector('.btn-loading');
                    
                    // แสดง loading state
                    btnText.style.display = 'none';
                    btnLoading.style.display = 'inline';
                    submitBtn.disabled = true;
                });
            }
        });