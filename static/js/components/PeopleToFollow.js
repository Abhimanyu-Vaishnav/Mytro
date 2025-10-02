// PeopleToFollow.js - Vanilla JavaScript for Django templates

class PeopleToFollow {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Follow buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.follow-btn')) {
                const button = e.target.closest('.follow-btn');
                const userId = button.getAttribute('onclick').match(/\d+/)[0];
                this.handleFollow(userId, button);
            }
        });

        // Refresh suggestions
        const refreshBtn = document.querySelector('.refresh-suggestions');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.refreshSuggestions();
            });
        }
    }

    async handleFollow(userId, button) {
        try {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const response = await fetch(`/api/follow/${userId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.following) {
                    button.textContent = 'Following';
                    button.classList.add('following');
                    this.showNotification('Started following user');
                } else {
                    button.textContent = 'Follow';
                    button.classList.remove('following');
                    this.showNotification('Unfollowed user');
                }
            } else {
                throw new Error('Failed to follow user');
            }
        } catch (error) {
            console.error('Error following user:', error);
            this.showNotification('Error following user', 'error');
        } finally {
            button.disabled = false;
        }
    }

    async refreshSuggestions() {
        const refreshBtn = document.querySelector('.refresh-suggestions');
        const suggestionsList = document.getElementById('suggestionsList');

        if (refreshBtn && suggestionsList) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            refreshBtn.disabled = true;

            try {
                // Simple page reload for now
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (error) {
                console.error('Error refreshing suggestions:', error);
                this.showNotification('Error refreshing suggestions', 'error');
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshBtn.disabled = false;
            }
        }
    }

    getCSRFToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new PeopleToFollow();
});