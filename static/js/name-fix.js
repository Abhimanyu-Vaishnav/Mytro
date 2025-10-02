// Fix name display throughout the application
document.addEventListener('DOMContentLoaded', function() {
    // Function to get user's full name from data attributes or fallback to username
    function getDisplayName(element) {
        const fullName = element.dataset.fullName || element.dataset.name;
        const username = element.dataset.username;
        return fullName && fullName.trim() ? fullName : username;
    }
    
    // Update all user name displays
    function updateUserNames() {
        // Update comment authors
        document.querySelectorAll('.comment-author').forEach(element => {
            const displayName = getDisplayName(element);
            if (displayName) {
                element.textContent = displayName;
            }
        });
        
        // Update post authors
        document.querySelectorAll('.post-author-name, .author-name').forEach(element => {
            const displayName = getDisplayName(element);
            if (displayName) {
                element.textContent = displayName;
            }
        });
        
        // Update user cards
        document.querySelectorAll('.user-name').forEach(element => {
            const displayName = getDisplayName(element);
            if (displayName) {
                element.textContent = displayName;
            }
        });
    }
    
    // Run on page load
    updateUserNames();
    
    // Run when new content is added dynamically
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                updateUserNames();
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});