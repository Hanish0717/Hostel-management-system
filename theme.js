/**
 * Global Theme Engine
 * Automatically applies the saved theme from localStorage on page load.
 */

(function initTheme() {
    // 1. Read theme from localStorage (default to 'light' if not set)
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // 2. Apply theme classes instantly to avoid flashing
    const body = document.body;
    const html = document.documentElement;

    body.classList.remove('light', 'dark');
    html.classList.remove('light', 'dark');

    body.classList.add(savedTheme);
    html.classList.add(savedTheme);

    // Provide a global function for Settings page to use
    window.setGlobalTheme = function(newTheme) {
        if (newTheme !== 'light' && newTheme !== 'dark') {
            newTheme = 'light';
        }

        // Save to localStorage
        localStorage.setItem('theme', newTheme);

        // Apply immediately
        body.classList.remove('light', 'dark');
        html.classList.remove('light', 'dark');
        
        body.classList.add(newTheme);
        html.classList.add(newTheme);
    };

    // Automatically expose setGlobalTheme globally
})();

// Create themeManager object for backward compatibility
window.themeManager = {
    isDarkMode: function() {
        return localStorage.getItem('theme') === 'dark';
    },
    setDarkMode: function(isDark) {
        window.setGlobalTheme(isDark ? 'dark' : 'light');
    }
};
