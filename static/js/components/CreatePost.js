// CreatePost.js - Modern Post Creation with Enhanced Features
class CreatePost {
    constructor() {
        this.mediaFiles = [];
        this.currentMediaIndex = 0;
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupMediaHandlers();
        this.setupFormValidation();
    }

    bindEvents() {
        // Form submission
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        }

        // Post content validation
        const postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.addEventListener('input', () => this.validatePost());
            postContent.addEventListener('keydown', (e) => this.handleTextareaKeydown(e));
        }

        // Modal events
        const closeModalBtn = document.getElementById('closeCreatePostModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        const modalOverlay = document.getElementById('createPostModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    setupMediaHandlers() {
        const mediaUpload = document.getElementById('mediaUpload');
        if (mediaUpload) {
            mediaUpload.addEventListener('change', (e) => this.handleMediaUpload(e));
        }

        // Drag and drop support
        const postContentContainer = document.querySelector('.post-content-container');
        if (postContentContainer) {
            postContentContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
            postContentContainer.addEventListener('drop', (e) => this.handleDrop(e));
            postContentContainer.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        }
    }

    setupFormValidation() {
        const postContent = document.getElementById('postContent');
        const mediaPreview = document.getElementById('mediaPreview');
        
        const observer = new MutationObserver(() => {
            this.validatePost();
        });
        
        if (mediaPreview) {
            observer.observe(mediaPreview, { childList: true, subtree: true });
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processMediaFiles(files);
        }
    }

    handleMediaUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.processMediaFiles(files);
        }
        // Reset the input to allow uploading the same file again
        event.target.value = '';
    }

    processMediaFiles(files) {
        const validFiles = Array.from(files).filter(file => this.validateMediaFile(file));
        
        if (validFiles.length === 0) return;
        
        // Check total file size
        const totalSize = validFiles.reduce((total, file) => total + file.size, 0);
        const maxTotalSize = 100 * 1024 * 1024; // 100MB
        
        if (totalSize > maxTotalSize) {
            this.showNotification('Total file size exceeds 100MB limit', 'error');
            return;
        }
        
        // Add files to mediaFiles array
        this.mediaFiles.push(...validFiles);
        
        // Create previews
        validFiles.forEach(file => this.createMediaPreview(file));
        
        this.validatePost();
        this.showNotification(`${validFiles.length} file(s) added successfully`);
    }

    validateMediaFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mov', 'video/webm',
            'audio/mpeg', 'audio/wav', 'audio/ogg'
        ];
        
        if (file.size > maxSize) {
            this.showNotification(`"${file.name}" is too large. Maximum 50MB per file.`, 'error');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            this.showNotification(`"${file.name}" is not a supported file type.`, 'error');
            return false;
        }
        
        return true;
    }

    createMediaPreview(file) {
        const preview = document.getElementById('mediaPreview');
        const reader = new FileReader();

        reader.onload = (e) => {
            const mediaElement = this.createMediaElement(file.type, e.target.result, file.name);
            preview.appendChild(mediaElement);
            preview.style.display = 'flex';
        };

        reader.readAsDataURL(file);
    }

    createMediaElement(type, src, filename) {
        const container = document.createElement('div');
        container.className = 'media-preview-item';
        container.setAttribute('data-filename', filename);
        
        let mediaElement;
        
        if (type.startsWith('image/')) {
            mediaElement = document.createElement('img');
            mediaElement.src = src;
            mediaElement.alt = 'Preview';
            mediaElement.className = 'media-preview-image';
            mediaElement.loading = 'lazy';
        } else if (type.startsWith('video/')) {
            mediaElement = document.createElement('video');
            mediaElement.src = src;
            mediaElement.controls = true;
            mediaElement.className = 'media-preview-video';
        } else if (type.startsWith('audio/')) {
            mediaElement = document.createElement('audio');
            mediaElement.src = src;
            mediaElement.controls = true;
            mediaElement.className = 'media-preview-audio';
        }
        
        const actions = document.createElement('div');
        actions.className = 'media-preview-actions';
        actions.innerHTML = `
            <button type="button" class="btn-small btn-danger" onclick="this.closest('.media-preview-item').remove(); createPostInstance.removeMediaFile('${filename}')">
                <i class="fas fa-times"></i>
            </button>
            <button type="button" class="btn-small btn-secondary" onclick="createPostInstance.editMedia('${filename}')">
                <i class="fas fa-edit"></i>
            </button>
        `;
        
        container.appendChild(mediaElement);
        container.appendChild(actions);
        
        return container;
    }

    removeMediaFile(filename) {
        this.mediaFiles = this.mediaFiles.filter(file => file.name !== filename);
        this.validatePost();
    }

    editMedia(filename) {
        const file = this.mediaFiles.find(f => f.name === filename);
        if (file && file.type.startsWith('image/')) {
            this.openImageEditor(file);
        }
    }

    openImageEditor(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (window.imageFilter) {
                window.imageFilter.loadImageFromUrl(e.target.result, () => {
                    document.getElementById('imageEditorModal').style.display = 'flex';
                    window.currentEditingFile = file;
                });
            }
        };
        reader.readAsDataURL(file);
    }

    handleTextareaKeydown(e) {
        // Tab key support for textarea
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            
            // Insert tab character
            e.target.value = e.target.value.substring(0, start) + '\t' + e.target.value.substring(end);
            
            // Move cursor
            e.target.selectionStart = e.target.selectionEnd = start + 1;
        }
        
        // Submit with Ctrl/Cmd + Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.submitPost();
        }
    }

    validatePost() {
        const postContent = document.getElementById('postContent');
        const submitBtn = document.getElementById('postSubmitBtn');
        const hasContent = postContent.value.trim().length > 0;
        const hasMedia = this.mediaFiles.length > 0;
        
        submitBtn.disabled = !(hasContent || hasMedia) || this.isSubmitting;
    }

    async handlePostSubmit(event) {
        event.preventDefault();
        await this.submitPost();
    }

    async submitPost() {
        if (this.isSubmitting) return;
        
        const postContent = document.getElementById('postContent');
        const content = postContent.value.trim();
        
        if (!content && this.mediaFiles.length === 0) {
            this.showNotification('Please add some content or media to your post.', 'error');
            return;
        }

        this.isSubmitting = true;
        const submitBtn = document.getElementById('postSubmitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        btnText.textContent = 'Posting...';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('csrfmiddlewaretoken', this.getCSRFToken());

            // Get privacy setting
            const privacySelect = document.querySelector('.privacy-select');
            if (privacySelect) {
                formData.append('privacy', privacySelect.value);
            }

            // Append media files
            this.mediaFiles.forEach((file, index) => {
                formData.append(`media_${index}`, file);
            });

            const response = await fetch('/api/create_post/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.showNotification('Post created successfully!', 'success');
                this.closeModal();
                
                // Reload page or add post dynamically
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification(error.message || 'Error creating post. Please try again.', 'error');
            
            // Reset button state
            btnText.textContent = 'Post';
            btnLoading.style.display = 'none';
            this.isSubmitting = false;
            this.validatePost();
        }
    }

    openModal(prefillContent = '') {
        const modal = document.getElementById('createPostModal');
        const postContent = document.getElementById('postContent');
        
        if (prefillContent) {
            postContent.value = prefillContent;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on textarea
        setTimeout(() => {
            postContent.focus();
            this.validatePost();
        }, 300);
    }

    closeModal() {
        const modal = document.getElementById('createPostModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('postContent').value = '';
        document.getElementById('mediaPreview').innerHTML = '';
        document.getElementById('mediaPreview').style.display = 'none';
        document.getElementById('postSubmitBtn').disabled = true;
        
        const btnText = document.getElementById('postSubmitBtn').querySelector('.btn-text');
        const btnLoading = document.getElementById('postSubmitBtn').querySelector('.btn-loading');
        
        btnText.textContent = 'Post';
        btnLoading.style.display = 'none';
        
        this.mediaFiles = [];
        this.isSubmitting = false;
        
        // Reset file input
        const mediaUpload = document.getElementById('mediaUpload');
        if (mediaUpload) {
            mediaUpload.value = '';
        }
    }

    getCSRFToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    showNotification(message, type = 'success') {
        // Use the global notification function
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `global-notification ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                    <span>${message}</span>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }
}

// Global functions
function openCreatePostModal(prefillContent = '') {
    if (window.createPostInstance) {
        window.createPostInstance.openModal(prefillContent);
    }
}

function closeCreatePostModal() {
    if (window.createPostInstance) {
        window.createPostInstance.closeModal();
    }
}

function handleMediaUpload(input) {
    if (window.createPostInstance) {
        window.createPostInstance.handleMediaUpload({ target: input });
    }
}

// Image Editor Functions
function openImageEditor() {
    document.getElementById('imageEditorModal').style.display = 'flex';
}

function closeImageEditor() {
    document.getElementById('imageEditorModal').style.display = 'none';
}

function applyImageEdit() {
    if (window.imageFilter && window.currentEditingFile) {
        const editedImageData = window.imageFilter.getFilteredImage();
        
        // Convert data URL to blob and update the file
        fetch(editedImageData)
            .then(res => res.blob())
            .then(blob => {
                const editedFile = new File([blob], window.currentEditingFile.name, {
                    type: 'image/jpeg',
                    lastModified: new Date().getTime()
                });
                
                // Replace the original file in mediaFiles array
                const filename = window.currentEditingFile.name;
                window.createPostInstance.mediaFiles = window.createPostInstance.mediaFiles.map(file => 
                    file.name === filename ? editedFile : file
                );
                
                // Update preview
                const previewItem = document.querySelector(`[data-filename="${filename}"]`);
                if (previewItem) {
                    const img = previewItem.querySelector('img');
                    if (img) {
                        img.src = editedImageData;
                    }
                }
                
                window.createPostInstance.showNotification('Image edited successfully');
                closeImageEditor();
            })
            .catch(error => {
                console.error('Error applying image edit:', error);
                window.createPostInstance.showNotification('Error applying image edit', 'error');
            });
    }
}

function resetImageEditor() {
    if (window.imageFilter) {
        window.imageFilter.applyFilter('normal');
        
        // Reset sliders
        const brightnessSlider = document.getElementById('brightnessSlider');
        const contrastSlider = document.getElementById('contrastSlider');
        
        if (brightnessSlider) brightnessSlider.value = 0;
        if (contrastSlider) contrastSlider.value = 0;
        
        // Update values
        const brightnessValue = document.getElementById('brightnessValue');
        const contrastValue = document.getElementById('contrastValue');
        
        if (brightnessValue) brightnessValue.textContent = '0';
        if (contrastValue) contrastValue.textContent = '0';
    }
}

// Filter application
document.addEventListener('DOMContentLoaded', function() {
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterOptions.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            if (window.imageFilter) {
                window.imageFilter.applyFilter(filter);
            }
        });
    });
    
    // Brightness slider
    const brightnessSlider = document.getElementById('brightnessSlider');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function() {
            const value = this.value;
            const brightnessValue = document.getElementById('brightnessValue');
            if (brightnessValue) {
                brightnessValue.textContent = value;
            }
            if (window.imageFilter) {
                window.imageFilter.adjustBrightness(parseInt(value));
            }
        });
    }
    
    // Contrast slider
    const contrastSlider = document.getElementById('contrastSlider');
    if (contrastSlider) {
        contrastSlider.addEventListener('input', function() {
            const value = this.value;
            const contrastValue = document.getElementById('contrastValue');
            if (contrastValue) {
                contrastValue.textContent = value;
            }
            if (window.imageFilter) {
                window.imageFilter.adjustContrast(parseInt(value));
            }
        });
    }
});

// Emoji Picker Functions
function openEmojiPicker() {
    document.getElementById('emojiPickerModal').style.display = 'flex';
    populateEmojiGrid();
}

function closeEmojiPicker() {
    document.getElementById('emojiPickerModal').style.display = 'none';
}

function populateEmojiGrid() {
    const emojiGrid = document.getElementById('emojiGrid');
    if (!emojiGrid) return;
    
    const emojis = {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
        people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍'],
        nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔'],
        food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'],
        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🎿', '⛷️', '🏂']
    };
    
    const activeCategory = document.querySelector('.emoji-category.active')?.getAttribute('data-category') || 'smileys';
    const categoryEmojis = emojis[activeCategory] || emojis.smileys;
    
    emojiGrid.innerHTML = categoryEmojis.map(emoji => `
        <button class="emoji-btn" onclick="insertEmoji('${emoji}')">${emoji}</button>
    `).join('');
    
    // Add category switchers
    const categoryButtons = document.querySelectorAll('.emoji-category');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            populateEmojiGrid();
        });
    });
}

function insertEmoji(emoji) {
    const postContent = document.getElementById('postContent');
    const start = postContent.selectionStart;
    const end = postContent.selectionEnd;
    
    postContent.value = postContent.value.substring(0, start) + emoji + postContent.value.substring(end);
    postContent.focus();
    postContent.selectionStart = postContent.selectionEnd = start + emoji.length;
    
    closeEmojiPicker();
    
    if (window.createPostInstance) {
        window.createPostInstance.validatePost();
    }
}

// Location Functions
function addLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Reverse geocoding to get location name
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                    .then(res => res.json())
                    .then(data => {
                        const locationName = data.city || data.locality || 'Current Location';
                        const postContent = document.getElementById('postContent');
                        postContent.value += `\n📍 ${locationName}`;
                        
                        if (window.createPostInstance) {
                            window.createPostInstance.validatePost();
                        }
                        
                        window.createPostInstance.showNotification('Location added to your post');
                    })
                    .catch(error => {
                        console.error('Error getting location name:', error);
                        window.createPostInstance.showNotification('Location added (coordinates only)');
                    });
            },
            (error) => {
                console.error('Error getting location:', error);
                window.createPostInstance.showNotification('Unable to get your location', 'error');
            }
        );
    } else {
        window.createPostInstance.showNotification('Geolocation is not supported by this browser', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.createPostInstance = new CreatePost();
    
    // Add drag and drop zone styling
    const style = document.createElement('style');
    style.textContent = `
        .post-content-container.drag-over {
            border: 2px dashed var(--primary-color);
            background: var(--primary-light);
        }
        
        .post-content-container.drag-over::before {
            content: 'Drop files here to upload';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--primary-color);
            font-weight: 600;
            z-index: 10;
        }
    `;
    document.head.appendChild(style);
});

// Utility function for notifications (fallback)
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}