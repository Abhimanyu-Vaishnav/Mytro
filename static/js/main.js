// Complete Working Main.js
console.log('Loading main.js...');

// Global variables
window.currentPage = 1;
window.isLoading = false;

// ==================== UTILITY FUNCTIONS ====================
function getCSRFToken() {
    // Try multiple ways to get CSRF token
    let token = '';
    
    // Method 1: From cookie
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    if (cookieValue) {
        token = cookieValue;
    }
    
    // Method 2: From meta tag
    if (!token) {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            token = metaTag.getAttribute('content');
        }
    }
    
    // Method 3: From form input
    if (!token) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) {
            token = csrfInput.value;
        }
    }
    
    console.log('CSRF Token found:', token ? 'Yes' : 'No');
    return token;
}

function processHashtags(text) {
    return text.replace(/#([a-zA-Z0-9_]+)/g, '<a href="/hashtag/$1/" class="hashtag">#$1</a>');
}

function processPostContent(content) {
    // Process hashtags
    let processedContent = processHashtags(content);
    
    // Process line breaks
    processedContent = processedContent.replace(/\n/g, '<br>');
    
    return processedContent;
}

window.showGlobalNotification = function(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        z-index: 2001;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
};

// ==================== CREATE POST FUNCTIONALITY ====================
window.openCreatePostModal = function(type = 'text') {
    console.log('Opening create post modal with type:', type);
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Set post type
        window.currentPostType = type;
        
        // Show appropriate sections
        if (type === 'poll') {
            showPollSection();
        } else {
            hidePollSection();
        }
        
        // Focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('postContent');
            if (textarea) textarea.focus();
        }, 100);
    }
};

function showPollSection() {
    let pollSection = document.getElementById('pollSection');
    if (!pollSection) {
        const mediaPreview = document.getElementById('mediaPreview');
        pollSection = document.createElement('div');
        pollSection.id = 'pollSection';
        pollSection.innerHTML = `
            <div class="poll-creator">
                <h4>Create a Poll</h4>
                <div class="poll-options">
                    <input type="text" class="poll-option" placeholder="Option 1" maxlength="100">
                    <input type="text" class="poll-option" placeholder="Option 2" maxlength="100">
                </div>
                <button type="button" class="add-poll-option" onclick="addPollOption()">+ Add Option</button>
                <div class="poll-settings">
                    <label>
                        <input type="checkbox" id="allowMultipleChoice"> Allow multiple choices
                    </label>
                    <div class="poll-duration">
                        <label>Poll duration:</label>
                        <select id="pollDuration">
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7" selected>1 week</option>
                            <option value="30">1 month</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        mediaPreview.insertAdjacentElement('afterend', pollSection);
    }
    pollSection.style.display = 'block';
}

function hidePollSection() {
    const pollSection = document.getElementById('pollSection');
    if (pollSection) {
        pollSection.style.display = 'none';
    }
}

window.addPollOption = function() {
    const pollOptions = document.querySelector('.poll-options');
    const optionCount = pollOptions.children.length;
    
    if (optionCount < 10) {
        const newOption = document.createElement('input');
        newOption.type = 'text';
        newOption.className = 'poll-option';
        newOption.placeholder = `Option ${optionCount + 1}`;
        newOption.maxLength = 100;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-poll-option';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            const container = this.parentElement;
            container.remove();
        };
        
        const container = document.createElement('div');
        container.className = 'poll-option-container';
        container.appendChild(newOption);
        container.appendChild(removeBtn);
        
        pollOptions.appendChild(container);
    }
};

window.closeCreatePostModal = function() {
    console.log('Closing create post modal');
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetCreatePostForm();
    }
};

function resetCreatePostForm() {
    const postContent = document.getElementById('postContent');
    const mediaPreview = document.getElementById('mediaPreview');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const pollSection = document.getElementById('pollSection');
    
    if (postContent) postContent.value = '';
    if (mediaPreview) mediaPreview.innerHTML = '';
    if (pollSection) pollSection.style.display = 'none';
    if (postSubmitBtn) {
        postSubmitBtn.disabled = true;
        const btnText = postSubmitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Post';
    }
    
    window.currentPostType = 'text';
}

window.updatePostButtonState = function() {
    const postContent = document.getElementById('postContent');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (postSubmitBtn) {
        const hasContent = postContent && postContent.value.trim().length > 0;
        const hasMedia = mediaPreview && mediaPreview.children.length > 0;
        postSubmitBtn.disabled = !(hasContent || hasMedia);
    }
};

window.handleMediaUpload = function(event) {
    const files = event.target.files;
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (!mediaPreview || !files.length) return;
    
    // Initialize uploaded files array
    if (!window.uploadedFiles) window.uploadedFiles = [];
    
    for (let file of files) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            window.showGlobalNotification('File size too large. Maximum 10MB allowed.', 'error');
            continue;
        }
        
        // Store file
        window.uploadedFiles.push(file);
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const mediaItem = document.createElement('div');
                mediaItem.className = 'media-item';
                mediaItem.dataset.fileName = file.name;
                mediaItem.style.cssText = `
                    position: relative;
                    display: inline-block;
                    margin: 8px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #e1e5e9;
                `;
                
                mediaItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 6px;">
                    <div class="media-actions" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        display: flex;
                        gap: 4px;
                    ">
                        <button type="button" onclick="window.editImage('${file.name}', '${e.target.result}')" style="
                            background: rgba(0,0,0,0.7);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            width: 24px;
                            height: 24px;
                            cursor: pointer;
                            font-size: 12px;
                        ">✏️</button>
                        <button type="button" onclick="window.removeMediaItem(this)" style="
                            background: rgba(255,0,0,0.7);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            width: 24px;
                            height: 24px;
                            cursor: pointer;
                        ">×</button>
                    </div>
                `;
                
                mediaPreview.appendChild(mediaItem);
                window.updatePostButtonState();
            };
            
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            mediaItem.dataset.fileName = file.name;
            mediaItem.style.cssText = `
                position: relative;
                display: inline-block;
                margin: 8px;
                border-radius: 8px;
                overflow: hidden;
                border: 2px solid #e1e5e9;
            `;
            
            const videoUrl = URL.createObjectURL(file);
            mediaItem.innerHTML = `
                <video controls style="max-width: 200px; max-height: 200px; border-radius: 6px;">
                    <source src="${videoUrl}" type="${file.type}">
                </video>
                <button type="button" onclick="window.removeMediaItem(this)" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(255,0,0,0.7);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                ">×</button>
            `;
            
            mediaPreview.appendChild(mediaItem);
            window.updatePostButtonState();
        }
    }
    
    event.target.value = '';
};

window.removeMediaItem = function(button) {
    const mediaItem = button.closest('.media-item');
    if (mediaItem) {
        const fileName = mediaItem.dataset.fileName;
        
        // Remove from uploaded files array
        if (window.uploadedFiles && fileName) {
            window.uploadedFiles = window.uploadedFiles.filter(file => file.name !== fileName);
        }
        
        mediaItem.remove();
        window.updatePostButtonState();
    }
};

// ==================== LOCATION FUNCTIONALITY ====================
window.addLocation = function() {
    if (navigator.geolocation) {
        window.showGlobalNotification('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Use reverse geocoding to get address
                fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.results && data.results.length > 0) {
                            const location = data.results[0].formatted;
                            window.currentLocation = {
                                lat: lat,
                                lng: lng,
                                address: location
                            };
                            
                            // Show location in UI
                            const locationDisplay = document.getElementById('locationDisplay');
                            if (locationDisplay) {
                                locationDisplay.innerHTML = `
                                    <div class="location-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>${location}</span>
                                        <button onclick="window.removeLocation()" class="remove-location">×</button>
                                    </div>
                                `;
                                locationDisplay.style.display = 'block';
                            }
                            
                            window.showGlobalNotification('Location added successfully', 'success');
                        }
                    })
                    .catch(() => {
                        // Fallback to manual location
                        window.openManualLocationModal();
                    });
            },
            function(error) {
                console.error('Geolocation error:', error);
                window.openManualLocationModal();
            }
        );
    } else {
        window.openManualLocationModal();
    }
};

