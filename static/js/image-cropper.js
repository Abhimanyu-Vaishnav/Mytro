// High Quality Image Cropper Functionality
let currentCropImage = null;
let cropCanvas = null;
let cropContext = null;
let originalImageDimensions = { width: 0, height: 0 };

// Open image cropper with quality preservation
window.openImageCropper = function(imageFile, callback) {
    const modal = document.getElementById('cropModal') || createCropModal();
    const preview = document.getElementById('cropPreview');
    
    if (imageFile) {
        // Process image with quality preservation
        processImageForCropping(imageFile, function(processedDataUrl) {
            preview.src = processedDataUrl;
            currentCropImage = processedDataUrl;
            window.cropCallback = callback;
            modal.style.display = 'flex';
        });
    }
};

// Process image for cropping with quality preservation
function processImageForCropping(file, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Maintain original dimensions for cropping
        canvas.width = img.width;
        canvas.height = img.height;
        
        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Return maximum quality data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        callback(dataUrl);
    };
    
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

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

// Save cropped image with high quality
window.saveCroppedImage = function() {
    if (currentCropImage && window.cropCallback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Set high resolution canvas
            canvas.width = Math.min(img.width, 1920); // Max width 1920px
            canvas.height = Math.min(img.height, 1080); // Max height 1080px
            
            // Enable high quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw image with high quality
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert to maximum quality blob
            canvas.toBlob(function(blob) {
                const highQualityDataUrl = canvas.toDataURL('image/jpeg', 0.98); // 98% quality
                window.cropCallback(highQualityDataUrl);
                closeCropModal();
            }, 'image/jpeg', 0.98);
        };
        
        img.src = currentCropImage;
    }
};

// Enhanced file upload with high quality cropping
window.handleImageUploadWithCrop = function(input, callback) {
    const file = input.files[0];
    if (file && file.type.startsWith('image/')) {
        // Compress and optimize image before cropping
        compressImage(file, function(compressedDataUrl) {
            openImageCropper(file, callback);
        });
    }
};

// High quality image compression
function compressImage(file, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Calculate optimal dimensions
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // High quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw with high quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Return maximum quality data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        callback(dataUrl);
    };
    
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}