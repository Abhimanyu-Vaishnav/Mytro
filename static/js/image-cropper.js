// Image Cropper Functionality
let currentCropImage = null;
let cropCanvas = null;
let cropContext = null;

// Open image cropper
window.openImageCropper = function(imageFile, callback) {
    const modal = document.getElementById('cropModal') || createCropModal();
    const preview = document.getElementById('cropPreview');
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            currentCropImage = e.target.result;
            window.cropCallback = callback;
            modal.style.display = 'flex';
        };
        reader.readAsDataURL(imageFile);
    }
};

// Create crop modal
function createCropModal() {
    const modal = document.createElement('div');
    modal.id = 'cropModal';
    modal.className = 'crop-modal';
    modal.innerHTML = `
        <div class="crop-container">
            <div class="crop-header">
                <h3>Crop Image</h3>
                <button class="crop-close" onclick="closeCropModal()">&times;</button>
            </div>
            <div class="crop-area">
                <img id="cropPreview" class="crop-preview" alt="Preview">
            </div>
            <div class="crop-controls">
                <button class="crop-btn active" data-aspect="1">Square</button>
                <button class="crop-btn" data-aspect="1.5">Portrait</button>
                <button class="crop-btn" data-aspect="0.67">Landscape</button>
                <button class="crop-btn" data-aspect="free">Free</button>
            </div>
            <div class="crop-actions">
                <button class="btn-crop-cancel" onclick="closeCropModal()">Cancel</button>
                <button class="btn-crop-save" onclick="saveCroppedImage()">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelectorAll('.crop-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.querySelectorAll('.crop-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    return modal;
}

// Close crop modal
window.closeCropModal = function() {
    const modal = document.getElementById('cropModal');
    if (modal) {
        modal.style.display = 'none';
        currentCropImage = null;
        window.cropCallback = null;
    }
};

// Save cropped image
window.saveCroppedImage = function() {
    if (currentCropImage && window.cropCallback) {
        // Simple implementation - in production you'd use a proper cropping library
        window.cropCallback(currentCropImage);
        closeCropModal();
    }
};

// Enhanced file upload with cropping
window.handleImageUploadWithCrop = function(input, callback) {
    const file = input.files[0];
    if (file && file.type.startsWith('image/')) {
        openImageCropper(file, callback);
    }
};