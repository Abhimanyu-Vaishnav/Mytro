// Main JavaScript for Mytro

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize all components
    initializeNavigation();
    initializeModals();
    initializeSearch();
    initializeNotifications();
    initializeTheme();
    
    // Load initial data
    loadOnlineFriends();
    loadNotifications();
    
    console.log('Mytro app initialized successfully');
}

// Navigation functionality
function initializeNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const messagesBtn = document.getElementById('messagesBtn');
    const closeNotifications = document.getElementById('closeNotifications');
    const closeMessages = document.getElementById('closeMessages');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const messagesPanel = document.getElementById('messagesPanel');

    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
        });
    }

    // Notifications panel
    if (notificationsBtn && notificationsPanel) {
        notificationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            notificationsPanel.classList.add('active');
        });
    }

    if (closeNotifications && notificationsPanel) {
        closeNotifications.addEventListener('click', function() {
            notificationsPanel.classList.remove('active');
        });
    }

    // Messages panel
    if (messagesBtn && messagesPanel) {
        messagesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            messagesPanel.classList.add('active');
        });
    }

    if (closeMessages && messagesPanel) {
        closeMessages.addEventListener('click', function() {
            messagesPanel.classList.remove('active');
        });
    }

    // Close panels when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationsPanel && !notificationsPanel.contains(e.target) && !notificationsBtn.contains(e.target)) {
            notificationsPanel.classList.remove('active');
        }
        if (messagesPanel && !messagesPanel.contains(e.target) && !messagesBtn.contains(e.target)) {
            messagesPanel.classList.remove('active');
        }
    });
}

// Modal functionality
function initializeModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Close modals with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openCreatePostModal() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const query = e.target.value.trim();
            if (query.length > 2) {
                performSearch(query);
            }
        }, 300));
    }
}

async function performSearch(query) {
    try {
        // This would typically make an API call to your Django backend
        console.log('Searching for:', query);
        // Implement actual search logic here
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Notifications
function initializeNotifications() {
    // Mark all as read functionality
    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllNotificationsAsRead();
        });
    }
}

async function loadNotifications() {
    try {
        // Fetch notifications from backend
        // const response = await fetch('/api/notifications/');
        // const notifications = await response.json();
        // renderNotifications(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        // API call to mark all as read
        // await fetch('/api/notifications/mark-all-read/', { method: 'POST' });
        // updateNotificationBadge(0);
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}

// Online friends
async function loadOnlineFriends() {
    try {
        // Fetch online friends from backend
        // const response = await fetch('/api/online-friends/');
        // const friends = await response.json();
        // renderOnlineFriends(friends);
    } catch (error) {
        console.error('Error loading online friends:', error);
    }
}

// Theme functionality
function initializeTheme() {
    const savedTheme = localStorage.getItem('mytro-theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mytro-theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Export for use in other modules
window.Mytro = {
    openCreatePostModal,
    closeAllModals,
    showToast,
    formatTimeAgo,
    toggleTheme
};