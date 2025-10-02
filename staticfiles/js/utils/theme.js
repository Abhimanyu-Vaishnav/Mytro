// // =============================================
// // THEME MANAGEMENT
// // =============================================

// class ThemeManager {
//   constructor() {
//     this.currentTheme = localStorage.getItem('theme') || 'light';
//     this.init();
//   }

//   init() {
//     this.applyTheme(this.currentTheme);
//     this.setupThemeToggle();
//   }

//   applyTheme(theme) {
//     document.documentElement.setAttribute('data-theme', theme);
//     localStorage.setItem('theme', theme);
//     this.currentTheme = theme;
//   }

//   toggleTheme() {
//     const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
//     this.applyTheme(newTheme);
//     return newTheme;
//   }

//   setupThemeToggle() {
//     const toggle = document.getElementById('themeToggle');
//     if (toggle) {
//       toggle.addEventListener('click', () => {
//         const newTheme = this.toggleTheme();
//         window.mytroNotifications.show(`Switched to ${newTheme} theme`, 'info');
//       });
//     }
//   }

//   getCurrentTheme() {
//     return this.currentTheme;
//   }
// }

// window.themeManager = new ThemeManager();


// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('mytro-theme') || 'light';
    setTheme(savedTheme);
    
    // Create theme toggle button if not exists
    if (!document.getElementById('themeToggle')) {
        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.className = 'theme-toggle-btn';
        themeToggle.onclick = toggleTheme;
        
        // Add styles
        themeToggle.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--gradient-primary);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 24px;
            box-shadow: 0 4px 20px rgba(255, 153, 51, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(themeToggle);
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mytro-theme', theme);
    
    // Update theme toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Show theme change notification
    showToast(`Theme changed to ${newTheme} mode`);
}

// Initialize theme when DOM loads
document.addEventListener('DOMContentLoaded', initializeTheme);