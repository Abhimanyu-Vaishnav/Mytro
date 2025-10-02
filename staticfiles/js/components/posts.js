// Posts functionality
function togglePostMenu(button) {
    const dropdown = button.nextElementSibling;
    const isShowing = dropdown.classList.contains('show');
    
    // Close all other dropdowns
    document.querySelectorAll('.post-menu-dropdown.show').forEach(dropdown => {
        if (dropdown !== dropdown) {
            dropdown.classList.remove('show');
        }
    });
    
    dropdown.classList.toggle('show', !isShowing);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.post-actions-menu')) {
        document.querySelectorAll('.post-menu-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Like functionality
async function toggleLike(postId) {
    const likeBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .like-btn`);
    const likeCount = document.querySelector(`.post-card[data-post-id="${postId}"] .like-count`);
    
    try {
        const response = await fetch(`/posts/${postId}/like/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
        });
        
        const data = await response.json();
        
        if (data.success) {
            likeBtn.classList.toggle('liked', data.liked);
            likeCount.textContent = data.like_count;
            
            // Add animation
            if (data.liked) {
                likeBtn.querySelector('i').style.animation = 'bounce 0.6s';
                setTimeout(() => {
                    likeBtn.querySelector('i').style.animation = '';
                }, 600);
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('Error liking post', 'error');
    }
}

// Comment functionality
function focusComment(postId) {
    const commentInput = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
    if (commentInput) {
        commentInput.focus();
    }
}

function handleCommentKeypress(event, postId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addComment(postId);
    }
}

async function addComment(postId) {
    const commentInput = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
    const content = commentInput.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`/posts/${postId}/comment/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            commentInput.value = '';
            // Add new comment to the list
            const commentsList = document.getElementById(`comments-${postId}`);
            commentsList.insertAdjacentHTML('beforeend', data.html);
            
            // Update comment count
            const commentCount = document.querySelector(`.post-card[data-post-id="${postId}"] .comment-count`);
            commentCount.textContent = parseInt(commentCount.textContent) + 1;
            
            showToast('Comment added successfully');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Error adding comment', 'error');
    }
}

// Utility function to get CSRF token
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Image modal
function openImageModal(imageUrl) {
    // Create image modal
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: zoom-out;
    `;
    
    modal.innerHTML = `
        <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">
        <button onclick="this.parentElement.remove()" style="
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
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// Initialize posts functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Posts functionality initialized');
});