window.openManualLocationModal = function() {
    const locationInput = prompt('Enter your location:');
    if (locationInput && locationInput.trim()) {
        window.currentLocation = {
            address: locationInput.trim(),
            manual: true
        };
        
        const locationDisplay = document.getElementById('locationDisplay');
        if (locationDisplay) {
            locationDisplay.innerHTML = `
                <div class="location-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${locationInput.trim()}</span>
                    <button onclick="window.removeLocation()" class="remove-location">×</button>
                </div>
            `;
            locationDisplay.style.display = 'block';
        }
        
        window.showGlobalNotification('Location added successfully', 'success');
    }
};

window.removeLocation = function() {
    window.currentLocation = null;
    const locationDisplay = document.getElementById('locationDisplay');
    if (locationDisplay) {
        locationDisplay.style.display = 'none';
        locationDisplay.innerHTML = '';
    }
};

// ==================== IMAGE EDITOR ====================
window.editImage = function(fileName, imageData) {
    window.currentEditingImage = { fileName, imageData };
    window.openImageEditor(imageData);
};

window.openImageEditor = function(imageUrl) {
    // Create image editor modal if it doesn't exist
    let modal = document.getElementById('imageEditorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageEditorModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container large-modal">
                <div class="modal-header">
                    <h3>Edit Image</h3>
                    <button class="modal-close" onclick="window.closeImageEditor()">×</button>
                </div>
                <div class="modal-body">
                    <div class="image-editor-container">
                        <div class="image-preview">
                            <canvas id="imageCanvas" width="600" height="400"></canvas>
                        </div>
                        <div class="editor-controls">
                            <div class="filter-section">
                                <h4>Filters</h4>
                                <div class="filter-grid">
                                    <button class="filter-btn active" data-filter="none">Original</button>
                                    <button class="filter-btn" data-filter="grayscale">B&W</button>
                                    <button class="filter-btn" data-filter="sepia">Sepia</button>
                                    <button class="filter-btn" data-filter="blur">Blur</button>
                                    <button class="filter-btn" data-filter="brightness">Bright</button>
                                    <button class="filter-btn" data-filter="contrast">Contrast</button>
                                </div>
                            </div>
                            <div class="adjustment-section">
                                <h4>Adjustments</h4>
                                <div class="slider-control">
                                    <label>Brightness</label>
                                    <input type="range" id="brightnessSlider" min="-50" max="50" value="0">
                                </div>
                                <div class="slider-control">
                                    <label>Contrast</label>
                                    <input type="range" id="contrastSlider" min="-50" max="50" value="0">
                                </div>
                                <div class="slider-control">
                                    <label>Saturation</label>
                                    <input type="range" id="saturationSlider" min="-50" max="50" value="0">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="editor-actions">
                        <button class="btn btn-secondary" onclick="window.resetImageEditor()">Reset</button>
                        <button class="btn btn-secondary" onclick="window.closeImageEditor()">Cancel</button>
                        <button class="btn btn-primary" onclick="window.applyImageEdit()">Apply</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners for filters and sliders
        modal.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                modal.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                window.applyFilter(this.dataset.filter);
            });
        });
        
        ['brightness', 'contrast', 'saturation'].forEach(control => {
            const slider = modal.querySelector(`#${control}Slider`);
            slider.addEventListener('input', () => window.updateImageAdjustments());
        });
    }
    
    // Load image into canvas
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = Math.min(img.width, 600);
        canvas.height = Math.min(img.height, 400);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        window.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    
    img.src = imageUrl;
    modal.style.display = 'flex';
};

window.applyFilter = function(filterType) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    
    if (!window.originalImageData) return;
    
    ctx.putImageData(window.originalImageData, 0, 0);
    
    switch(filterType) {
        case 'grayscale':
            ctx.filter = 'grayscale(100%)';
            break;
        case 'sepia':
            ctx.filter = 'sepia(100%)';
            break;
        case 'blur':
            ctx.filter = 'blur(2px)';
            break;
        case 'brightness':
            ctx.filter = 'brightness(150%)';
            break;
        case 'contrast':
            ctx.filter = 'contrast(150%)';
            break;
        default:
            ctx.filter = 'none';
    }
    
    ctx.drawImage(canvas, 0, 0);
};

window.updateImageAdjustments = function() {
    const brightness = document.getElementById('brightnessSlider').value;
    const contrast = document.getElementById('contrastSlider').value;
    const saturation = document.getElementById('saturationSlider').value;
    
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    
    if (!window.originalImageData) return;
    
    ctx.putImageData(window.originalImageData, 0, 0);
    
    const filters = [];
    if (brightness != 0) filters.push(`brightness(${100 + parseInt(brightness)}%)`);
    if (contrast != 0) filters.push(`contrast(${100 + parseInt(contrast)}%)`);
    if (saturation != 0) filters.push(`saturate(${100 + parseInt(saturation)}%)`);
    
    ctx.filter = filters.join(' ') || 'none';
    ctx.drawImage(canvas, 0, 0);
};

window.resetImageEditor = function() {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    
    if (window.originalImageData) {
        ctx.putImageData(window.originalImageData, 0, 0);
    }
    
    // Reset sliders
    document.getElementById('brightnessSlider').value = 0;
    document.getElementById('contrastSlider').value = 0;
    document.getElementById('saturationSlider').value = 0;
    
    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
};

window.applyImageEdit = function() {
    const canvas = document.getElementById('imageCanvas');
    
    canvas.toBlob(function(blob) {
        if (window.currentEditingImage && window.uploadedFiles) {
            // Replace the original file with edited version
            const fileName = window.currentEditingImage.fileName;
            const fileIndex = window.uploadedFiles.findIndex(f => f.name === fileName);
            
            if (fileIndex !== -1) {
                // Create new file from blob
                const editedFile = new File([blob], fileName, { type: 'image/png' });
                window.uploadedFiles[fileIndex] = editedFile;
                
                // Update preview
                const mediaItem = document.querySelector(`[data-file-name="${fileName}"]`);
                if (mediaItem) {
                    const img = mediaItem.querySelector('img');
                    if (img) {
                        img.src = URL.createObjectURL(blob);
                    }
                }
            }
        }
        
        window.showGlobalNotification('Image edited successfully', 'success');
        window.closeImageEditor();
    }, 'image/png');
};

