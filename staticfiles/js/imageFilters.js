// static/js/ImageFilters.js

class ImageFilters {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.currentImage = null;
    }

    // Load image from file input
    loadImage(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.currentImage = img;
                this.drawImage();
                if (callback) callback();
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    // Load image from URL
    loadImageFromUrl(url, callback) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.originalImage = img;
            this.currentImage = img;
            this.drawImage();
            if (callback) callback();
        };
        img.src = url;
    }

    // Draw image on canvas
    drawImage() {
        if (!this.currentImage) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw image
        this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    // Apply filter to image
    applyFilter(filterName) {
        if (!this.originalImage) return;

        // Reset to original first
        this.currentImage = this.originalImage;
        this.drawImage();

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        switch (filterName) {
            case 'normal':
                // No filter - original image
                break;

            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // red
                    data[i + 1] = avg; // green
                    data[i + 2] = avg; // blue
                }
                break;

            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;

            case 'vintage':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] *= 0.9;     // Reduce red
                    data[i + 1] *= 0.7; // Reduce green more
                    data[i + 2] *= 0.8; // Reduce blue
                }
                break;

            case 'clarendon':
                for (let i = 0; i < data.length; i += 4) {
                    // Increase contrast and saturation
                    data[i] = Math.min(255, data[i] * 1.2);     // Boost red
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Boost green
                    data[i + 2] = Math.min(255, data[i + 2] * 0.9); // Reduce blue slightly
                }
                break;

            case 'moon':
                // Black and white with high contrast
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const contrast = avg < 128 ? avg * 0.5 : Math.min(255, avg * 1.5);
                    data[i] = contrast;
                    data[i + 1] = contrast;
                    data[i + 2] = contrast;
                }
                break;

            case 'warm':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.3);     // Warm red boost
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Slight green boost
                    data[i + 2] *= 0.9; // Cool blue reduction
                }
                break;

            case 'cool':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] *= 0.9;     // Reduce red
                    data[i + 1] *= 0.95; // Slight green reduction
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Boost blue
                }
                break;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Adjust brightness
    adjustBrightness(value) {
        if (!this.originalImage) return;

        this.currentImage = this.originalImage;
        this.drawImage();

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + value);     // red
            data[i + 1] = Math.min(255, data[i + 1] + value); // green
            data[i + 2] = Math.min(255, data[i + 2] + value); // blue
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Adjust contrast
    adjustContrast(value) {
        if (!this.originalImage) return;

        this.currentImage = this.originalImage;
        this.drawImage();

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const factor = (259 * (value + 255)) / (255 * (259 - value));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, factor * (data[i] - 128) + 128);
            data[i + 1] = Math.min(255, factor * (data[i + 1] - 128) + 128);
            data[i + 2] = Math.min(255, factor * (data[i + 2] - 128) + 128);
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Get filtered image as data URL
    getFilteredImage() {
        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    // Download filtered image
    downloadImage(filename = 'mytro-filtered-image.jpg') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.getFilteredImage();
        link.click();
    }
}

// Usage example:
// const filter = new ImageFilters('myCanvas');
// filter.loadImage(file, () => {
//     filter.applyFilter('vintage');
// });