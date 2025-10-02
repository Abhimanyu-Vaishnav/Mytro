// Enhanced Comment System
let replyingToComment = null;

// Add comment with enhanced UI
async function addComment(postId, commentText) {
    if (!commentText.trim()) return;
    
    try {
        const response = await fetch('/api/comments/add/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                comment: commentText
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayNewComment(data.comment, postId);
            return true;
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
    return false;
}

// Display new comment in UI
function displayNewComment(comment, postId) {
    const commentsContainer = document.querySelector(`#comments-${postId} .comments-list`);
    if (!commentsContainer) return;
    
    const commentElement = createCommentElement(comment);
    commentsContainer.appendChild(commentElement);
    
    // Update comment count
    const countElement = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent) || 0;
        countElement.textContent = currentCount + 1;
    }
}

// Create comment element with all actions
function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.dataset.commentId = comment.id;
    
    div.innerHTML = `
        <div class="comment-avatar">
            ${comment.user.avatar ? 
                `<img src="${comment.user.avatar}" alt="${comment.user.name}">` :
                `<div class="default-avatar">${comment.user.name.charAt(0)}</div>`
            }
        </div>
        <div class="comment-content">
            <div class="comment-bubble">
                <div class="comment-header">
                    <span class="comment-author">${comment.user.name}</span>
                    <span class="comment-time">${comment.created_at}</span>
                </div>
                <div class="comment-text" id="comment-text-${comment.id}">${comment.content}</div>
                ${comment.is_owner ? `
                    <div class="comment-edit-form" id="edit-form-${comment.id}" style="display: none;">
                        <textarea class="edit-textarea" id="edit-text-${comment.id}">${comment.content}</textarea>
                        <div class="edit-actions">
                            <button class="btn-sm btn-secondary" onclick="cancelEditComment(${comment.id})">Cancel</button>
                            <button class="btn-sm btn-primary" onclick="saveEditComment(${comment.id})">Save</button>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="comment-actions">
                <button class="comment-action-btn like-btn" onclick="likeComment(${comment.id}, this)">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">0</span>
                </button>
                <button class="comment-action-btn reply-btn" onclick="replyToComment(${comment.id}, '${comment.user.name}')">
                    <i class="fas fa-reply"></i>
                    Reply
                </button>
                ${comment.is_owner ? `
                    <button class="comment-action-btn edit-btn" onclick="editComment(${comment.id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="comment-action-btn delete-btn" onclick="deleteComment(${comment.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                ` : `
                    <button class="comment-action-btn report-btn" onclick="reportComment(${comment.id})">
                        <i class="fas fa-flag"></i>
                        Report
                    </button>
                `}
            </div>
            <div class="replies-container" id="replies-${comment.id}"></div>
        </div>
    `;
    
    return div;
}

// Like comment
async function likeComment(commentId, button) {
    try {
        const response = await fetch(`/api/comments/${commentId}/like/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const icon = button.querySelector('i');
            const count = button.querySelector('.like-count');
            
            if (data.liked) {
                icon.style.color = '#e91e63';
                button.classList.add('liked');
            } else {
                icon.style.color = '#65676b';
                button.classList.remove('liked');
            }
            
            count.textContent = data.like_count;
        }
    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Reply to comment
function replyToComment(commentId, authorName) {
    replyingToComment = commentId;
    
    // Find the comment container
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const repliesContainer = commentElement.querySelector(`#replies-${commentId}`);
    
    // Remove existing reply form if any
    const existingForm = repliesContainer.querySelector('.reply-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    // Create reply form
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <div class="reply-input-container">
            <div class="reply-avatar">
                <div class="default-avatar">U</div>
            </div>
            <div class="reply-input-wrapper">
                <textarea placeholder="Reply to ${authorName}..." class="reply-textarea" id="reply-text-${commentId}"></textarea>
                <div class="reply-actions">
                    <button class="btn-sm btn-secondary" onclick="cancelReply(${commentId})">Cancel</button>
                    <button class="btn-sm btn-primary" onclick="submitReply(${commentId})">Reply</button>
                </div>
            </div>
        </div>
    `;
    
    repliesContainer.appendChild(replyForm);
    
    // Focus on textarea
    const textarea = replyForm.querySelector('.reply-textarea');
    textarea.focus();
}

// Submit reply
async function submitReply(commentId) {
    const textarea = document.getElementById(`reply-text-${commentId}`);
    const content = textarea.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`/api/comments/${commentId}/reply/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayReply(data.reply, commentId);
            cancelReply(commentId);
        }
    } catch (error) {
        console.error('Error submitting reply:', error);
    }
}

// Display reply
function displayReply(reply, parentCommentId) {
    const repliesContainer = document.getElementById(`replies-${parentCommentId}`);
    
    const replyElement = document.createElement('div');
    replyElement.className = 'reply-item';
    replyElement.innerHTML = `
        <div class="reply-avatar">
            ${reply.user.avatar ? 
                `<img src="${reply.user.avatar}" alt="${reply.user.name}">` :
                `<div class="default-avatar">${reply.user.name.charAt(0)}</div>`
            }
        </div>
        <div class="reply-content">
            <div class="reply-bubble">
                <span class="reply-author">${reply.user.name}</span>
                <span class="reply-text">${reply.content}</span>
            </div>
            <div class="reply-actions">
                <button class="reply-action-btn" onclick="likeComment(${reply.id}, this)">
                    <i class="fas fa-heart"></i>
                </button>
                <span class="reply-time">${reply.created_at}</span>
            </div>
        </div>
    `;
    
    repliesContainer.appendChild(replyElement);
}

// Cancel reply
function cancelReply(commentId) {
    const replyForm = document.querySelector(`#replies-${commentId} .reply-form`);
    if (replyForm) {
        replyForm.remove();
    }
    replyingToComment = null;
}

// Edit comment
function editComment(commentId) {
    const textElement = document.getElementById(`comment-text-${commentId}`);
    const editForm = document.getElementById(`edit-form-${commentId}`);
    
    textElement.style.display = 'none';
    editForm.style.display = 'block';
    
    const textarea = document.getElementById(`edit-text-${commentId}`);
    textarea.focus();
}

// Cancel edit
function cancelEditComment(commentId) {
    const textElement = document.getElementById(`comment-text-${commentId}`);
    const editForm = document.getElementById(`edit-form-${commentId}`);
    
    textElement.style.display = 'block';
    editForm.style.display = 'none';
}

// Save edit
async function saveEditComment(commentId) {
    const textarea = document.getElementById(`edit-text-${commentId}`);
    const content = textarea.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`/api/comments/${commentId}/edit/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            const data = await response.json();
            const textElement = document.getElementById(`comment-text-${commentId}`);
            textElement.textContent = data.content;
            cancelEditComment(commentId);
        }
    } catch (error) {
        console.error('Error editing comment:', error);
    }
}

// Delete comment
async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
        const response = await fetch(`/api/comments/${commentId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (response.ok) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
            }
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
    }
}

// Report comment
function reportComment(commentId) {
    window.showGlobalNotification('Comment reported', 'success');
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}