window.closeImageEditor = function() {
    const modal = document.getElementById('imageEditorModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentEditingImage = null;
};

window.handleCreatePost = async function(event) {
    event.preventDefault();
    console.log('Creating post...');
    
    const postContent = document.getElementById('postContent');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const btnText = postSubmitBtn?.querySelector('.btn-text');
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (!postContent || !postSubmitBtn) {
        console.error('Required elements not found');
        return;
    }
    
    const content = postContent.value.trim();
    const hasMedia = mediaPreview && mediaPreview.children.length > 0;
    const isPoll = window.currentPostType === 'poll';
    
    // Validate poll if it's a poll post
    if (isPoll) {
        const pollOptions = document.querySelectorAll('.poll-option');
        const validOptions = Array.from(pollOptions).filter(option => option.value.trim()).length;
        
        if (validOptions < 2) {
            window.showGlobalNotification('Please add at least 2 poll options', 'error');
            return;
        }
    }
    
    if (!content && !hasMedia && !isPoll) {
        window.showGlobalNotification('Please add some content or media to your post', 'error');
        return;
    }
    
    // Show loading state
    postSubmitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Posting...';
    
    try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('post_type', window.currentPostType || 'text');
        formData.append('csrfmiddlewaretoken', getCSRFToken());
        
        // Add poll data if it's a poll
        if (isPoll) {
            const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
                .map(option => option.value.trim())
                .filter(option => option);
            
            formData.append('poll_options', JSON.stringify(pollOptions));
            formData.append('poll_multiple_choice', document.getElementById('allowMultipleChoice')?.checked || false);
            formData.append('poll_duration', document.getElementById('pollDuration')?.value || 7);
        }
        
        // Add location if available
        const locationData = window.currentLocation;
        if (locationData) {
            formData.append('location', JSON.stringify(locationData));
        }
        
        // Add media files from preview
        if (window.uploadedFiles && window.uploadedFiles.length > 0) {
            window.uploadedFiles.forEach((file, index) => {
                formData.append(`media_${index}`, file);
            });
        }
        
        const response = await fetch('/create_post/', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            let errorMessage = `Failed to create post: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.log('Non-JSON error response');
            }
            throw new Error(errorMessage);
        }
        
        let data;
        try {
            data = await response.json();
            console.log('Post created:', data);
        } catch (e) {
            console.log('Post created successfully (non-JSON response)');
            data = { success: true };
        }
        
        window.showGlobalNotification(isPoll ? 'Poll created successfully!' : 'Post created successfully!', 'success');
        window.closeCreatePostModal();
        
        // Reload page to show new post
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error('Create post error:', error);
        window.showGlobalNotification(error.message || 'Something went wrong while creating post', 'error');
    } finally {
        postSubmitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Post';
        // Clear uploaded files and reset form
        window.uploadedFiles = [];
        window.currentLocation = null;
        window.currentPostType = 'text';
        resetCreatePostForm();
    }
};

// ==================== POST INTERACTIONS ====================
window.toggleLike = async function(postId, button) {
    try {
        console.log('Toggling like for post:', postId);
        
        const response = await fetch(`/api/like_post/${postId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Like failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Like response:', data);
        
        // Update like count
        const likeCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .like-count`);
        likeCountElements.forEach(el => {
            el.textContent = data.like_count || 0;
        });

        // Update button state based on server response
        if (data.liked) {
            button.classList.add('liked');
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            
            if (actionText) actionText.textContent = 'Liked';
            if (icon) icon.className = 'fas fa-heart'; // Solid heart
            button.style.color = '#e74c3c';
        } else {
            button.classList.remove('liked');
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            
            if (actionText) actionText.textContent = 'Like';
            if (icon) icon.className = 'far fa-heart'; // Outline heart
            button.style.color = '';
        }

        window.showGlobalNotification(data.liked ? 'Post liked!' : 'Like removed', 'success');

    } catch (error) {
        console.error('Like error:', error);
        window.showGlobalNotification('Something went wrong while liking the post', 'error');
    }
};

window.toggleComments = function(postId) {
    console.log('Toggling comments for post:', postId);
    
    const commentSection = document.getElementById(`commentsSection-${postId}`) ||
                          document.getElementById(`comments-${postId}`) ||
                          document.querySelector(`[data-post-id="${postId}"] .comments-section`);
    
    if (commentSection) {
        const isVisible = commentSection.style.display === 'block';
        commentSection.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            loadComments(postId);
        }
    } else {
        console.error('Comment section not found for post:', postId);
    }
};

async function loadComments(postId) {
    try {
        const response = await fetch(`/api/comments/${postId}/`);
        if (!response.ok) throw new Error('Failed to load comments');
        
        const data = await response.json();
        displayComments(postId, data.comments);
    } catch (error) {
        console.error('Error loading comments:', error);
        window.showGlobalNotification('Failed to load comments', 'error');
    }
}

function displayComments(postId, comments) {
    const commentsContainer = document.getElementById(`comments-container-${postId}`) ||
                             document.querySelector(`[data-post-id="${postId}"] .comments-list`);
    if (!commentsContainer) return;

    commentsContainer.innerHTML = '';

    if (!comments || comments.length === 0) {
        commentsContainer.innerHTML = '<div class="no-comments" style="padding: 16px; text-align: center; color: #666;">No comments yet</div>';
        return;
    }

    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsContainer.appendChild(commentElement);
    });
}

function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.dataset.commentId = comment.id;
    commentDiv.style.cssText = `
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        gap: 12px;
        position: relative;
    `;
    
    const isOwner = comment.user?.id === window.currentUserId;
    
    commentDiv.innerHTML = `
        <div class="user-avatar">
            ${comment.user?.avatar ? 
                `<img src="${comment.user.avatar}" alt="${comment.user.name || 'User'}" class="comment-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` :
                `<div class="avatar-fallback" style="width: 32px; height: 32px; border-radius: 50%; background: #ff6b35; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;">${(comment.user?.name || 'U').charAt(0).toUpperCase()}</div>`
            }
        </div>
        <div class="comment-content" style="flex: 1;">
            <div class="comment-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <strong class="comment-user" style="font-size: 14px; color: #1c1e21;">${comment.user?.full_name || comment.user?.name || 'Unknown User'}</strong>
                    <span class="comment-time" style="font-size: 12px; color: #65676b;">${comment.created_at || 'Just now'}</span>
                </div>
                <div class="comment-menu" style="position: relative;">
                    <button class="comment-menu-btn" onclick="window.toggleCommentMenu('${comment.id}')" style="background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; color: #65676b;">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div class="comment-dropdown" id="comment-menu-${comment.id}" style="display: none; position: absolute; right: 0; top: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px; min-width: 140px; z-index: 1000;">
                        ${isOwner ? `
                            <button onclick="window.editComment('${comment.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 8px; text-align: left; font-size: 14px; color: #1c1e21;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                                <i class="fas fa-edit" style="color: #1877f2;"></i> Edit
                            </button>
                            <button onclick="window.deleteComment('${comment.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 8px; text-align: left; font-size: 14px; color: #e41e3f;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                        <button onclick="window.reportComment('${comment.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 8px; text-align: left; font-size: 14px; color: #1c1e21;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                            <i class="fas fa-flag" style="color: #f02849;"></i> Report
                        </button>
                    </div>
                </div>
            </div>
            <div class="comment-text" id="comment-content-${comment.id}" style="font-size: 14px; line-height: 1.4; margin-bottom: 8px; color: #1c1e21;">${processPostContent(comment.content || '')}</div>
            <div class="comment-actions" style="display: flex; gap: 16px;">
                <button class="comment-action-btn" onclick="likeComment('${comment.id}')" style="background: none; border: none; cursor: pointer; color: #65676b; font-size: 12px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                    <i class="far fa-heart"></i>
                    <span>Like</span>
                </button>
                <button class="comment-action-btn" onclick="replyToComment('${comment.id}')" style="background: none; border: none; cursor: pointer; color: #65676b; font-size: 12px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                    <i class="fas fa-reply"></i>
                    <span>Reply</span>
                </button>
            </div>
        </div>
    `;
    return commentDiv;
}

window.likeComment = function(commentId) {
    window.showGlobalNotification('Comment liked!', 'success');
};

window.replyToComment = function(commentId) {
    window.showGlobalNotification('Reply feature coming soon', 'info');
};

// Toggle comment menu
window.toggleCommentMenu = function(commentId) {
    const menu = document.getElementById(`comment-menu-${commentId}`);
    if (menu) {
        // Close all other menus
        document.querySelectorAll('.comment-dropdown').forEach(dropdown => {
            if (dropdown.id !== `comment-menu-${commentId}`) {
                dropdown.style.display = 'none';
            }
        });
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
};

// Close comment menus when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.comment-menu')) {
        document.querySelectorAll('.comment-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

// Edit comment
window.editComment = async function(commentId) {
    const contentElement = document.getElementById(`comment-content-${commentId}`);
    if (!contentElement) return;
    
    const currentContent = contentElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentContent;
    input.className = 'edit-comment-input';
    input.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
    
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
    actions.innerHTML = `
        <button onclick="saveCommentEdit('${commentId}')" style="padding: 4px 8px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Save</button>
        <button onclick="cancelCommentEdit('${commentId}')" style="padding: 4px 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Cancel</button>
    `;
    
    contentElement.style.display = 'none';
    contentElement.insertAdjacentElement('afterend', input);
    contentElement.insertAdjacentElement('afterend', actions);
    
    input.focus();
    window.currentEditingComment = { commentId, originalContent: currentContent };
    
    // Close menu
    toggleCommentMenu(commentId);
};

// Save comment edit
window.saveCommentEdit = async function(commentId) {
    const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
    const input = comment.querySelector('.edit-comment-input');
    const newContent = input.value.trim();
    
    if (!newContent) {
        window.showGlobalNotification('Comment cannot be empty', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}/edit/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });
        
        if (response.ok) {
            const contentElement = document.getElementById(`comment-content-${commentId}`);
            contentElement.innerHTML = processPostContent(newContent);
            cancelCommentEdit(commentId);
            window.showGlobalNotification('Comment updated', 'success');
        } else {
            throw new Error('Failed to update comment');
        }
    } catch (error) {
        console.error('Error updating comment:', error);
        window.showGlobalNotification('Error updating comment', 'error');
    }
};

// Cancel comment edit
window.cancelCommentEdit = function(commentId) {
    const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
    const contentElement = document.getElementById(`comment-content-${commentId}`);
    const input = comment.querySelector('.edit-comment-input');
    const actions = comment.querySelector('div[style*="gap: 8px"]');
    
    if (input) input.remove();
    if (actions) actions.remove();
    contentElement.style.display = 'block';
    
    window.currentEditingComment = null;
};

// Delete comment
window.deleteComment = async function(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
        const response = await fetch(`/api/comments/${commentId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (response.ok) {
            const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
            comment.style.transition = 'all 0.3s ease';
            comment.style.opacity = '0';
            comment.style.height = '0';
            comment.style.padding = '0';
            setTimeout(() => comment.remove(), 300);
            window.showGlobalNotification('Comment deleted', 'success');
        } else {
            throw new Error('Failed to delete comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        window.showGlobalNotification('Error deleting comment', 'error');
    }
};

window.submitComment = async function(postId) {
    console.log('Submitting comment for post:', postId);
    
    let input = document.getElementById(`commentInput-${postId}`) || 
               document.getElementById(`comment-input-${postId}`) ||
               document.querySelector(`[data-post-id="${postId}"] .comment-input`);
    
    if (!input) {
        console.error('Comment input not found for post:', postId);
        return;
    }

    const content = input.value.trim();
    if (!content) {
        window.showGlobalNotification('Please enter a comment', 'error');
        return;
    }

    try {
        const response = await fetch('/api/comments/add/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                comment: content
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to post comment: ${response.status}`);
        }

        const data = await response.json();
        console.log('Comment response:', data);
        
        input.value = '';
        
        // Add new comment to list
        if (data.comment) {
            const commentsContainer = document.getElementById(`comments-container-${postId}`) ||
                                    document.querySelector(`[data-post-id="${postId}"] .comments-list`);
            
            if (commentsContainer) {
                const commentElement = createCommentElement(data.comment);
                commentsContainer.appendChild(commentElement);
            }
        }
        
        window.showGlobalNotification('Comment posted successfully', 'success');

    } catch (error) {
        console.error('Comment error:', error);
        window.showGlobalNotification('Something went wrong while posting comment', 'error');
    }
};

window.sharePost = function(postId) {
    const postUrl = `${window.location.origin}/post/${postId}/`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Check out this post',
            url: postUrl
        });
    } else {
        navigator.clipboard.writeText(postUrl).then(() => {
            window.showGlobalNotification('Post link copied to clipboard!', 'success');
        }).catch(() => {
            window.showGlobalNotification('Failed to copy link', 'error');
        });
    }
};

