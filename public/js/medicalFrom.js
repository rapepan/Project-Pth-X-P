 document.getElementById("historyForm").addEventListener("submit", function(event) {
            var weight = document.getElementById("weight").value + "kg";
            var height = document.getElementById("height").value + "cm";
            var bloodPressure = document.getElementById("bloodPressure").value + "mmHg";
            var pulse = document.getElementById("pulse").value + "/min";
            var o2Sat = document.getElementById("o2Sat").value + "%";
            var respiratoryRate = document.getElementById("respiratoryRate").value + "/min";

            document.getElementById("weight").value = weight;
            document.getElementById("height").value = height;
            document.getElementById("bloodPressure").value = bloodPressure;
            document.getElementById("pulse").value = pulse;
            document.getElementById("o2Sat").value = o2Sat;
            document.getElementById("respiratoryRate").value = respiratoryRate;
        });

        function goBack() {
            window.history.back();
        }