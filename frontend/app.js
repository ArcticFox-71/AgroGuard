// ============================================
// AgroGuard — Frontend Application
// Handles camera, prediction, language toggle
// ============================================

// ---- Configuration ----
const API_URL = "https://agroguard-backend-snyq.onrender.com";

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

    if (window.lastResult) {
        displayResult(window.lastResult);
    }

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

    document.getElementById("analyseBtn")
        .classList.remove("hidden");
    document.getElementById("resultsSection")
        .classList.add("hidden");
}

// ============================================
// PREDICTION
// ============================================

async function analyseImage() {
    if (!selectedFile) return;

    document.getElementById("loadingSection")
        .classList.remove("hidden");
    document.getElementById("resultsSection")
        .classList.add("hidden");
    document.getElementById("analyseBtn")
        .classList.add("hidden");

    try {
        const formData = new FormData();
        formData.append("file", selectedFile);

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

        // Save to THIS device's session only
        // Each farmer sees only their own history
        saveToSessionHistory(result);

        window.lastResult = result;

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
            "Please make sure you have internet " +
            "connection and try again."
        );
        console.error("Prediction error:", error);
    }
}

// ============================================
// SESSION HISTORY
// Each device stores its own history locally
// No farmer sees another farmer's history
// ============================================

function saveToSessionHistory(result) {
    const history = getSessionHistory();

    history.unshift({
        predicted_class : result.predicted_class,
        display_name    : result.display_name,
        confidence      : result.confidence,
        timestamp       : new Date().toLocaleString(
            'en-IN',
            {
                day    : '2-digit',
                month  : '2-digit',
                year   : 'numeric',
                hour   : '2-digit',
                minute : '2-digit'
            }
        )
    });

    // Keep only last 20 predictions per device
    const trimmed = history.slice(0, 20);

    localStorage.setItem(
        "agroguard_history",
        JSON.stringify(trimmed)
    );
}

function getSessionHistory() {
    try {
        return JSON.parse(
            localStorage.getItem("agroguard_history")
            || "[]"
        );
    } catch {
        return [];
    }
}

// ============================================
// DISPLAY RESULT
// ============================================

function displayResult(result) {
    const isKn = currentLanguage === "kn";

    document.getElementById("diseaseName")
        .textContent = isKn
            ? result.disease_name_kn
            : result.disease_name_en;

    document.getElementById("diseaseIcon")
        .textContent = DISEASE_ICONS[
            result.predicted_class
        ] || "🌿";

    const badge = document.getElementById(
        "severityBadge"
    );
    badge.textContent = result.severity;
    badge.className = "severity-badge " +
        getSeverityClass(result.severity);

    document.getElementById("confidenceValue")
        .textContent = result.confidence.toFixed(1) + "%";
    document.getElementById("confidenceFill")
        .style.width = result.confidence + "%";

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

    document.getElementById("symptomsContent")
        .textContent = isKn
            ? result.symptoms_kn
            : result.symptoms_en;

    document.getElementById("treatmentContent")
        .textContent = isKn
            ? result.treatment_kn
            : result.treatment_en;

    document.getElementById("preventionContent")
        .textContent = isKn
            ? result.prevention_kn
            : result.prevention_en;

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
                    <div class="prob-fill
                        ${isTop ? 'top' : ''}"
                         style="width:${prob}%">
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById("resultsSection")
        .classList.remove("hidden");

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
// HISTORY — Device local only
// ============================================

function loadHistory() {
    const container = document.getElementById(
        "historyContainer"
    );
    const isKn = currentLanguage === "kn";
    const history = getSessionHistory();

    if (history.length === 0) {
        container.innerHTML = `
            <p class="no-history" id="noHistoryText">
                ${CONTENT[currentLanguage].noHistoryText}
            </p>
        `;
        return;
    }

    container.innerHTML = history
        .slice(0, 5)
        .map(p => `
            <div class="history-item">
                <div>
                    <div class="history-disease">
                        ${DISEASE_ICONS[p.predicted_class]
                          || "🌿"}
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
}

function clearHistory() {
    localStorage.removeItem("agroguard_history");
    loadHistory();
}

// ============================================
// RESET
// ============================================

function resetApp() {
    selectedFile      = null;
    window.lastResult = null;

    document.getElementById("previewImage")
        .classList.add("hidden");
    document.getElementById("previewPlaceholder")
        .classList.remove("hidden");

    document.getElementById("fileInput").value   = "";
    document.getElementById("cameraInput").value = "";

    document.getElementById("analyseBtn")
        .classList.add("hidden");
    document.getElementById("resultsSection")
        .classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================
// INITIALISE
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
    updateUILanguage();
});