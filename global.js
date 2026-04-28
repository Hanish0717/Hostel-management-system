const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://localhost:5000" 
    : window.location.origin;

window.BASE_URL = BASE_URL;

/**
 * Global API wrapper to handle errors, loading states, and empty states.
 * @param {string} endpoint - API endpoint (e.g. '/api/auth/login')
 * @param {object} options - Fetch options (method, headers, body)
 * @param {HTMLElement} btnElement - Optional button element to disable/show loading
 */
window.apiCall = async function(endpoint, options = {}, btnElement = null) {
    let originalText = "";
    if (btnElement) {
        originalText = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.classList.add("btn-loading");
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            let errorMsg = data && data.message ? data.message : "An unexpected error occurred.";
            if (response.status === 401) {
                errorMsg = "Unauthorized: Please login again.";
                // Optional: window.location.href = 'login.html';
            }
            throw new Error(errorMsg);
        }

        return { success: true, data };

    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        
        // Handle network connection errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error("Server is not reachable. Please check your connection or server status.");
        }

        throw error;
    } finally {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.classList.remove("btn-loading");
            btnElement.innerHTML = originalText;
        }
    }
};

window.safeFetchCheck = async function(btnElement) {
    let originalText = "Submit";
    if (btnElement) {
        originalText = btnElement.textContent;
        btnElement.textContent = "Checking Server...";
        btnElement.disabled = true;
    }
    
    let isRunning = false;
    for (let i = 0; i < 2; i++) {
        try {
            const res = await fetch(`${BASE_URL}/api/health`);
            if (res.ok) {
                isRunning = true;
                break;
            }
        } catch (e) {}
        if (!isRunning && i === 0) await new Promise(r => setTimeout(r, 1000));
    }
    
    if (btnElement) {
        btnElement.textContent = originalText;
        btnElement.disabled = false;
    }
    
    if (!isRunning) {
        alert("Server not running ❌ Please check your server connection.");
        return false;
    } else {
        alert("Request failed, but server is running! (Check console for API details)");
        return true;
    }
};