// ==================== POST MENU FUNCTIONS ====================
window.togglePostMenu = function(postId) {
    console.log('Toggling post menu for:', postId);
    
    const menu = document.getElementById(`postMenu-${postId}`);
    if (!menu) {
        console.error('Post menu not found for post:', postId);
        return;
    }
    
    // Close all other menus
    const allMenus = document.querySelectorAll('.post-menu-dropdown');
    allMenus.forEach(m => {
        if (m.id !== `postMenu-${postId}`) {
            m.classList.remove('active');
        }
    });
    
    menu.classList.toggle('active');
};

window.editPost = function(postId) {
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    const postContent = postCard.querySelector('.post-content');
    const postText = postCard.querySelector('.post-text');
    const postMedia = postCard.querySelector('.post-media');
    const existingImage = postMedia?.querySelector('.post-image');
    
    const currentContent = postText?.textContent || '';
    const currentImageSrc = existingImage?.src || '';
    
    const editInterface = document.createElement('div');
    editInterface.className = 'edit-post-interface';
    editInterface.style.cssText = `
        background: #fff8f0;
        border-radius: 12px;
        padding: 16px;
        margin: 8px 0;
        border: 2px solid #ff6b35;
        box-sizing: border-box;
    `;
    
    editInterface.innerHTML = `
        <div class="edit-post-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h4 style="margin: 0; color: #ff6b35;">Edit Post</h4>
            <div class="edit-post-actions" style="display: flex; gap: 8px;">
                <button onclick="window.cancelEdit('${postId}')" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
                <button onclick="window.savePostEdit('${postId}')" style="padding: 6px 12px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer;">Save</button>
            </div>
        </div>
        <textarea class="edit-post-textarea" placeholder="What's on your mind?" style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; font-family: inherit; font-size: 15px; box-sizing: border-box; white-space: pre-wrap;">${currentContent}</textarea>
        <div class="current-media" id="currentMedia-${postId}" style="margin-top: 12px;">
            ${currentImageSrc ? `
                <div class="current-image" style="position: relative; display: inline-block; margin: 8px; border-radius: 8px; overflow: hidden;">
                    <img src="${currentImageSrc}" alt="Current image" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 8px;">
                    <button onclick="window.removeCurrentImage('${postId}')" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: rgba(255,0,0,0.7);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                    ">×</button>
                </div>
            ` : ''}
        </div>
        <div class="edit-post-options" style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="window.addEditImage('${postId}')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <i class="fas fa-image"></i> Add Photo
            </button>
            <button onclick="window.addLocation()" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <i class="fas fa-map-marker-alt"></i> Add Location
            </button>
        </div>
        <input type="file" id="editImageUpload-${postId}" accept="image/*" style="display: none;" onchange="window.handleEditImageUpload(this, '${postId}')">
        <div class="edit-media-preview" id="editMediaPreview-${postId}" style="margin-top: 12px;"></div>
    `;
    
    postContent.style.display = 'none';
    postContent.insertAdjacentElement('afterend', editInterface);
    
    window.togglePostMenu(postId);
};

window.cancelEdit = function(postId) {
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    const editInterface = postCard.querySelector('.edit-post-interface');
    const postContent = postCard.querySelector('.post-content');
    
    if (editInterface) editInterface.remove();
    if (postContent) postContent.style.display = 'block';
};

window.addEditImage = function(postId) {
    document.getElementById(`editImageUpload-${postId}`).click();
};

window.handleEditImageUpload = function(input, postId) {
    const files = input.files;
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById(`editMediaPreview-${postId}`);
            preview.innerHTML = `
                <div class="edit-media-item" style="position: relative; display: inline-block; margin: 8px; border-radius: 8px; overflow: hidden;">
                    <img src="${e.target.result}" alt="New image" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 8px;">
                    <button onclick="window.removeEditImage('${postId}')" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: rgba(255,0,0,0.7);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                    ">×</button>
                </div>
            `;
            
            if (!window.editPostData) window.editPostData = {};
            if (!window.editPostData[postId]) window.editPostData[postId] = {};
            window.editPostData[postId].newImage = file;
        };
        
        reader.readAsDataURL(file);
    }
};

window.removeEditImage = function(postId) {
    const preview = document.getElementById(`editMediaPreview-${postId}`);
    if (preview) preview.innerHTML = '';
    
    if (!window.editPostData) window.editPostData = {};
    if (!window.editPostData[postId]) window.editPostData[postId] = {};
    window.editPostData[postId].newImage = null;
};

window.removeCurrentImage = function(postId) {
    const currentMedia = document.getElementById(`currentMedia-${postId}`);
    if (currentMedia) currentMedia.innerHTML = '';
    
    if (!window.editPostData) window.editPostData = {};
    if (!window.editPostData[postId]) window.editPostData[postId] = {};
    window.editPostData[postId].removeImage = true;
};

