// Location functionality
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        if(window.showToast) showToast('Geolocation is not supported by this browser.','error'); else console.log("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    // Use reverse geocoding to get location name
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    
    // Add to your form
    document.querySelector('textarea[name="content"]').value += ` 📍 Current Location`;
}