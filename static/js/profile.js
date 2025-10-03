// Profile Page JavaScript with High Quality Image Processing
let currentSection = 'posts';

// High quality image processing function
function processHighQualityImage(file, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Calculate optimal dimensions (maintain aspect ratio)
        let { width, height } = img;
        const maxWidth = 1920;  // High resolution
        const maxHeight = 1080;
        
        // Only resize if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to maximum quality JPEG (98% quality)
        const highQualityDataUrl = canvas.toDataURL('image/jpeg', 0.98);
        callback(highQualityDataUrl);
    };
    
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Section Navigation
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    const sectionEl = document.getElementById(section + '-section');
    if (sectionEl) {
        sectionEl.style.display = 'block';
    }
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick*="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentSection = section;
    
    // Load followers/following if needed
    if (section === 'posts') {
        loadFollowersPreview();
        loadFollowingPreview();
    }
}

// Follow/Unfollow functionality
window.toggleFollow = async function(userId) {
    const btn = document.getElementById('followBtn');
    if (!btn) return;
    
    const isFollowing = btn.innerHTML.includes('Following');
    
    try {
        const response = await fetch(`/api/follow/${userId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.is_following) {
                btn.innerHTML = '<i class="fas fa-user-check"></i> Following';
                btn.classList.add('following');
            } else {
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                btn.classList.remove('following');
            }
            
            // Update follower count
            const followersCount = document.getElementById('followers-count');
            if (followersCount) {
                followersCount.textContent = data.followers_count;
            }
            
            showToast(data.is_following ? 'Now following user' : 'Unfollowed user');
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        showToast('Error updating follow status', 'error');
    }
};

// Load followers preview for sidebar
async function loadFollowersPreview() {
    const followersList = document.getElementById('followers-list');
    if (!followersList) return;
    
    const username = window.location.pathname.split('/')[2] || '';
    if (!username) return;
    
    try {
        const response = await fetch(`/api/followers/${username}/`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.followers && data.followers.length > 0) {
                const previewHtml = data.followers.slice(0, 5).map(user => `
                    <div class="user-item" onclick="window.location.href='/profile/${user.username}/'">
                        <div class="user-avatar">
                            ${user.profile_pic ? 
                                `<img src="${user.profile_pic}" alt="${user.username}">` :
                                `<div class="avatar-fallback">${user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}</div>`
                            }
                        </div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.username}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </div>
                `).join('');
                
                followersList.innerHTML = previewHtml;
                
                if (data.followers.length > 5) {
                    followersList.innerHTML += `
                        <div class="view-all-btn" onclick="showFollowers()">
                            <span>View all ${data.total_count} followers</span>
                        </div>
                    `;
                }
            } else {
                followersList.innerHTML = `
                    <div class="empty-sidebar">
                        <i class="fas fa-users"></i>
                        <p>No followers yet</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading followers:', error);
        followersList.innerHTML = `
            <div class="empty-sidebar">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading followers</p>
            </div>
        `;
    }
}

