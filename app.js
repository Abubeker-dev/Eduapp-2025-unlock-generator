// --- Helper Functions (Code Generator Logic) ---

function arrayBufferToHex(buffer) {
    // Converts an ArrayBuffer object to a hexadecimal string.
    return Array.prototype.map.call(new Uint8Array(buffer), byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

// Hashing function based ONLY on deviceId and grade (LIFETIME)
async function hashDeviceIdWithGrade(deviceId, grade) {
    // Creates a unique code based on device ID and grade using SHA-256 hashing.
    const str = deviceId + ":" + grade; // Combine device ID and grade
    const encoder = new TextEncoder(); // Prepare to encode the string into bytes
    const data = encoder.encode(str); // Encode the string

    try {
        // Check if the necessary crypto API is available
        // NOTE: crypto.subtle requires a secure context (HTTPS or localhost)
        if (!crypto || !crypto.subtle || !crypto.subtle.digest) {
            console.error("SubtleCrypto API not available. Cannot generate hash.");
            return "CODE-NOSUBTLECRYPTO";
        }
        // Perform the SHA-256 hash asynchronously
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        // Convert the resulting binary buffer to a hex string
        const hashHex = arrayBufferToHex(hashBuffer);
        // Take the first 10 characters of the hex hash
        const codePart = hashHex.slice(0, 10).toUpperCase();
        // Format the final code string including the grade identifier
        return `CODE-${grade.toUpperCase()}-${codePart}`;
    } catch (error) {
        // Log any errors during the hashing process
        console.error("Hashing failed:", error);
        return "CODE-HASHINGERROR";
    }
}
// --- End Helper Functions ---


// --- DOM Element References (Generator Tool) ---
const deviceIdInput = document.getElementById('customer-device-id');
const gradeSelect = document.getElementById('selected-grade');
const generateBtn = document.getElementById('generate-btn');
const codeOutput = document.getElementById('generated-code');
const copyBtn = document.getElementById('copy-code-btn');
const statusMsg = document.getElementById('generator-status');

// --- Event Listeners (Generator Tool) ---

// Check if elements exist before adding listeners (good practice)
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        // Get values only if inputs exist
        const deviceId = deviceIdInput ? deviceIdInput.value.trim() : '';
        const selectedGrade = gradeSelect ? gradeSelect.value : '';

        // --- Input Validation ---
        if (!deviceId) {
            showStatus("Please enter the Customer's Device ID.", 'error');
            if (codeOutput) codeOutput.value = '';
            if (copyBtn) copyBtn.disabled = true;
            return;
        }
        if (!selectedGrade) {
            showStatus('Please select the Grade purchased.', 'error');
            if (codeOutput) codeOutput.value = '';
            if (copyBtn) copyBtn.disabled = true;
            return;
        }

        showStatus('');
        if (codeOutput) codeOutput.value = 'Generating...';
        if (copyBtn) copyBtn.disabled = true;
        generateBtn.disabled = true;

        // --- Code Generation ---
        try {
            const generatedCode = await hashDeviceIdWithGrade(deviceId, selectedGrade);

            if (generatedCode === "CODE-NOSUBTLECRYPTO" || generatedCode === "CODE-HASHINGERROR") {
                if (codeOutput) codeOutput.value = '';
                showStatus('Error generating code. Check console or browser security.', 'error');
            } else {
                if (codeOutput) codeOutput.value = generatedCode;
                showStatus('Code generated successfully!', 'success');
                if (copyBtn) copyBtn.disabled = false;
            }
        } catch (error) {
            console.error("Unexpected error during code generation:", error);
            if (codeOutput) codeOutput.value = '';
            showStatus('An unexpected error occurred.', 'error');
        } finally {
            generateBtn.disabled = false;
        }
    });
}

if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        const codeToCopy = codeOutput ? codeOutput.value : '';
        if (!codeToCopy) return;

        try {
            // Modern Clipboard API (requires secure context - HTTPS/localhost)
            await navigator.clipboard.writeText(codeToCopy);
            showStatus('Code copied to clipboard!', 'success');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = originalText; }, 2000);

        } catch (err) {
            console.error('Failed to copy code using navigator.clipboard:', err);
            // Fallback
            try {
                const textArea = document.createElement("textarea");
                textArea.value = codeToCopy;
                textArea.style.position = "absolute";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                showStatus('Code copied (fallback method)!', 'success');
                 const originalText = copyBtn.textContent;
                 copyBtn.textContent = 'Copied!';
                 setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy method failed:', fallbackErr);
                showStatus('Could not copy code. Please copy manually.', 'error');
            }
        }
    });
}

// --- Utility Function (Generator Tool) ---
function showStatus(message, type = 'info') {
    if (statusMsg) { // Check if statusMsg element exists
        statusMsg.textContent = message;
        statusMsg.className = 'status-message';
        if (type === 'error') {
            statusMsg.classList.add('error');
        } else if (type === 'success') {
            statusMsg.classList.add('success');
        }
    } else {
        console.log(`Status (${type}): ${message}`); // Fallback to console if element not found
    }
}