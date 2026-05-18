// ============================================
// AgroGuard — Frontend Application
// Handles camera, prediction, language toggle
// ============================================

// ---- Configuration ----
const API_URL = "http://10.156.41.248:8000";

// ---- State ----
let currentLanguage = "en";
let selectedFile    = null;

// ============================================
// LANGUAGE CONTENT
// ============================================

const CONTENT = {
    en: {
        heroTitle       : "Rice Leaf Disease Detection",
        heroSubtitle    : "Take a photo of your paddy leaf and get instant disease prediction with treatment advice",
        placeholderText : "Upload or capture a leaf photo",
        uploadBtnText   : "Upload Photo",
        cameraBtnText   : "Take Photo",
        analyseBtnText  : "🔍 Analyse Leaf",
        loadingText     : "Analysing your leaf...",
        confidenceLabel : "Confidence",
        symptomsTitle   : "Symptoms",
        treatmentTitle  : "Treatment",
        preventionTitle : "Prevention",
        probsTitle      : "All Probabilities",
        scanAgainText   : "🔄 Scan Another Leaf",
        historyTitle    : "📋 Recent Predictions",
        clearBtn        : "Clear",
        noHistoryText   : "No predictions yet",
        footerText      : "AgroGuard — Built for farmers of Mandya, Karnataka",
        langToggle      : "ಕನ್ನಡ"
    },
    kn: {
        heroTitle       : "ಭತ್ತದ ಎಲೆ ರೋಗ ಪತ್ತೆ",
        heroSubtitle    : "ನಿಮ್ಮ ಭತ್ತದ ಎಲೆಯ ಫೋಟೋ ತೆಗೆದು ತಕ್ಷಣ ರೋಗ ಪತ್ತೆ ಮತ್ತು ಚಿಕಿತ್ಸೆ ಮಾಹಿತಿ ಪಡೆಯಿರಿ",
        placeholderText : "ಎಲೆಯ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ತೆಗೆಯಿರಿ",
        uploadBtnText   : "ಫೋಟೋ ಅಪ್ಲೋಡ್",
        cameraBtnText   : "ಫೋಟೋ ತೆಗೆಯಿರಿ",
        analyseBtnText  : "🔍 ಎಲೆ ವಿಶ್ಲೇಷಿಸಿ",
        loadingText     : "ನಿಮ್ಮ ಎಲೆ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
        confidenceLabel : "ವಿಶ್ವಾಸ ಮಟ್ಟ",
        symptomsTitle   : "ಲಕ್ಷಣಗಳು",
        treatmentTitle  : "ಚಿಕಿತ್ಸೆ",
        preventionTitle : "ತಡೆಗಟ್ಟುವಿಕೆ",
        probsTitle      : "ಎಲ್ಲ ಸಾಧ್ಯತೆಗಳು",
        scanAgainText   : "🔄 ಮತ್ತೊಂದು ಎಲೆ ಸ್ಕ್ಯಾನ್",
        historyTitle    : "📋 ಇತ್ತೀಚಿನ ಪ್ರಶ್ನೆಗಳು",
        clearBtn        : "ಅಳಿಸಿ",
        noHistoryText   : "ಇನ್ನೂ ಯಾವುದೇ ಮಾಹಿತಿ ಇಲ್ಲ",
        footerText      : "ಆಗ್ರೋಗಾರ್ಡ್ — ಮಂಡ್ಯ, ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ",
        langToggle      : "English"
    }
};

// Disease icons
const DISEASE_ICONS = {
    "bacterial_leaf_blight" : "🍂",
    "brown_spot"            : "🟤",
    "healthy"               : "🌿",
    "leaf_blast"            : "💨"
};

// ============================================
// LANGUAGE TOGGLE
// ============================================

function toggleLanguage() {
    currentLanguage = currentLanguage === "en"
        ? "kn" : "en";
    updateUILanguage();
}

function updateUILanguage() {
    const c = CONTENT[currentLanguage];

    // Update all UI text
    setText("heroTitle",       c.heroTitle);
    setText("heroSubtitle",    c.heroSubtitle);
    setText("placeholderText", c.placeholderText);
    setText("uploadBtnText",   c.uploadBtnText);
    setText("cameraBtnText",   c.cameraBtnText);
    setText("analyseBtnText",  "🔍 " +
        c.analyseBtnText.replace("🔍 ", ""));
    setText("loadingText",     c.loadingText);
    setText("confidenceLabel", c.confidenceLabel);
    setText("symptomsTitle",   c.symptomsTitle);
    setText("treatmentTitle",  c.treatmentTitle);
    setText("preventionTitle", c.preventionTitle);
    setText("probsTitle",      c.probsTitle);
    setText("scanAgainText",   c.scanAgainText);
    setText("historyTitle",    c.historyTitle);
    setText("clearBtn",        c.clearBtn);
    setText("noHistoryText",   c.noHistoryText);
    setText("footerText",      c.footerText);
    setText("langToggle",      c.langToggle);

    // Update result content if results visible
    if (window.lastResult) {
        displayResult(window.lastResult);
    }

    // Update history
    loadHistory();
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ============================================
// FILE HANDLING
// ============================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(
            "previewImage"
        );
        const placeholder = document.getElementById(
            "previewPlaceholder"
        );
        preview.src = e.target.result;
        preview.classList.remove("hidden");
        placeholder.classList.add("hidden");
    };
    reader.readAsDataURL(file);

    // Show analyse button
    document.getElementById("analyseBtn")
        .classList.remove("hidden");

    // Hide previous results
    document.getElementById("resultsSection")
        .classList.add("hidden");
}

// ============================================
// PREDICTION
// ============================================

