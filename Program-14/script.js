const PREFS_KEY = "mdu_user_preferences";

// Default configuration
const DEFAULT_PREFS = {
    storageEngine: "localstorage",
    theme: "light",
    fontSize: "medium",
    density: "comfortable",
    language: "en",
    sounds: true,
    autoSave: true
};

// State
let currentPrefs = { ...DEFAULT_PREFS };

// DOM References
const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const densitySelect = document.getElementById("densitySelect");
const languageSelect = document.getElementById("languageSelect");
const soundsEnabled = document.getElementById("soundsEnabled");
const autoSaveEnabled = document.getElementById("autoSaveEnabled");
const saveManualBtn = document.getElementById("saveManualBtn");
const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
const clearStorageBtn = document.getElementById("clearStorageBtn");
const previewHeading = document.getElementById("previewHeading");
const previewText = document.getElementById("previewText");
const localStorageDisplay = document.getElementById("localStorageDisplay");
const cookiesDisplay = document.getElementById("cookiesDisplay");
const storageEngineRadios = document.querySelectorAll('input[name="storageEngine"]');

// ================= Cookie Utilities =================
function setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = encodeURIComponent(name) + "=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim();
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length));
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

// ================= Audio Feedback Synthesizer =================
function playBeep() {
    if (!currentPrefs.sounds) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 tone
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        // AudioContext not allowed before user interaction
    }
}

// ================= Preferences Synchronization =================
function loadStoredPreferences() {
    // Check which engine user previously used
    const fromStorage = localStorage.getItem(PREFS_KEY);
    const fromCookie = getCookie(PREFS_KEY);

    if (fromCookie) {
        try {
            currentPrefs = { ...DEFAULT_PREFS, ...JSON.parse(fromCookie) };
        } catch (e) {}
    } else if (fromStorage) {
        try {
            currentPrefs = { ...DEFAULT_PREFS, ...JSON.parse(fromStorage) };
        } catch (e) {}
    }

    applyPreferencesToDOM();
    updateFormInputs();
    updateInspector();
}

function savePreferences() {
    playBeep();

    const jsonString = JSON.stringify(currentPrefs);

    if (currentPrefs.storageEngine === "cookies") {
        setCookie(PREFS_KEY, jsonString, 30);
    } else {
        localStorage.setItem(PREFS_KEY, jsonString);
    }

    applyPreferencesToDOM();
    updateInspector();
}

// Apply settings to body attributes & preview texts
function applyPreferencesToDOM() {
    document.body.setAttribute("data-theme", currentPrefs.theme);
    document.body.setAttribute("data-font", currentPrefs.fontSize);
    document.body.setAttribute("data-density", currentPrefs.density);

    // Multilingual preview text
    if (currentPrefs.language === "hi") {
        previewHeading.textContent = "महर्षि दयानंद विश्वविद्यालय पोर्टल में आपका स्वागत है";
        previewText.textContent = "यह इंटरैक्टिव पूर्वावलोकन दिखाता है कि कैसे उपयोगकर्ता की प्राथमिकताएं पृष्ठ को पुनः लोड किए बिना टाइपोग्राफी, कंट्रास्ट और लेआउट को तुरंत बदल देती हैं।";
    } else {
        previewHeading.textContent = "Welcome to Maharshi Dayanand University Portal";
        previewText.textContent = "This interactive sample container demonstrates how client preferences immediately take effect on typography, contrast ratios, and container padding across DOM elements without requiring page reload.";
    }
}

// Sync form inputs with state
function updateFormInputs() {
    themeSelect.value = currentPrefs.theme;
    fontSizeSelect.value = currentPrefs.fontSize;
    densitySelect.value = currentPrefs.density;
    languageSelect.value = currentPrefs.language;
    soundsEnabled.checked = currentPrefs.sounds;
    autoSaveEnabled.checked = currentPrefs.autoSave;

    storageEngineRadios.forEach(radio => {
        radio.checked = (radio.value === currentPrefs.storageEngine);
    });
}

// Update Raw Storage Display
function updateInspector() {
    // LocalStorage display
    const lsKeys = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        lsKeys[k] = localStorage.getItem(k);
    }
    localStorageDisplay.textContent = Object.keys(lsKeys).length > 0
        ? JSON.stringify(lsKeys, null, 2)
        : "(Empty LocalStorage)";

    // Cookies display
    cookiesDisplay.textContent = document.cookie ? document.cookie : "(No active cookies for this domain)";
}

// Form Handlers
function handleFieldChange() {
    currentPrefs.theme = themeSelect.value;
    currentPrefs.fontSize = fontSizeSelect.value;
    currentPrefs.density = densitySelect.value;
    currentPrefs.language = languageSelect.value;
    currentPrefs.sounds = soundsEnabled.checked;
    currentPrefs.autoSave = autoSaveEnabled.checked;

    const checkedEngine = document.querySelector('input[name="storageEngine"]:checked');
    if (checkedEngine) {
        currentPrefs.storageEngine = checkedEngine.value;
    }

    applyPreferencesToDOM();

    if (currentPrefs.autoSave) {
        savePreferences();
    }
}

[themeSelect, fontSizeSelect, densitySelect, languageSelect, soundsEnabled, autoSaveEnabled].forEach(el => {
    el.addEventListener("change", handleFieldChange);
});

storageEngineRadios.forEach(radio => {
    radio.addEventListener("change", handleFieldChange);
});

saveManualBtn.addEventListener("click", savePreferences);

// Reset to Defaults
resetDefaultsBtn.addEventListener("click", () => {
    currentPrefs = { ...DEFAULT_PREFS };
    updateFormInputs();
    savePreferences();
});

// Clear Active Storage
clearStorageBtn.addEventListener("click", () => {
    localStorage.removeItem(PREFS_KEY);
    deleteCookie(PREFS_KEY);
    currentPrefs = { ...DEFAULT_PREFS };
    updateFormInputs();
    applyPreferencesToDOM();
    updateInspector();
    alert("Preferences cleared from active storage engines!");
});

// Initial Load
loadStoredPreferences();