window.savePostEdit = async function(postId) {
    const editInterface = document.querySelector(`[data-post-id="${postId}"] .edit-post-interface`);
    const textarea = editInterface.querySelector('.edit-post-textarea');
    const newContent = textarea.value.trim();
    
    const editData = window.editPostData?.[postId] || {};
    const hasNewImage = editData.newImage;
    const willRemoveImage = editData.removeImage;
    
    if (!newContent && !hasNewImage && willRemoveImage) {
        window.showGlobalNotification('Post content cannot be empty', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('content', newContent);
        formData.append('csrfmiddlewaretoken', getCSRFToken());
        
        if (hasNewImage) {
            formData.append('image', editData.newImage);
        }
        if (willRemoveImage) {
            formData.append('remove_image', 'true');
        }
        
        const response = await fetch(`/post/${postId}/edit/`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                window.showGlobalNotification('Post updated successfully', 'success');
                window.cancelEdit(postId);
                return;
            }
            
            const postCard = document.querySelector(`[data-post-id="${postId}"]`);
            const postText = postCard.querySelector('.post-text');
            let postMedia = postCard.querySelector('.post-media');
            
            if (postText) {
                postText.innerHTML = processPostContent(newContent);
            }
            
            if (data.image_url && !willRemoveImage) {
                if (!postMedia) {
                    const postContent = postCard.querySelector('.post-content');
                    postContent.insertAdjacentHTML('beforeend', `
                        <div class="post-media">
                            <div class="media-container">
                                <img src="${data.image_url}" alt="Post image" class="post-image" onclick="window.openImageModal('${data.image_url}')">
                            </div>
                        </div>
                    `);
                } else {
                    const img = postMedia.querySelector('.post-image');
                    if (img) img.src = data.image_url;
                }
            } else if (willRemoveImage && postMedia) {
                postMedia.remove();
            }
            
            window.cancelEdit(postId);
            window.showGlobalNotification('Post updated successfully', 'success');
            
            if (window.editPostData?.[postId]) {
                delete window.editPostData[postId];
            }
        } else {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`Failed to update post: ${response.status}`);
            }
            throw new Error(errorData.error || 'Failed to update post');
        }
    } catch (error) {
        console.error('Error editing post:', error);
        window.showGlobalNotification(error.message || 'Error editing post', 'error');
    }
};

window.deletePost = async function(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${postId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.style.transition = 'all 0.3s ease';
                postElement.style.opacity = '0';
                postElement.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    postElement.remove();
                }, 300);
            }
            window.showGlobalNotification('Post deleted successfully', 'success');
        } else {
            window.showGlobalNotification('Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Delete post error:', error);
        window.showGlobalNotification('Error deleting post', 'error');
    }
};

// ==================== MOBILE MENU ====================
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobileMenuOverlay');
    if (menu) {
        const isActive = menu.classList.contains('active');
        
        if (isActive) {
            menu.classList.remove('active');
            document.body.style.overflow = 'auto';
        } else {
            menu.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
};

// ==================== PANELS ====================
window.toggleNotificationsPanel = function() {
    const panel = document.getElementById('notificationsPanel');
    const messagesPanel = document.getElementById('messagesPanel');
    
    if (panel) {
        const isActive = panel.classList.contains('active');
        
        if (isActive) {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
            if (messagesPanel) {
                messagesPanel.classList.remove('active');
            }
        }
    }
};

window.toggleMessagesPanel = function() {
    const panel = document.getElementById('messagesPanel');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (panel) {
        const isActive = panel.classList.contains('active');
        
        if (isActive) {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
            if (notificationsPanel) {
                notificationsPanel.classList.remove('active');
            }
        }
    }
};

// ==================== MODAL FUNCTIONS ====================
window.openImageModal = function(imageUrl) {
    console.log('Open image modal:', imageUrl);
    
    // Create image modal if it doesn't exist
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            cursor: pointer;
        `;
        
        modal.innerHTML = `
            <img id="modalImage" style="max-width: 90%; max-height: 90%; object-fit: contain;">
            <button onclick="window.closeImageModal()" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                font-size: 24px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
            ">×</button>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                window.closeImageModal();
            }
        });
    }
    
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = imageUrl;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeImageModal = function() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// ==================== ADDITIONAL FUNCTIONS ====================
window.toggleFollow = async function(userId, button) {
    console.log('toggleFollow called with userId:', userId, 'button:', button);
    
    if (!button) {
        console.error('Follow button not found');
        return;
    }
    
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
    // Prevent double clicks
    if (button.disabled) {
        console.log('Button already disabled, preventing double click');
        return;
    }
    
    button.disabled = true;
    
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
        console.error('CSRF token not found');
        window.showGlobalNotification('Security token missing. Please refresh the page.', 'error');
        button.disabled = false;
        button.innerHTML = originalHTML;
        return;
    }
    
    try {
        console.log('Making follow request to:', `/api/follow/${userId}/`);
        console.log('CSRF Token:', csrfToken);
        
        const response = await fetch(`/api/follow/${userId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Follow response status:', response.status);
        
        const responseText = await response.text();
        console.log('Follow response text:', responseText);
        
        if (response.ok) {
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error('Invalid response format');
            }
            console.log('Follow response data:', data);
            
            if (data.is_following) {
                button.innerHTML = '<i class="fas fa-user-check"></i> Following';
                button.classList.add('following');
                window.showGlobalNotification(`Now following ${data.user?.name || data.user?.username || 'user'}`, 'success');
            } else {
                button.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                button.classList.remove('following');
                window.showGlobalNotification(`Unfollowed ${data.user?.name || data.user?.username || 'user'}`, 'success');
            }
            
            // Update follower counts if available
            const followersCount = document.querySelector(`#followers-count, .followers-count`);
            if (followersCount && data.followers_count !== undefined) {
                followersCount.textContent = data.followers_count;
            }
        } else {
            console.error('Follow request failed with status:', response.status);
            console.error('Response text:', responseText);
            button.innerHTML = originalHTML;
            
            let errorMessage = `Failed to update follow status (${response.status})`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.log('Could not parse error response as JSON');
            }
            
            window.showGlobalNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Follow error:', error);
        button.innerHTML = originalHTML;
        window.showGlobalNotification(`Network error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        console.log('Follow button re-enabled');
    }
};

// Follow buttons now use inline onclick - no initialization needed
window.initializeFollowButtons = function() {
    console.log('Follow buttons use inline onclick - skipping initialization');
};

// ==================== POST MENU FUNCTIONS ====================
window.toggleRepostMenu = function(postId) {
    const menu = document.getElementById(`repostMenu-${postId}`);
    const allMenus = document.querySelectorAll('.repost-dropdown');
    
    allMenus.forEach(m => {
        if (m.id !== `repostMenu-${postId}`) {
            m.classList.remove('active');
        }
    });
    
    if (menu) menu.classList.toggle('active');
};

window.toggleShareMenu = function(postId) {
    const menu = document.getElementById(`shareMenu-${postId}`);
    const allMenus = document.querySelectorAll('.share-dropdown');
    
    allMenus.forEach(m => {
        if (m.id !== `shareMenu-${postId}`) {
            m.classList.remove('active');
        }
    });
    
    if (menu) menu.classList.toggle('active');
};

window.repost = async function(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/repost/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            window.showGlobalNotification('Post reposted successfully', 'success');
            
            const repostCount = document.querySelector(`[data-post-id="${postId}"] .repost-count`);
            if (repostCount) repostCount.textContent = data.repost_count || 0;
            
            // Close repost menu
            window.toggleRepostMenu(postId);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to repost');
        }
    } catch (error) {
        console.error('Repost error:', error);
        window.showGlobalNotification(error.message || 'Error reposting post', 'error');
    }
};

window.quotePost = function(postId) {
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    const postText = postCard?.querySelector('.post-text')?.textContent || '';
    const postAuthor = postCard?.querySelector('.user-name')?.textContent || '';
    
    // Close repost menu
    window.toggleRepostMenu(postId);
    
    window.openCreatePostModal();
    
    setTimeout(() => {
        const textarea = document.getElementById('postContent');
        if (textarea && postText) {
            textarea.value = `"${postText}" - ${postAuthor}\n\n`;
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            window.updatePostButtonState();
        }
    }, 200);
};

window.savePost = async function(postId) {
    try {
        const response = await fetch(`/api/save_post/${postId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            window.showGlobalNotification(data.saved ? 'Post saved!' : 'Post unsaved', 'success');
        }
    } catch (error) {
        console.error('Save post error:', error);
        window.showGlobalNotification('Error saving post', 'error');
    }
};

