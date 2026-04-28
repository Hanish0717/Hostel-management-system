document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI based on saved LocalStorage values
    const currentTheme = localStorage.getItem('theme') || 'light';
    const themeRadios = document.querySelectorAll('input[name="themeMode"]');
    
    // Check the correct radio button
    if (currentTheme === 'dark') {
        document.querySelector('input[value="dark"]').checked = true;
    } else {
        document.querySelector('input[value="light"]').checked = true;
    }

    // Set toggle states
    const notifyToggle = document.getElementById('toggleNotifications');
    notifyToggle.checked = localStorage.getItem('push-notifications') === 'true';

    // Set default page
    const defaultPage = document.getElementById('defaultPageSelect');
    if (localStorage.getItem('default-page')) {
        defaultPage.value = localStorage.getItem('default-page');
    }

    // Populate Account Mock Data
    const userName = localStorage.getItem('user-name') || 'Warden User';
    const userEmail = localStorage.getItem('user-email') || 'warden@hostel.com';
    document.getElementById('accountName').value = userName;
    document.getElementById('accountEmail').value = userEmail;

    // 2. Attach Event Listeners for instant theme changes
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            
            // Use the global function defined in theme.js
            if(typeof window.setGlobalTheme === 'function') {
                window.setGlobalTheme(selectedTheme);
            } else {
                // Fallback just in case
                localStorage.setItem('theme', selectedTheme);
                document.documentElement.className = selectedTheme;
                document.body.className = selectedTheme;
            }
            
            showToast("Theme updated successfully!");
        });
    });

    // Preferences Listeners
    notifyToggle.addEventListener('change', (e) => {
        localStorage.setItem('push-notifications', e.target.checked);
        showToast("Notification preferences updated!");
    });

    defaultPage.addEventListener('change', (e) => {
        localStorage.setItem('default-page', e.target.value);
        showToast("Default landing page updated!");
    });
});

// Sidebar Toggle Function (Mobile)
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Form Submission for Account Info
function saveAccountSettings(e) {
    e.preventDefault();
    const newName = document.getElementById('accountName').value;
    const newEmail = document.getElementById('accountEmail').value;
    const newPass = document.getElementById('accountPassword').value;

    localStorage.setItem('user-name', newName);
    localStorage.setItem('user-email', newEmail);
    
    console.log("Mock saved:", { name: newName, email: newEmail, password: newPass ? "****" : "unchanged" });
    document.getElementById('accountPassword').value = '';
    
    showToast("Account details saved successfully!");
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