// Load following preview for sidebar
async function loadFollowingPreview() {
    const followingList = document.getElementById('following-list');
    if (!followingList) return;
    
    const username = window.location.pathname.split('/')[2] || '';
    if (!username) return;
    
    try {
        const response = await fetch(`/api/following/${username}/`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.following && data.following.length > 0) {
                const previewHtml = data.following.slice(0, 5).map(user => `
                    <div class="user-item" onclick="window.location.href='/profile/${user.username}/'">
                        <div class="user-avatar">
                            ${user.profile_pic ? 
                                `<img src="${user.profile_pic}" alt="${user.username}">` :
                                `<div class="avatar-fallback">${user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}</div>`
                            }
                        </div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.username}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </div>
                `).join('');
                
                followingList.innerHTML = previewHtml;
                
                if (data.following.length > 5) {
                    followingList.innerHTML += `
                        <div class="view-all-btn" onclick="showFollowing()">
                            <span>View all ${data.total_count} following</span>
                        </div>
                    `;
                }
            } else {
                followingList.innerHTML = `
                    <div class="empty-sidebar">
                        <i class="fas fa-user-plus"></i>
                        <p>Not following anyone</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading following:', error);
        followingList.innerHTML = `
            <div class="empty-sidebar">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading following</p>
            </div>
        `;
    }
}

// Show followers modal
async function showFollowers() {
    const modal = document.getElementById('followersModal');
    const list = document.getElementById('followers-modal-list');
    
    if (!modal || !list) return;
    
    modal.style.display = 'block';
    list.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><span>Loading followers...</span></div>';
    
    try {
        const username = window.location.pathname.split('/')[2] || '';
        const response = await fetch(`/api/followers/${username}/`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.followers && data.followers.length > 0) {
                const html = data.followers.map(user => `
                    <div class="user-item" onclick="window.location.href='/profile/${user.username}/'">
                        <div class="user-avatar">
                            ${user.profile_pic ? 
                                `<img src="${user.profile_pic}" alt="${user.username}">` :
                                `<div class="avatar-fallback">${user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}</div>`
                            }
                        </div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.username}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </div>
                `).join('');
                
                list.innerHTML = html;
            } else {
                list.innerHTML = '<div class="empty-state"><p>No followers yet</p></div>';
            }
        }
    } catch (error) {
        console.error('Error loading followers:', error);
        list.innerHTML = '<div class="empty-state"><p>Error loading followers</p></div>';
    }
}

// Show following modal
async function showFollowing() {
    const modal = document.getElementById('followingModal');
    const list = document.getElementById('following-modal-list');
    
    if (!modal || !list) return;
    
    modal.style.display = 'block';
    list.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><span>Loading following...</span></div>';
    
    try {
        const username = window.location.pathname.split('/')[2] || '';
        const response = await fetch(`/api/following/${username}/`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.following && data.following.length > 0) {
                const html = data.following.map(user => `
                    <div class="user-item" onclick="window.location.href='/profile/${user.username}/'">
                        <div class="user-avatar">
                            ${user.profile_pic ? 
                                `<img src="${user.profile_pic}" alt="${user.username}">` :
                                `<div class="avatar-fallback">${user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}</div>`
                            }
                        </div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.username}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </div>
                `).join('');
                
                list.innerHTML = html;
            } else {
                list.innerHTML = '<div class="empty-state"><p>Not following anyone</p></div>';
            }
        }
    } catch (error) {
        console.error('Error loading following:', error);
        list.innerHTML = '<div class="empty-state"><p>Error loading following</p></div>';
    }
}

// Close modals
function closeFollowersModal() {
    const modal = document.getElementById('followersModal');
    if (modal) modal.style.display = 'none';
}

function closeFollowingModal() {
    const modal = document.getElementById('followingModal');
    if (modal) modal.style.display = 'none';
}

// Edit Profile Modal
function openEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'block';
}

function closeEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
}

// Edit Avatar Modal
function openAvatarEdit() {
    const modal = document.getElementById('editAvatarModal');
    if (modal) modal.style.display = 'block';
}

function closeAvatarEdit() {
    const modal = document.getElementById('editAvatarModal');
    if (modal) modal.style.display = 'none';
}

// Edit Cover Modal
function openCoverEdit() {
    const modal = document.getElementById('editCoverModal');
    if (modal) modal.style.display = 'block';
}

function closeCoverEdit() {
    const modal = document.getElementById('editCoverModal');
    if (modal) modal.style.display = 'none';
}

// Form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Edit Profile Form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/edit_profile/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    showToast('Profile updated successfully');
                    closeEditProfile();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast('Error updating profile', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showToast('Error updating profile', 'error');
            }
        });
    }
    
    // Edit Avatar Form
    const editAvatarForm = document.getElementById('editAvatarForm');
    if (editAvatarForm) {
        editAvatarForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/edit_profile/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    showToast('Profile picture updated successfully');
                    closeAvatarEdit();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast('Error updating profile picture', 'error');
                }
            } catch (error) {
                console.error('Error updating avatar:', error);
                showToast('Error updating profile picture', 'error');
            }
        });
    }
    
    // Edit Cover Form
    const editCoverForm = document.getElementById('editCoverForm');
    if (editCoverForm) {
        editCoverForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/edit_profile/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    showToast('Cover photo updated successfully');
                    closeCoverEdit();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast('Error updating cover photo', 'error');
                }
            } catch (error) {
                console.error('Error updating cover:', error);
                showToast('Error updating cover photo', 'error');
            }
        });
    }
    
    // Remove cover photo
    window.removeCoverPhoto = async function() {
        if (!confirm('Are you sure you want to remove your cover photo?')) return;
        
        try {
            const formData = new FormData();
            formData.append('remove_cover', 'true');
            formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
            
            const response = await fetch('/edit_profile/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showToast('Cover photo removed successfully');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Error removing cover photo', 'error');
            }
        } catch (error) {
            console.error('Error removing cover:', error);
            showToast('Error removing cover photo', 'error');
        }
    };
    
    // Remove profile picture
    window.removeProfilePic = async function() {
        if (!confirm('Are you sure you want to remove your profile picture?')) return;
        
        try {
            const formData = new FormData();
            formData.append('remove_avatar', 'true');
            formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
            
            const response = await fetch('/edit_profile/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showToast('Profile picture removed successfully');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Error removing profile picture', 'error');
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            showToast('Error removing profile picture', 'error');
        }
    };
    
    // File input previews
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Process with high quality
                processHighQualityImage(file, function(highQualityDataUrl) {
                    const preview = document.getElementById('avatarPreview');
                    const img = document.getElementById('avatarPreviewImg');
                    if (preview && img) {
                        img.src = highQualityDataUrl;
                        preview.style.display = 'block';
                    }
                });
            }
        });
    }
    
    const coverInput = document.getElementById('coverInput');
    if (coverInput) {
        coverInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Process with high quality
                processHighQualityImage(file, function(highQualityDataUrl) {
                    const preview = document.getElementById('coverPreview');
                    const img = document.getElementById('coverPreviewImg');
                    if (preview && img) {
                        img.src = highQualityDataUrl;
                        preview.style.display = 'block';
                    }
                });
            }
        });
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Initialize page
    showSection('posts');
});

// Utility functions
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Message functionality
window.sendMessage = function(userId) {
    // Redirect to messages page or open message modal
    window.location.href = `/messages/${userId}/`;
};

// Share profile functionality
window.shareProfile = function() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Profile link copied to clipboard');
        });
    }
};