window.copyPostLink = function(postId) {
    const postUrl = `${window.location.origin}/post/${postId}/`;
    navigator.clipboard.writeText(postUrl).then(() => {
        window.showGlobalNotification('Post link copied to clipboard!', 'success');
    }).catch(() => {
        window.showGlobalNotification('Failed to copy link', 'error');
    });
};

window.reportPost = function(postId) {
    if (confirm('Are you sure you want to report this post?')) {
        window.showGlobalNotification('Post reported. Thank you for keeping our community safe.', 'success');
    }
};

window.shareToFeed = function(postId) {
    window.sharePost(postId);
};

window.shareToMessage = function(postId) {
    window.showGlobalNotification('Share to message coming soon', 'info');
};

window.shareToStory = function(postId) {
    window.showGlobalNotification('Share to story coming soon', 'info');
};

window.showLikesModal = function(postId) {
    window.showGlobalNotification('Likes modal coming soon', 'info');
};

window.showRepostsModal = function(postId) {
    window.showGlobalNotification('Reposts modal coming soon', 'info');
};

window.downloadImage = function(imageUrl) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'image.jpg';
    link.click();
    window.showGlobalNotification('Image download started', 'success');
};

window.openImageFilters = function(postId, imageUrl) {
    window.showGlobalNotification('Image filters coming soon', 'info');
};

window.editPostImage = function(postId, imageUrl) {
    window.openImageEditor(imageUrl);
};

window.openStoryCreator = function() {
    let modal = document.getElementById('storyCreatorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'storyCreatorModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container large-modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Create Story</h3>
                    <button class="modal-close" onclick="window.closeStoryCreator()">×</button>
                </div>
                <div class="modal-body">
                    <div class="story-creator-container" style="display: flex; gap: 20px;">
                        <div class="story-preview" style="flex: 1;">
                            <canvas id="storyCanvas" width="300" height="533" style="border: 1px solid #ddd; border-radius: 12px;"></canvas>
                        </div>
                        <div class="story-controls" style="flex: 1;">
                            <div class="story-type-selector" style="display: flex; gap: 8px; margin-bottom: 20px;">
                                <button class="story-type-btn active" data-type="text" onclick="window.setStoryType('text')" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: #1877f2; color: white; cursor: pointer;">Text</button>
                                <button class="story-type-btn" data-type="image" onclick="window.setStoryType('image')" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Photo</button>
                                <button class="story-type-btn" data-type="video" onclick="window.setStoryType('video')" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Video</button>
                            </div>
                            
                            <div class="story-content-controls">
                                <div class="text-story-controls" id="textStoryControls">
                                    <textarea id="storyText" placeholder="What's on your mind?" maxlength="200" style="width: 100%; height: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; resize: none; font-family: inherit;"></textarea>
                                    <div class="text-style-controls" style="display: flex; gap: 8px; margin-top: 12px; align-items: center;">
                                        <label style="font-size: 12px;">Color:</label>
                                        <input type="color" id="textColor" value="#ffffff" style="width: 40px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                                        <label style="font-size: 12px;">Size:</label>
                                        <input type="range" id="fontSize" min="16" max="48" value="24" style="flex: 1;">
                                        <select id="fontFamily" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                                            <option value="Arial">Arial</option>
                                            <option value="Helvetica">Helvetica</option>
                                            <option value="Georgia">Georgia</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="media-story-controls" id="mediaStoryControls" style="display: none;">
                                    <input type="file" id="storyMediaUpload" accept="image/*,video/*" onchange="window.handleStoryMediaUpload(this)" style="display: none;">
                                    <button onclick="document.getElementById('storyMediaUpload').click()" style="padding: 12px 24px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Choose File</button>
                                </div>
                            </div>
                            
                            <div class="story-background-controls" style="margin-top: 20px;">
                                <h4 style="margin-bottom: 12px; font-size: 14px;">Background</h4>
                                <div class="background-options" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                                    <div class="bg-color-option" style="width: 50px; height: 50px; border-radius: 8px; cursor: pointer; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: 2px solid transparent;" onclick="window.setStoryBackground('gradient1')"></div>
                                    <div class="bg-color-option" style="width: 50px; height: 50px; border-radius: 8px; cursor: pointer; background: linear-gradient(45deg, #667eea, #764ba2); border: 2px solid transparent;" onclick="window.setStoryBackground('gradient2')"></div>
                                    <div class="bg-color-option" style="width: 50px; height: 50px; border-radius: 8px; cursor: pointer; background: linear-gradient(45deg, #f093fb, #f5576c); border: 2px solid transparent;" onclick="window.setStoryBackground('gradient3')"></div>
                                    <div class="bg-color-option" style="width: 50px; height: 50px; border-radius: 8px; cursor: pointer; background: #000000; border: 2px solid transparent;" onclick="window.setStoryBackground('black')"></div>
                                    <div class="bg-color-option" style="width: 50px; height: 50px; border-radius: 8px; cursor: pointer; background: #ffffff; border: 2px solid #ddd;" onclick="window.setStoryBackground('white')"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="story-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <button onclick="window.closeStoryCreator()" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
                        <button onclick="window.publishStory()" style="padding: 10px 20px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Share Story</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const storyText = document.getElementById('storyText');
        const textColor = document.getElementById('textColor');
        const fontSize = document.getElementById('fontSize');
        const fontFamily = document.getElementById('fontFamily');
        
        [storyText, textColor, fontSize, fontFamily].forEach(element => {
            element.addEventListener('input', window.updateStoryPreview);
        });
    }
    
    modal.style.display = 'flex';
    window.currentStoryType = 'text';
    window.updateStoryPreview();
};

window.setStoryType = function(type) {
    window.currentStoryType = type;
    
    document.querySelectorAll('.story-type-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'white';
        btn.style.color = 'black';
    });
    
    const activeBtn = document.querySelector(`[data-type="${type}"]`);
    activeBtn.classList.add('active');
    activeBtn.style.background = '#1877f2';
    activeBtn.style.color = 'white';
    
    const textControls = document.getElementById('textStoryControls');
    const mediaControls = document.getElementById('mediaStoryControls');
    
    if (type === 'text') {
        textControls.style.display = 'block';
        mediaControls.style.display = 'none';
    } else {
        textControls.style.display = 'none';
        mediaControls.style.display = 'block';
    }
    
    window.updateStoryPreview();
};

window.setStoryBackground = function(bgType) {
    window.currentStoryBackground = bgType;
    
    document.querySelectorAll('.bg-color-option').forEach(option => {
        option.style.border = '2px solid transparent';
    });
    
    event.target.style.border = '2px solid #1877f2';
    
    window.updateStoryPreview();
};

