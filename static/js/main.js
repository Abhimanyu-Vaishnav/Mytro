// ==================== MYTRO SOCIAL NETWORK - MAIN.JS ====================
// Complete Working Version - All Features Tested
console.log('🚀 Mytro Main.js Loading...');

// ==================== GLOBAL VARIABLES ====================
window.currentPage = 1;
window.isLoading = false;
window.currentUserId = null;
window.uploadedFiles = [];
window.currentLocation = null;
window.currentPostType = 'text';
window.currentEditingImage = null;
window.originalImageData = null;
window.editPostData = {};
window.currentEditingComment = null;

// ==================== CORE UTILITY FUNCTIONS ====================
function getCSRFToken() {
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
    if (!text) return '';
    return text.replace(/#([a-zA-Z0-9_]+)/g, '<a href="/hashtag/$1/" class="hashtag">#$1</a>');
}

function processPostContent(content) {
    if (!content) return '';
    let processedContent = processHashtags(content);
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

// ==================== CREATE POST SYSTEM ====================
window.openCreatePostModal = function(type = 'text') {
    console.log('Opening modern post modal with type:', type);
    
    if (typeof openModernPostModal === 'function') {
        openModernPostModal();
        
        // Handle poll type
        if (type === 'poll') {
            setTimeout(() => {
                const addPollBtn = document.getElementById('addPollBtn');
                if (addPollBtn) {
                    addPollBtn.click();
                }
            }, 100);
        }
    } else {
        // Fallback to old modal if modern not available
        console.log('Modern modal not available, using fallback');
        const modal = document.getElementById('createPostModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
};

function showPollSection() {
    let pollSection = document.getElementById('pollSection');
    if (!pollSection) {
        const modalBody = document.querySelector('.modal-body');
        pollSection = document.createElement('div');
        pollSection.id = 'pollSection';
        pollSection.innerHTML = `
            <div class="poll-creator" style="margin: 16px 0; padding: 16px; border: 1px solid #e1e5e9; border-radius: 8px;">
                <h4 style="margin: 0 0 12px 0; color: #333;">Create a Poll</h4>
                <div class="poll-options" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                    <input type="text" class="poll-option" placeholder="Option 1" maxlength="100" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;">
                    <input type="text" class="poll-option" placeholder="Option 2" maxlength="100" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <button type="button" class="add-poll-option" onclick="addPollOption()" style="padding: 8px 16px; background: #f8f9fa; border: 1px dashed #ddd; border-radius: 6px; cursor: pointer; margin-bottom: 12px;">
                    + Add Option
                </button>
                <div class="poll-settings" style="display: flex; flex-direction: column; gap: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="allowMultipleChoice">
                        Allow multiple choices
                    </label>
                    <div class="poll-duration" style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-weight: 500;">Poll duration:</label>
                        <select id="pollDuration" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7" selected>1 week</option>
                            <option value="30">1 month</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        const postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.insertAdjacentElement('afterend', pollSection);
        }
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
        newOption.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;';
        
        pollOptions.appendChild(newOption);
    }
};

window.closeCreatePostModal = function() {
    if (typeof closeModernPostModal === 'function') {
        closeModernPostModal();
    } else {
        const modal = document.getElementById('createPostModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
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
    window.uploadedFiles = [];
    window.currentLocation = null;
}

window.updatePostButtonState = function() {
    const postContent = document.getElementById('postContent');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (postSubmitBtn) {
        const hasContent = postContent && postContent.value.trim().length > 0;
        const hasMedia = mediaPreview && mediaPreview.children.length > 0;
        const isPoll = window.currentPostType === 'poll';
        
        if (isPoll) {
            const pollOptions = document.querySelectorAll('.poll-option');
            const validOptions = Array.from(pollOptions).filter(option => option.value.trim()).length;
            postSubmitBtn.disabled = !(hasContent || hasMedia || validOptions >= 2);
        } else {
            postSubmitBtn.disabled = !(hasContent || hasMedia);
        }
    }
};

window.handleMediaUpload = function(event) {
    const files = event.target.files;
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (!mediaPreview || !files.length) return;
    
    if (!window.uploadedFiles) window.uploadedFiles = [];
    
    for (let file of files) {
        if (file.size > 10 * 1024 * 1024) {
            window.showGlobalNotification('File size too large. Maximum 10MB allowed.', 'error');
            continue;
        }
        
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
        
        if (window.uploadedFiles && fileName) {
            window.uploadedFiles = window.uploadedFiles.filter(file => file.name !== fileName);
        }
        
        mediaItem.remove();
        window.updatePostButtonState();
    }
};

// ==================== LOCATION SYSTEM ====================
window.addLocation = function() {
    if (navigator.geolocation) {
        window.showGlobalNotification('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
                    .then(response => response.json())
                    .then(data => {
                        const location = data.city || data.locality || 'Unknown Location';
                        window.currentLocation = {
                            lat: lat,
                            lng: lng,
                            address: location
                        };
                        
                        const locationDisplay = document.getElementById('locationDisplay');
                        if (locationDisplay) {
                            locationDisplay.innerHTML = `
                                <div class="location-item" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin: 8px 0;">
                                    <i class="fas fa-map-marker-alt" style="color: #ff6b35;"></i>
                                    <span style="flex: 1;">${location}</span>
                                    <button onclick="window.removeLocation()" class="remove-location" style="background: none; border: none; color: #666; cursor: pointer; padding: 4px;">×</button>
                                </div>
                            `;
                            locationDisplay.style.display = 'block';
                        }
                        
                        window.showGlobalNotification('Location added successfully', 'success');
                    })
                    .catch(() => {
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
                <div class="location-item" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin: 8px 0;">
                    <i class="fas fa-map-marker-alt" style="color: #ff6b35;"></i>
                    <span style="flex: 1;">${locationInput.trim()}</span>
                    <button onclick="window.removeLocation()" class="remove-location" style="background: none; border: none; color: #666; cursor: pointer; padding: 4px;">×</button>
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
    let modal = document.getElementById('imageEditorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageEditorModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 20px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Edit Image</h3>
                    <button onclick="window.closeImageEditor()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
                    <div>
                        <canvas id="imageCanvas" width="600" height="400" style="border: 1px solid #ddd; border-radius: 8px; max-width: 100%;"></canvas>
                    </div>
                    <div>
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin-bottom: 12px;">Filters</h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <button class="filter-btn active" data-filter="none" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Original</button>
                                <button class="filter-btn" data-filter="grayscale" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">B&W</button>
                                <button class="filter-btn" data-filter="sepia" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Sepia</button>
                                <button class="filter-btn" data-filter="blur" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Blur</button>
                            </div>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 12px;">Adjustments</h4>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div>
                                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">Brightness</label>
                                    <input type="range" id="brightnessSlider" min="-50" max="50" value="0" style="width: 100%;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">Contrast</label>
                                    <input type="range" id="contrastSlider" min="-50" max="50" value="0" style="width: 100%;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 4px; font-size: 14px;">Saturation</label>
                                    <input type="range" id="saturationSlider" min="-50" max="50" value="0" style="width: 100%;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                    <button onclick="window.resetImageEditor()" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">Reset</button>
                    <button onclick="window.closeImageEditor()" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button onclick="window.applyImageEdit()" style="padding: 8px 16px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer;">Apply</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
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
    
    document.getElementById('brightnessSlider').value = 0;
    document.getElementById('contrastSlider').value = 0;
    document.getElementById('saturationSlider').value = 0;
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
};

window.applyImageEdit = function() {
    const canvas = document.getElementById('imageCanvas');
    
    canvas.toBlob(function(blob) {
        if (window.currentEditingImage && window.uploadedFiles) {
            const fileName = window.currentEditingImage.fileName;
            const fileIndex = window.uploadedFiles.findIndex(f => f.name === fileName);
            
            if (fileIndex !== -1) {
                const editedFile = new File([blob], fileName, { type: 'image/png' });
                window.uploadedFiles[fileIndex] = editedFile;
                
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

// ==================== POST CREATION ====================
window.handleCreatePost = async function(event) {
    if (event) event.preventDefault();
    console.log('Creating post...');
    
    const modernModal = document.getElementById('createPostModal');
    const isModernModal = modernModal && modernModal.style.display === 'flex';


     if (isModernModal) {
        await handleModernPostSubmit(event);
        return;
    }
    

    const postContent = document.getElementById('postContent');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const btnText = postSubmitBtn?.querySelector('.btn-text');
    const mediaPreview = document.getElementById('mediaPreview');

    if (!postContent || !postSubmitBtn) {
        console.error('Required elements not found');
        window.showGlobalNotification('Post creation elements not found. Please refresh the page.', 'error');
        return;
    }

    const content = postContent.value.trim();
    const hasMedia = mediaPreview && mediaPreview.children.length > 0;
    const isPoll = window.currentPostType === 'poll';
    
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
    
    postSubmitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Posting...';
    
    try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('post_type', window.currentPostType || 'text');
        formData.append('csrfmiddlewaretoken', getCSRFToken());
        
        if (isPoll) {
            const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
                .map(option => option.value.trim())
                .filter(option => option);
            
            formData.append('poll_options', JSON.stringify(pollOptions));
            formData.append('poll_multiple_choice', document.getElementById('allowMultipleChoice')?.checked || false);
            formData.append('poll_duration', document.getElementById('pollDuration')?.value || 7);
        }
        
        if (window.currentLocation) {
            formData.append('location', JSON.stringify(window.currentLocation));
        }
        
        if (window.uploadedFiles && window.uploadedFiles.length > 0) {
            window.uploadedFiles.forEach((file, index) => {
                formData.append(`image`, file);
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
        
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error('Create post error:', error);
        window.showGlobalNotification(error.message || 'Something went wrong while creating post', 'error');
    } finally {
        postSubmitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Post';
        window.uploadedFiles = [];
        window.currentLocation = null;
        window.currentPostType = 'text';
        resetCreatePostForm();
    }
};


// ==================== MODERN POST SUBMISSION ====================
async function handleModernPostSubmit(e) {
    if (e) e.preventDefault();
    
    console.log('Handling modern post submission...');
    
    const submitBtn = document.getElementById('modernPostSubmitBtn');
    const loadingSpinner = submitBtn?.querySelector('.btn-loading');
    const btnText = submitBtn?.querySelector('.btn-text');
    
    if (!submitBtn) {
        console.error('Modern post submit button not found');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Posting...';
    if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
    
    try {
        const formData = new FormData();
        
        // Get content from Quill editor
        let content = '';
        if (window.quill) {
            content = window.quill.root.innerHTML;
        } else {
            // Fallback to textarea
            const postContent = document.getElementById('postContent');
            content = postContent ? postContent.value : '';
        }
        
        formData.append('content', content);
        formData.append('post_type', 'text');
        formData.append('privacy', document.getElementById('postPrivacy')?.value || 'public');
        formData.append('csrfmiddlewaretoken', getCSRFToken());
        
        // Add media files
        if (window.uploadedMedia && window.uploadedMedia.length > 0) {
            window.uploadedMedia.forEach((media, index) => {
                formData.append('image', media.file);
            });
        }
        
        // Check if poll is created
        const pollCreator = document.getElementById('pollCreator');
        if (pollCreator && pollCreator.style.display !== 'none') {
            const pollQuestion = document.getElementById('pollQuestion')?.value;
            const pollOptions = Array.from(document.querySelectorAll('.poll-option-input'))
                .map(input => input.value.trim())
                .filter(value => value !== '');
            
            if (pollQuestion && pollOptions.length >= 2) {
                formData.append('poll_question', pollQuestion);
                formData.append('poll_options', JSON.stringify(pollOptions));
                formData.append('poll_multiple_choice', document.getElementById('multipleChoice')?.checked || false);
                formData.append('poll_duration', document.getElementById('pollDuration')?.value || '7');
            }
        }
        
        console.log('Submitting post data...');
        
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
            console.log('Post created successfully:', data);
        } catch (e) {
            console.log('Post created successfully (non-JSON response)');
            data = { success: true };
        }
        
        window.showGlobalNotification('Post created successfully!', 'success');
        closeModernPostModal();
        
        // Reload page after short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Create post error:', error);
        window.showGlobalNotification(error.message || 'Something went wrong while creating post', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Post';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// ==================== MODERN POST MODAL FUNCTIONS ====================
function closeModernPostModal() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetModernPostForm();
    }
}

function resetModernPostForm() {
    // Reset Quill editor
    if (window.quill) {
        window.quill.setText('');
    }
    
    // Reset uploaded media
    window.uploadedMedia = [];
    const mediaPreview = document.getElementById('modernMediaPreview');
    if (mediaPreview) {
        mediaPreview.innerHTML = '';
    }
    
    // Reset poll
    const pollCreator = document.getElementById('pollCreator');
    if (pollCreator) {
        pollCreator.style.display = 'none';
    }
    
    // Reset character counter
    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = '0';
    }
}

// Make sure Quill is available globally
window.quill = null;


function insertModernEmoji(emoji) {
    console.log('Inserting emoji:', emoji);
    
    // Check if Quill editor is available
    if (window.quill) {
        try {
            const range = window.quill.getSelection();
            if (range) {
                window.quill.insertText(range.index, emoji);
                window.quill.setSelection(range.index + emoji.length);
            } else {
                // If no selection, insert at the end
                const length = window.quill.getLength();
                window.quill.insertText(length - 1, emoji);
                window.quill.setSelection(length + emoji.length - 1);
            }
        } catch (error) {
            console.error('Error inserting emoji in Quill:', error);
            // Fallback to simple textarea
            const postContent = document.getElementById('postContent');
            if (postContent) {
                postContent.value += emoji;
            }
        }
    } else {
        // Fallback for old modal
        const postContent = document.getElementById('postContent');
        if (postContent) {
            const start = postContent.selectionStart;
            const end = postContent.selectionEnd;
            postContent.value = postContent.value.substring(0, start) + emoji + postContent.value.substring(end);
            postContent.selectionStart = postContent.selectionEnd = start + emoji.length;
            postContent.focus();
        }
    }
    
    // Close emoji picker
    const emojiPickerModal = document.getElementById('modernEmojiPickerModal');
    if (emojiPickerModal) {
        emojiPickerModal.style.display = 'none';
    }
}


// ==================== POST INTERACTIONS ====================
// window.toggleLike = async function(postId, button) {
//     try {
//         console.log('Toggling like for post:', postId);
        
//         const csrfToken = getCSRFToken();
//         if (!csrfToken) return;

//         const response = await fetch(`/api/like_post/${postId}/`, {
//             method: 'POST',
//             headers: {
//                 'X-CSRFToken': csrfToken,  // ADD THIS LINE
//                 'Content-Type': 'application/json'
//             }
//         });


//         // const response = await fetch(`/api/like_post/${postId}/`, {
//         //     method: 'POST',
//         //     headers: {
//         //         'X-CSRFToken': getCSRFToken(),
//         //         'Content-Type': 'application/json'
//         //     }
//         // });

//         if (!response.ok) {
//             throw new Error(`Like failed: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Like response:', data);
        
//         const likeCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .like-count`);
//         likeCountElements.forEach(el => {
//             el.textContent = data.like_count || 0;
//         });

//         if (data.liked) {
//             button.classList.add('liked');
//             const actionText = button.querySelector('.action-text');
//             const icon = button.querySelector('i');
            
//             if (actionText) actionText.textContent = 'Liked';
//             if (icon) icon.className = 'fas fa-heart';
//             button.style.color = '#e74c3c';
//         } else {
//             button.classList.remove('liked');
//             const actionText = button.querySelector('.action-text');
//             const icon = button.querySelector('i');
            
//             if (actionText) actionText.textContent = 'Like';
//             if (icon) icon.className = 'far fa-heart';
//             button.style.color = '';
//         }

//         window.showGlobalNotification(data.liked ? 'Post liked!' : 'Like removed', 'success');

//     } catch (error) {
//         console.error('Like error:', error);
//         window.showGlobalNotification('Something went wrong while liking the post', 'error');
//     }
// };


window.toggleLike = async function(postId, button, event) {
    // ADD DOUBLE CLICK PROTECTION
     if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (button.disabled) return;
    button.disabled = true;
    
    try {
        console.log('Toggling like for post:', postId);
        
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            window.showGlobalNotification('Security token missing', 'error');
            return;
        }

        const response = await fetch(`/api/like_post/${postId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Like failed');

        const data = await response.json();
        console.log('Like response:', data);
        
        // Update like count
        const likeCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .like-count`);
        likeCountElements.forEach(el => {
            el.textContent = data.like_count || 0;
        });

        // Update button state
        if (data.liked) {
            button.classList.add('liked');
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            if (actionText) actionText.textContent = 'Liked';
            if (icon) icon.className = 'fas fa-heart';
        } else {
            button.classList.remove('liked');
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            if (actionText) actionText.textContent = 'Like';
            if (icon) icon.className = 'far fa-heart';
        }

        window.showGlobalNotification(data.liked ? 'Post liked!' : 'Like removed', 'success');

    } catch (error) {
        console.error('Like error:', error);
        window.showGlobalNotification('Something went wrong', 'error');
    } finally {
        // RE-ENABLE BUTTON AFTER 500ms
        setTimeout(() => {
            button.disabled = false;
        }, 500);
    }
};

// window.toggleComments = function(postId) {
//     console.log('Toggling comments for post:', postId);
    
//     const commentSection = document.getElementById(`commentsSection-${postId}`) ||
//                           document.getElementById(`comments-${postId}`) ||
//                           document.querySelector(`[data-post-id="${postId}"] .comments-section`);
    
//     if (commentSection) {
//         const isVisible = commentSection.style.display === 'block';
//         commentSection.style.display = isVisible ? 'none' : 'block';
        
//         if (!isVisible) {
//             loadComments(postId);
//         }
//     } else {
//         console.error('Comment section not found for post:', postId);
//     }
// };
window.toggleComments = function(postId, event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('🔄 Toggling comments for post:', postId);
    
    const commentSection = document.getElementById(`commentsSection-${postId}`);
    if (!commentSection) {
        console.error('❌ Comment section not found for post:', postId);
        return;
    }
    
    // Toggle display
    const isVisible = commentSection.style.display === 'block';
    commentSection.style.display = isVisible ? 'none' : 'block';
    
    console.log('✅ Comment section visibility:', commentSection.style.display);
    
    // Load comments if opening
    if (!isVisible) {
        setTimeout(() => {
            loadComments(postId);
        }, 100);
    }
};



async function loadComments(postId) {
    try {
        console.log('📥 Loading comments for post:', postId);
        const response = await fetch(`/api/comments/${postId}/`);
        if (!response.ok) throw new Error('Failed to load comments');
        
        const data = await response.json();
        console.log('Comments loaded:', data);
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
                <button class="comment-action-btn" onclick="window.likeComment('${comment.id}')" style="background: none; border: none; cursor: pointer; color: #65676b; font-size: 12px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                    <i class="far fa-heart"></i>
                    <span>Like</span>
                </button>
                <button class="comment-action-btn" onclick="window.replyToComment('${comment.id}')" style="background: none; border: none; cursor: pointer; color: #65676b; font-size: 12px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
                    <i class="fas fa-reply"></i>
                    <span>Reply</span>
                </button>
            </div>
        </div>
    `;
    return commentDiv;
}

window.toggleCommentMenu = function(commentId) {
    const menu = document.getElementById(`comment-menu-${commentId}`);
    if (menu) {
        document.querySelectorAll('.comment-dropdown').forEach(dropdown => {
            if (dropdown.id !== `comment-menu-${commentId}`) {
                dropdown.style.display = 'none';
            }
        });
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
};

document.addEventListener('click', function(event) {
    if (!event.target.closest('.comment-menu')) {
        document.querySelectorAll('.comment-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

window.likeComment = function(commentId) {
    window.showGlobalNotification('Comment liked!', 'success');
};

window.replyToComment = function(commentId) {
    window.showGlobalNotification('Reply feature coming soon', 'info');
};

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
        <button onclick="window.saveCommentEdit('${commentId}')" style="padding: 4px 8px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Save</button>
        <button onclick="window.cancelCommentEdit('${commentId}')" style="padding: 4px 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Cancel</button>
    `;
    
    contentElement.style.display = 'none';
    contentElement.insertAdjacentElement('afterend', input);
    contentElement.insertAdjacentElement('afterend', actions);
    
    input.focus();
    window.currentEditingComment = { commentId, originalContent: currentContent };
    
    window.toggleCommentMenu(commentId);
};

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
    const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
    const contentElement = document.getElementById(`comment-content-${commentId}`);
    const input = comment.querySelector('.edit-comment-input');
    const actions = comment.querySelector('div[style*="gap: 8px"]');
    
    if (input) input.remove();
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

window.reportComment = function(commentId) {
    if (confirm('Are you sure you want to report this comment?')) {
        window.showGlobalNotification('Comment reported. Thank you for keeping our community safe.', 'success');
        window.toggleCommentMenu(commentId);
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

// ==================== FOLLOW SYSTEM ====================
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

// ==================== INITIALIZATION ====================
window.loadInitialData = function() {
    console.log('Loading initial data');
    
    const userElement = document.querySelector('[data-user-id]');
    if (userElement) {
        window.currentUserId = userElement.dataset.userId;
    }
    
    document.querySelectorAll('.post-text').forEach(postText => {
        const content = postText.textContent;
        if (content && content.includes('#')) {
            postText.innerHTML = processPostContent(content);
        }
    });
};

// ==================== INITIALIZATION ====================
window.initializeApp = function() {
    console.log('🚀 Initializing Mytro App with Modern Modal Support...');
    
    // Load initial data
    window.loadInitialData();
    
    // ==================== MODERN MODAL FOCUSED SETUP ====================
    
    // NOTE: We're using MODERN modal system from base.html
    // So we REMOVE all old modal event listeners
    
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        // Remove OLD event listeners completely
        createPostForm.removeEventListener('submit', window.handleCreatePost);
        
        // Also remove old input listeners
        const postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.removeEventListener('input', window.updatePostButtonState);
        }
        
        const mediaUpload = document.getElementById('mediaUpload');
        if (mediaUpload) {
            mediaUpload.removeEventListener('change', window.handleMediaUpload);
        }
        
        const closeCreatePostBtn = document.getElementById('closeCreatePostModal');
        if (closeCreatePostBtn) {
            closeCreatePostBtn.removeEventListener('click', window.closeCreatePostModal);
        }
    }
    
    // ==================== GLOBAL EVENT HANDLERS ====================
    
    // Global click handlers for dropdowns
    document.addEventListener('click', function(event) {
        // Close post menus when clicking outside
        const dropdowns = document.querySelectorAll('.post-menu-dropdown.active');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target) && !event.target.closest('.post-menu-btn')) {
                dropdown.classList.remove('active');
            }
        });
        
        // Close comment menus when clicking outside
        const commentMenus = document.querySelectorAll('.comment-dropdown');
        commentMenus.forEach(menu => {
            if (!menu.contains(event.target) && !event.target.closest('.comment-menu-btn')) {
                menu.style.display = 'none';
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to close modals
        if (e.key === 'Escape') {
            // Close modern post modal
            if (typeof closeModernPostModal === 'function') {
                closeModernPostModal();
            }
            
            // Close image modal
            window.closeImageModal();
        }
    });
    
    // ==================== POST INTERACTION HANDLERS ====================
    
    // These remain the same as they work with both systems
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.closest('[data-post-id]')?.getAttribute('data-post-id');
            if (postId) {
                window.toggleLike(postId, this);
            }
        });
    });
    
    // document.querySelectorAll('.comment-btn').forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         const postId = this.closest('[data-post-id]')?.getAttribute('data-post-id');
    //         if (postId) {
    //             window.toggleComments(postId);
    //         }
    //     });
    // });
    
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.closest('[data-post-id]')?.getAttribute('data-post-id');
            if (postId) {
                window.sharePost(postId);
            }
        });
    });
    
    // ==================== MOBILE & PANEL HANDLERS ====================
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', window.toggleMobileMenu);
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', window.toggleMobileMenu);
    }
    
    // Notifications panel
    const notificationsBtn = document.getElementById('notificationsBtn');
    const closeNotifications = document.getElementById('closeNotifications');
    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', window.toggleNotificationsPanel);
    }
    
    if (closeNotifications) {
        closeNotifications.addEventListener('click', window.toggleNotificationsPanel);
    }
    
    // Messages panel
    const closeMessages = document.getElementById('closeMessages');
    if (closeMessages) {
        closeMessages.addEventListener('click', window.toggleMessagesPanel);
    }
    
    // ==================== INITIALIZE COMPONENTS ====================
    
    // Initialize like button states
    window.initializeLikeButtonStates();
    
    // Refresh like states from server
    window.refreshLikeStatesFromServer();
    
    console.log('✅ Mytro App Initialized Successfully with Modern Modal');
};