async function analyseImage() {
    if (!selectedFile) return;

    // Show loading
    document.getElementById("loadingSection")
        .classList.remove("hidden");
    document.getElementById("resultsSection")
        .classList.add("hidden");
    document.getElementById("analyseBtn")
        .classList.add("hidden");

    try {
        // Prepare form data
        const formData = new FormData();
        formData.append("file", selectedFile);

        // Call API
        const response = await fetch(
            `${API_URL}/predict`,
            {
                method : "POST",
                body   : formData
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status}`
            );
        }

        const result = await response.json();

        // Store result globally for language switch
        window.lastResult = result;

        // Hide loading, show results
        document.getElementById("loadingSection")
            .classList.add("hidden");

        displayResult(result);
        loadHistory();

    } catch (error) {
        document.getElementById("loadingSection")
            .classList.add("hidden");
        document.getElementById("analyseBtn")
            .classList.remove("hidden");

        alert(
            "Error connecting to server.\n" +
            "Please make sure the backend is running."
        );
        console.error("Prediction error:", error);
    }
}

// ============================================
// DISPLAY RESULT
// ============================================

function displayResult(result) {
    const isKn = currentLanguage === "kn";

    // Disease name
    document.getElementById("diseaseName")
        .textContent = isKn
            ? result.disease_name_kn
            : result.disease_name_en;

    // Disease icon
    document.getElementById("diseaseIcon")
        .textContent = DISEASE_ICONS[
            result.predicted_class
        ] || "🌿";

    // Severity badge
    const badge = document.getElementById(
        "severityBadge"
    );
    badge.textContent = result.severity;
    badge.className = "severity-badge " +
        getSeverityClass(result.severity);

    // Confidence
    document.getElementById("confidenceValue")
        .textContent = result.confidence.toFixed(1) + "%";
    document.getElementById("confidenceFill")
        .style.width = result.confidence + "%";

    // Warning
    const warningBox = document.getElementById(
        "warningBox"
    );
    if (result.low_confidence_warning) {
        document.getElementById("warningText")
            .textContent = result.low_confidence_warning;
        warningBox.classList.remove("hidden");
    } else {
        warningBox.classList.add("hidden");
    }

    // Symptoms
    document.getElementById("symptomsContent")
        .textContent = isKn
            ? result.symptoms_kn
            : result.symptoms_en;

    // Treatment
    document.getElementById("treatmentContent")
        .textContent = isKn
            ? result.treatment_kn
            : result.treatment_en;

    // Prevention
    document.getElementById("preventionContent")
        .textContent = isKn
            ? result.prevention_kn
            : result.prevention_en;

    // All probabilities
    const probsContainer = document.getElementById(
        "probsContainer"
    );
    probsContainer.innerHTML = "";

    const sortedProbs = Object.entries(
        result.all_probabilities
    ).sort((a, b) => b[1] - a[1]);

    sortedProbs.forEach(([cls, prob]) => {
        const isTop = cls === result.display_name;
        probsContainer.innerHTML += `
            <div class="prob-item">
                <div class="prob-label">
                    <span>${cls}</span>
                    <span>${prob.toFixed(1)}%</span>
                </div>
                <div class="prob-bar">
                    <div class="prob-fill ${isTop ? 'top' : ''}"
                         style="width:${prob}%">
                    </div>
                </div>
            </div>
        `;
    });

    // Show results
    document.getElementById("resultsSection")
        .classList.remove("hidden");

    // Scroll to results
    document.getElementById("resultsSection")
        .scrollIntoView({ behavior: "smooth" });
}

function getSeverityClass(severity) {
    const map = {
        "None"      : "severity-none",
        "Medium"    : "severity-medium",
        "High"      : "severity-high",
        "Very High" : "severity-veryhigh"
    };
    return map[severity] || "severity-none";
}

// ============================================
// HISTORY
// ============================================

async function loadHistory() {
    try {
        const response = await fetch(
            `${API_URL}/history`
        );
        const data = await response.json();

        const container = document.getElementById(
            "historyContainer"
        );
        const isKn = currentLanguage === "kn";

        if (data.predictions.length === 0) {
            container.innerHTML = `
                <p class="no-history"
                   id="noHistoryText">
                    ${CONTENT[currentLanguage].noHistoryText}
                </p>
            `;
            return;
        }

        container.innerHTML = data.predictions
            .slice(0, 5)
            .map(p => `
                <div class="history-item">
                    <div>
                        <div class="history-disease">
                            ${DISEASE_ICONS[p.predicted_class] || "🌿"}
                            ${p.display_name}
                        </div>
                        <div class="history-time">
                            ${p.timestamp}
                        </div>
                    </div>
                    <div class="history-confidence">
                        ${p.confidence.toFixed(1)}%
                    </div>
                </div>
            `).join("");

    } catch (error) {
        console.log("History load failed:", error);
    }
}

async function clearHistory() {
    try {
        await fetch(`${API_URL}/history`, {
            method: "DELETE"
        });
        loadHistory();
    } catch (error) {
        console.log("Clear history failed:", error);
    }
}

// ============================================
// RESET
// ============================================

function resetApp() {
    selectedFile    = null;
    window.lastResult = null;

    // Reset preview
    document.getElementById("previewImage")
        .classList.add("hidden");
    document.getElementById("previewPlaceholder")
        .classList.remove("hidden");

    // Reset file inputs
    document.getElementById("fileInput").value = "";
    document.getElementById("cameraInput").value = "";

    // Hide sections
    document.getElementById("analyseBtn")
        .classList.add("hidden");
    document.getElementById("resultsSection")
        .classList.add("hidden");

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================
// INITIALISE
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
    updateUILanguage();
});