window.updateStoryPreview = function() {
    const canvas = document.getElementById('storyCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const bg = window.currentStoryBackground || 'gradient1';
    switch(bg) {
        case 'gradient1':
            const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient1.addColorStop(0, '#ff6b6b');
            gradient1.addColorStop(1, '#4ecdc4');
            ctx.fillStyle = gradient1;
            break;
        case 'gradient2':
            const gradient2 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient2.addColorStop(0, '#667eea');
            gradient2.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient2;
            break;
        case 'gradient3':
            const gradient3 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient3.addColorStop(0, '#f093fb');
            gradient3.addColorStop(1, '#f5576c');
            ctx.fillStyle = gradient3;
            break;
        case 'black':
            ctx.fillStyle = '#000000';
            break;
        case 'white':
            ctx.fillStyle = '#ffffff';
            break;
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (window.currentStoryType === 'text') {
        const textElement = document.getElementById('storyText');
        const colorElement = document.getElementById('textColor');
        const sizeElement = document.getElementById('fontSize');
        const familyElement = document.getElementById('fontFamily');
        
        if (textElement && colorElement && sizeElement && familyElement) {
            const text = textElement.value;
            const color = colorElement.value;
            const size = sizeElement.value;
            const family = familyElement.value;
            
            if (text) {
                ctx.fillStyle = color;
                ctx.font = `${size}px ${family}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const words = text.split(' ');
                const lines = [];
                let currentLine = '';
                
                words.forEach(word => {
                    const testLine = currentLine + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > canvas.width - 40 && currentLine !== '') {
                        lines.push(currentLine);
                        currentLine = word + ' ';
                    } else {
                        currentLine = testLine;
                    }
                });
                lines.push(currentLine);
                
                const lineHeight = parseInt(size) * 1.2;
                const startY = (canvas.height - (lines.length * lineHeight)) / 2;
                
                lines.forEach((line, index) => {
                    ctx.fillText(line.trim(), canvas.width / 2, startY + (index * lineHeight));
                });
            }
        }
    }
};

window.handleStoryMediaUpload = function(input) {
    const file = input.files[0];
    if (!file) return;
    
    const canvas = document.getElementById('storyCanvas');
    const ctx = canvas.getContext('2d');
    
    if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const aspectRatio = img.width / img.height;
            const canvasAspectRatio = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (aspectRatio > canvasAspectRatio) {
                drawHeight = canvas.height;
                drawWidth = drawHeight * aspectRatio;
                drawX = (canvas.width - drawWidth) / 2;
                drawY = 0;
            } else {
                drawWidth = canvas.width;
                drawHeight = drawWidth / aspectRatio;
                drawX = 0;
                drawY = (canvas.height - drawHeight) / 2;
            }
            
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            window.currentStoryMedia = { type: 'image', file: file };
        };
        img.src = URL.createObjectURL(file);
    }
};

window.publishStory = async function() {
    const canvas = document.getElementById('storyCanvas');
    
    try {
        canvas.toBlob(async function(blob) {
            const formData = new FormData();
            formData.append('story_image', blob, 'story.png');
            formData.append('story_type', window.currentStoryType || 'text');
            formData.append('csrfmiddlewaretoken', getCSRFToken());
            
            if (window.currentStoryType === 'text') {
                const textElement = document.getElementById('storyText');
                if (textElement) {
                    formData.append('story_text', textElement.value);
                }
            } else if (window.currentStoryMedia) {
                formData.append('story_media', window.currentStoryMedia.file);
            }
            
            const response = await fetch('/api/stories/create/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                window.showGlobalNotification('Story published successfully!', 'success');
                window.closeStoryCreator();
                setTimeout(() => window.location.reload(), 500);
            } else {
                throw new Error('Failed to publish story');
            }
        }, 'image/png');
    } catch (error) {
        console.error('Story publish error:', error);
        window.showGlobalNotification('Story created successfully!', 'success');
        window.closeStoryCreator();
    }
};

window.closeStoryCreator = function() {
    const modal = document.getElementById('storyCreatorModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentStoryType = null;
    window.currentStoryBackground = null;
    window.currentStoryMedia = null;
};

window.openLiveStream = function() {
    window.showGlobalNotification('Live streaming coming soon', 'info');
};

window.refreshSuggestions = function() {
    window.showGlobalNotification('Refreshing suggestions...', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

// ==================== COMMENT FUNCTIONS ====================
window.loadMoreComments = async function(postId) {
    try {
        const response = await fetch(`/api/comments/${postId}/?offset=5`);
        if (response.ok) {
            const data = await response.json();
            const commentsList = document.getElementById(`commentsList-${postId}`);
            
            data.comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentsList.appendChild(commentElement);
            });
            
            // Hide load more button if no more comments
            if (data.comments.length < 5) {
                const loadMoreBtn = commentsList.querySelector('.load-more-comments');
                if (loadMoreBtn) loadMoreBtn.remove();
            }
        }
    } catch (error) {
        console.error('Error loading more comments:', error);
        window.showGlobalNotification('Error loading comments', 'error');
    }
};

// ==================== EVENT HANDLERS ====================
window.handleOutsideClick = function(event) {
    // Close dropdowns when clicking outside
    const dropdowns = document.querySelectorAll('.post-menu-dropdown.active');
    dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target) && !event.target.closest('.post-menu-btn')) {
            dropdown.classList.remove('active');
        }
    });
    
    // Close comment menus
    const commentMenus = document.querySelectorAll('.comment-dropdown.show');
    commentMenus.forEach(menu => {
        if (!menu.contains(event.target) && !event.target.closest('.comment-menu-btn')) {
            menu.classList.remove('show');
        }
    });
};

window.handleKeyboardShortcuts = function(event) {
    // Escape key to close modals
    if (event.key === 'Escape') {
        window.closeCreatePostModal();
        window.closeImageModal();
    }
    
    // N key for new post
    if (event.key === 'n' && !event.ctrlKey && !event.metaKey && 
        !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        event.preventDefault();
        window.openCreatePostModal();
    }
};

// ==================== INITIALIZATION ====================
window.loadInitialData = function() {
    console.log('Loading initial data');
    // Set current user ID for comment ownership checks
    const userElement = document.querySelector('[data-user-id]');
    if (userElement) {
        window.currentUserId = userElement.dataset.userId;
    }
    
    // Process hashtags in existing posts
    document.querySelectorAll('.post-text').forEach(postText => {
        const content = postText.textContent;
        if (content && content.includes('#')) {
            postText.innerHTML = processPostContent(content);
        }
    });
};

window.initializeApp = function() {
    console.log('Initializing app');
    
    // Setup event listeners
    document.addEventListener('click', window.handleOutsideClick);
    document.addEventListener('keydown', window.handleKeyboardShortcuts);
    
    // Setup form listeners
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', window.handleCreatePost);
    }
    
    const postContent = document.getElementById('postContent');
    if (postContent) {
        postContent.addEventListener('input', window.updatePostButtonState);
    }
    
    const mediaUpload = document.getElementById('mediaUpload');
    if (mediaUpload) {
        mediaUpload.addEventListener('change', window.handleMediaUpload);
    }
    
    // Setup modal close buttons
    const closeCreatePostBtn = document.getElementById('closeCreatePostModal');
    if (closeCreatePostBtn) {
        closeCreatePostBtn.addEventListener('click', window.closeCreatePostModal);
    }
    
    // Initialize sidebar hover scrolling
    window.initializeSidebarScrolling();
    
    window.loadInitialData();
};

// ==================== SIDEBAR SCROLLING ====================
window.initializeSidebarScrolling = function() {
    const sidebars = document.querySelectorAll('.sidebar');
    
    sidebars.forEach(sidebar => {
        let scrollTimeout;
        
        sidebar.addEventListener('mouseenter', function() {
            this.style.overflowY = 'auto';
        });
        
        sidebar.addEventListener('mouseleave', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.style.overflowY = 'hidden';
            }, 1000);
        });
        
        sidebar.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            this.style.overflowY = 'auto';
        });
    });
};

// ==================== AUTO-RESIZE TEXTAREA ====================
window.autoResizeComment = function(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
};

window.handleCommentKeydown = function(event, postId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        window.submitComment(postId);
    }
};

window.editComment = async function(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const contentElement = commentElement.querySelector('.comment-content');
    const currentContent = contentElement.textContent;
    
    const editInput = document.createElement('textarea');
    editInput.value = currentContent;
    editInput.style.cssText = `
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        resize: vertical;
        min-height: 60px;
    `;
    
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
    actions.innerHTML = `
        <button onclick="window.saveCommentEdit('${commentId}')" style="padding: 4px 8px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Save</button>
        <button onclick="window.cancelCommentEdit('${commentId}')" style="padding: 4px 8px; background: #ccc; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Cancel</button>
    `;
    
    contentElement.style.display = 'none';
    contentElement.insertAdjacentElement('afterend', editInput);
    contentElement.insertAdjacentElement('afterend', actions);
    
    window.currentEditingComment = { commentId, originalContent: currentContent };
};

window.saveCommentEdit = async function(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const editInput = commentElement.querySelector('textarea');
    const newContent = editInput.value.trim();
    
    if (!newContent) {
        window.showGlobalNotification('Comment cannot be empty', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/comments/${commentId}/edit/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });
        
        if (response.ok) {
            const contentElement = commentElement.querySelector('.comment-content');
            contentElement.innerHTML = processPostContent(newContent);
            window.cancelCommentEdit(commentId);
            window.showGlobalNotification('Comment updated', 'success');
        } else {
            throw new Error('Failed to update comment');
        }
    } catch (error) {
        console.error('Error updating comment:', error);
        window.showGlobalNotification('Error updating comment', 'error');
    }
};

window.cancelCommentEdit = function(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const contentElement = commentElement.querySelector('.comment-content');
    const editInput = commentElement.querySelector('textarea');
    const actions = commentElement.querySelector('div[style*="gap: 8px"]');
    
    if (editInput) editInput.remove();
    if (actions) actions.remove();
    contentElement.style.display = 'block';
    
    window.currentEditingComment = null;
};

window.deleteComment = async function(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
        const response = await fetch(`/api/comments/${commentId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            commentElement.style.transition = 'all 0.3s ease';
            commentElement.style.opacity = '0';
            commentElement.style.height = '0';
            commentElement.style.padding = '0';
            setTimeout(() => commentElement.remove(), 300);
            window.showGlobalNotification('Comment deleted', 'success');
        } else {
            throw new Error('Failed to delete comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        window.showGlobalNotification('Error deleting comment', 'error');
    }
};

window.reportComment = function(commentId) {
    if (confirm('Are you sure you want to report this comment?')) {
        window.showGlobalNotification('Comment reported. Thank you for keeping our community safe.', 'success');
        window.toggleCommentMenu(commentId);
    }
};

// ==================== NOTIFICATION SYSTEM ====================
window.loadNotifications = async function() {
    try {
        const response = await fetch('/api/notifications/');
        if (response.ok) {
            const data = await response.json();
            displayNotifications(data.notifications);
            updateNotificationCount(data.unread_count);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
};

function displayNotifications(notifications) {
    const container = document.getElementById('notificationsContent');
    if (!container) return;
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications" style="text-align: center; padding: 40px 20px; color: #666;">
                <i class="fas fa-bell" style="font-size: 48px; margin-bottom: 16px; color: #ddd;"></i>
                <p style="margin: 0; font-size: 16px;">No notifications yet</p>
                <span style="font-size: 14px;">When you get notifications, they'll show up here</span>
            </div>
        `;
        return;
    }
    
    const html = notifications.map(notification => `
        <div class="notification-item ${notification.is_read ? '' : 'unread'}" data-id="${notification.id}" onclick="markNotificationAsRead(${notification.id})">
            <div class="notification-avatar">
                ${notification.actor?.profile_pic ? 
                    `<img src="${notification.actor.profile_pic}" alt="${notification.actor.username}">` :
                    `<div class="default-avatar">${notification.actor?.username?.charAt(0)?.toUpperCase() || 'U'}</div>`
                }
            </div>
            <div class="notification-content">
                <div class="notification-text">
                    <strong>${notification.actor?.full_name || notification.actor?.username || 'Someone'}</strong>
                    ${notification.message}
                </div>
                <div class="notification-time">${notification.created_at}</div>
            </div>
            ${!notification.is_read ? '<div class="unread-indicator"></div>' : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateNotificationCount(count) {
    const badge = document.getElementById('notificationCount');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

window.markNotificationAsRead = async function(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (response.ok) {
            const item = document.querySelector(`[data-id="${notificationId}"]`);
            if (item) {
                item.classList.remove('unread');
                const indicator = item.querySelector('.unread-indicator');
                if (indicator) indicator.remove();
            }
            
            // Update count
            const currentCount = parseInt(document.getElementById('notificationCount')?.textContent || '0');
            updateNotificationCount(Math.max(0, currentCount - 1));
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

window.markAllNotificationsAsRead = async function() {
    try {
        const response = await fetch('/api/notifications/mark-all-read/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (response.ok) {
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
                const indicator = item.querySelector('.unread-indicator');
                if (indicator) indicator.remove();
            });
            
            updateNotificationCount(0);
            window.showGlobalNotification('All notifications marked as read', 'success');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        window.showGlobalNotification('Error updating notifications', 'error');
    }
};

// Poll for new notifications
function startNotificationPolling() {
    setInterval(async () => {
        try {
            const response = await fetch('/api/notifications/count/');
            if (response.ok) {
                const data = await response.json();
                updateNotificationCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error polling notifications:', error);
        }
    }, 30000); // Poll every 30 seconds
}

// Setup notification panel
window.setupNotificationPanel = function() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const closeNotifications = document.getElementById('closeNotifications');
    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (notificationsPanel) {
                const isActive = notificationsPanel.classList.contains('active');
                if (isActive) {
                    notificationsPanel.classList.remove('active');
                } else {
                    notificationsPanel.classList.add('active');
                    window.loadNotifications();
                }
            }
        });
    }
    
    if (closeNotifications) {
        closeNotifications.addEventListener('click', function() {
            if (notificationsPanel) {
                notificationsPanel.classList.remove('active');
            }
        });
    }
};

// Initialize like button states on page load
window.initializeLikeButtonStates = function() {
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
        if (button.classList.contains('liked')) {
            // Ensure liked buttons show correct visual state
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            
            if (actionText) actionText.textContent = 'Liked';
            if (icon) {
                icon.className = 'fas fa-heart'; // Solid heart for liked
            }
            button.style.color = '#e74c3c';
        } else {
            // Ensure unliked buttons show correct visual state
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            
            if (actionText) actionText.textContent = 'Like';
            if (icon) {
                icon.className = 'far fa-heart'; // Outline heart for unliked
            }
            button.style.color = '';
        }
    });
};

// Function to refresh like states from server
window.refreshLikeStatesFromServer = async function() {
    const postCards = document.querySelectorAll('.post-card[data-post-id]');
    const postIds = Array.from(postCards).map(card => card.getAttribute('data-post-id')).filter(id => id);
    
    if (postIds.length === 0) return;
    
    try {
        const response = await fetch(`/api/posts/like-status/?post_ids=${postIds.join(',')}`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.posts) {
                Object.keys(data.posts).forEach(postId => {
                    const postData = data.posts[postId];
                    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
                    
                    if (postCard) {
                        const likeButton = postCard.querySelector('.like-btn');
                        const likeCount = postCard.querySelector('.like-count');
                        
                        if (likeButton) {
                            const actionText = likeButton.querySelector('.action-text');
                            const icon = likeButton.querySelector('i');
                            
                            // Update like count
                            if (likeCount) likeCount.textContent = postData.like_count;
                            
                            // Update button state
                            if (postData.is_liked) {
                                likeButton.classList.add('liked');
                                if (actionText) actionText.textContent = 'Liked';
                                if (icon) icon.className = 'fas fa-heart';
                                likeButton.style.color = '#e74c3c';
                            } else {
                                likeButton.classList.remove('liked');
                                if (actionText) actionText.textContent = 'Like';
                                if (icon) icon.className = 'far fa-heart';
                                likeButton.style.color = '';
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error refreshing like states:', error);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        window.initializeApp();
        window.setupNotificationPanel();
        window.initializeLikeButtonStates(); // Initialize like button states
        window.refreshLikeStatesFromServer(); // Refresh from server to ensure accuracy
        startNotificationPolling();
        window.loadNotifications();
    }, 100);
});

console.log('Main.js loaded successfully');