// Load initial data function
window.loadInitialData = function() {
    console.log('Loading initial data');
    
    const userElement = document.querySelector('[data-user-id]');
    if (userElement) {
        window.currentUserId = userElement.dataset.userId;
    }
    
    // Process hashtags in posts
    document.querySelectorAll('.post-text').forEach(postText => {
        const content = postText.textContent;
        if (content && content.includes('#')) {
            postText.innerHTML = processPostContent(content);
        }
    });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    setTimeout(() => {
        window.initializeApp();
        console.log('🎉 Mytro App Fully Ready!');
    }, 100);
});

// ==================== ADDITIONAL UTILITY FUNCTIONS ====================
window.initializeLikeButtonStates = function() {
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
        if (button.classList.contains('liked')) {
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            
            if (actionText) actionText.textContent = 'Liked';
            if (icon) icon.className = 'fas fa-heart';
            button.style.color = '#e74c3c';
        } else {
            const actionText = button.querySelector('.action-text');
            const icon = button.querySelector('i');
            
            if (actionText) actionText.textContent = 'Like';
            if (icon) icon.className = 'far fa-heart';
            button.style.color = '';
        }
    });
};

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
                            
                            if (likeCount) likeCount.textContent = postData.like_count;
                            
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

console.log('✅ Mytro Main.js Loaded Successfully');
