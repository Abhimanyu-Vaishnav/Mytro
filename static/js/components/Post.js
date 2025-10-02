// Post.js - Enhanced Post Interactions with Modern Features

class Post {
    constructor(postElement) {
        this.postElement = postElement;
        this.postId = postElement.dataset.postId;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCommentSystem();
    }

    bindEvents() {
        // Like functionality
        const likeBtn = this.postElement.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleLike());
        }

        // Comment functionality
        const commentBtn = this.postElement.querySelector('.comment-btn');
        if (commentBtn) {
            commentBtn.addEventListener('click', () => this.toggleComments());
        }

        // Share functionality
        const shareBtn = this.postElement.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => this.handleShare(e));
        }

        // Edit functionality
        const editBtn = this.postElement.querySelector('.edit-post-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEdit());
        }

        // Delete functionality
        const deleteBtn = this.postElement.querySelector('.delete-post-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Report functionality
        const reportBtn = this.postElement.querySelector('.report-post-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.handleReport());
        }

        // Save functionality
        const saveBtn = this.postElement.querySelector('.save-post-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        // Copy link functionality
        const copyLinkBtn = this.postElement.querySelector('.copy-link-btn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copyPostLink());
        }
    }

    setupCommentSystem() {
        const commentInput = this.postElement.querySelector('.comment-input');
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submitComment();
                }
            });
        }

        const commentSubmitBtn = this.postElement.querySelector('.comment-submit-btn');
        if (commentSubmitBtn) {
            commentSubmitBtn.addEventListener('click', () => this.submitComment());
        }

        // Comment like buttons
        this.postElement.querySelectorAll('.comment-like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentLike(btn);
            });
        });

        // Comment edit buttons
        this.postElement.querySelectorAll('.edit-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentEdit(btn);
            });
        });

        // Comment delete buttons
        this.postElement.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentDelete(btn);
            });
        });

        // Comment report buttons
        this.postElement.querySelectorAll('.report-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentReport(btn);
            });
        });
    }

    async handleLike() {
        const likeBtn = this.postElement.querySelector('.like-btn');
        const likeCount = this.postElement.querySelector('.like-count');
        
        try {
            likeBtn.disabled = true;
            
            const response = await fetch(`/api/like_post/${this.postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.liked) {
                    likeBtn.classList.add('liked');
                    likeBtn.querySelector('.action-text').textContent = 'Liked';
                    this.showNotification('You liked this post');
                } else {
                    likeBtn.classList.remove('liked');
                    likeBtn.querySelector('.action-text').textContent = 'Like';
                    this.showNotification('You unliked this post');
                }
                
                likeCount.textContent = data.like_count;
                
                // Update likes preview
                this.updateLikesPreview(data.liked_users);
            }
        } catch (error) {
            console.error('Error liking post:', error);
            this.showNotification('Error liking post', 'error');
        } finally {
            likeBtn.disabled = false;
        }
    }

    updateLikesPreview(likedUsers) {
        const likesPreview = this.postElement.querySelector('.likes-preview');
        if (likesPreview && likedUsers) {
            const tooltip = likesPreview.querySelector('.likes-tooltip') || this.createLikesTooltip();
            const likedUsersContainer = tooltip.querySelector('.liked-users');
            
            likedUsersContainer.innerHTML = likedUsers.map(user => 
                `<span class="liked-user">${user}</span>`
            ).join('');
            
            if (likedUsers.length > 3) {
                likedUsersContainer.innerHTML += `<span class="more-likes">and ${likedUsers.length - 3} others</span>`;
            }
        }
    }

    createLikesTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'likes-tooltip';
        tooltip.innerHTML = '<div class="liked-users"></div>';
        this.postElement.querySelector('.likes-preview').appendChild(tooltip);
        return tooltip;
    }

    toggleComments() {
        const commentsSection = this.postElement.querySelector('.comments-section');
        commentsSection.classList.toggle('hidden');
        
        if (!commentsSection.classList.contains('hidden')) {
            this.loadComments();
        }
    }

    async loadComments() {
        try {
            const response = await fetch(`/api/get_comments/${this.postId}/`);
            if (response.ok) {
                const data = await response.json();
                this.displayComments(data.comments);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    displayComments(comments) {
        const commentsList = this.postElement.querySelector('.comments-list');
        commentsList.innerHTML = '';

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }

    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.setAttribute('data-comment-id', comment.id);
        
        commentDiv.innerHTML = `
            <a href="${comment.profile_url}" class="comment-avatar-link">
                ${comment.photoUrl ? 
                    `<img src="${comment.photoUrl}" alt="${comment.name}" class="comment-avatar">` :
                    `<div class="default-avatar x-small">${comment.name.charAt(0)}</div>`
                }
            </a>
            <div class="comment-content">
                <div class="comment-header">
                    <a href="${comment.profile_url}" class="comment-username">${comment.name}</a>
                    <span class="comment-time">${comment.date}</span>
                </div>
                <p class="comment-text">${comment.content}</p>
                <div class="comment-actions">
                    <button class="comment-like-btn ${comment.is_liked ? 'liked' : ''}" 
                            data-comment-id="${comment.id}">
                        <i class="fas fa-heart"></i>
                        <span class="comment-like-count">${comment.likes_count}</span>
                    </button>
                    ${comment.is_owner ? `
                    <div class="comment-menu">
                        <button class="comment-menu-btn">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="comment-menu-dropdown">
                            <button class="menu-item edit-comment-btn" data-comment-id="${comment.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="menu-item delete-comment-btn" data-comment-id="${comment.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                            <button class="menu-item report-comment-btn" data-comment-id="${comment.id}">
                                <i class="fas fa-flag"></i> Report
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Re-bind events for the new comment
        setTimeout(() => {
            this.bindCommentEvents(commentDiv);
        }, 0);

        return commentDiv;
    }

    bindCommentEvents(commentElement) {
        const likeBtn = commentElement.querySelector('.comment-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentLike(likeBtn);
            });
        }

        const editBtn = commentElement.querySelector('.edit-comment-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentEdit(editBtn);
            });
        }

        const deleteBtn = commentElement.querySelector('.delete-comment-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentDelete(deleteBtn);
            });
        }

        const reportBtn = commentElement.querySelector('.report-comment-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCommentReport(reportBtn);
            });
        }
    }

    async submitComment() {
        const commentInput = this.postElement.querySelector('.comment-input');
        const commentText = commentInput.value.trim();
        
        if (!commentText) return;

        try {
            const response = await fetch('/api/add_comment/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    post_id: this.postId,
                    comment: commentText
                })
            });

            if (response.ok) {
                const comment = await response.json();
                this.addCommentToDOM(comment);
                commentInput.value = '';
                commentInput.style.height = 'auto';
                
                // Update comment count
                const commentCount = this.postElement.querySelector('.comment-count');
                commentCount.textContent = parseInt(commentCount.textContent) + 1;
                
                this.showNotification('Comment added successfully');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            this.showNotification('Error adding comment', 'error');
        }
    }

    addCommentToDOM(comment) {
        const commentsList = this.postElement.querySelector('.comments-list');
        const commentElement = this.createCommentElement(comment);
        
        // Insert at the beginning
        commentsList.insertBefore(commentElement, commentsList.firstChild);
    }

    async handleCommentLike(button) {
        const commentId = button.getAttribute('data-comment-id');
        
        try {
            button.disabled = true;
            
            const response = await fetch(`/api/like_comment/${commentId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const likeCount = button.querySelector('.comment-like-count');
                
                if (data.liked) {
                    button.classList.add('liked');
                    this.showNotification('You liked this comment');
                } else {
                    button.classList.remove('liked');
                    this.showNotification('You unliked this comment');
                }
                
                likeCount.textContent = data.like_count;
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            this.showNotification('Error liking comment', 'error');
        } finally {
            button.disabled = false;
        }
    }

    handleCommentEdit(button) {
        const commentId = button.getAttribute('data-comment-id');
        const commentItem = button.closest('.comment-item');
        const commentText = commentItem.querySelector('.comment-text');
        const currentContent = commentText.textContent;
        
        const editInterface = `
            <div class="edit-comment-interface">
                <textarea class="edit-comment-textarea">${currentContent}</textarea>
                <div class="edit-comment-actions">
                    <button class="btn-small btn-secondary" onclick="cancelCommentEdit('${commentId}')">Cancel</button>
                    <button class="btn-small btn-primary" onclick="saveCommentEdit('${commentId}')">Save</button>
                </div>
            </div>
        `;
        
        commentText.style.display = 'none';
        commentText.insertAdjacentHTML('afterend', editInterface);
    }

    async handleCommentDelete(button) {
        const commentId = button.getAttribute('data-comment-id');
        
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await fetch(`/api/delete_comment/${commentId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                },
            });

            if (response.ok) {
                const commentItem = button.closest('.comment-item');
                commentItem.remove();
                
                // Update comment count
                const commentCount = this.postElement.querySelector('.comment-count');
                commentCount.textContent = parseInt(commentCount.textContent) - 1;
                
                this.showNotification('Comment deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showNotification('Error deleting comment', 'error');
        }
    }

    handleCommentReport(button) {
        const commentId = button.getAttribute('data-comment-id');
        this.showReportDialog('comment', commentId);
    }

    handleEdit() {
        const postText = this.postElement.querySelector('.post-text');
        const currentContent = postText.textContent;
        
        const editInterface = `
            <div class="edit-post-interface">
                <textarea class="edit-post-textarea">${currentContent}</textarea>
                <div class="edit-post-actions">
                    <button class="btn-secondary" onclick="this.closest('.edit-post-interface').remove(); this.previousElementSibling.style.display='block'">Cancel</button>
                    <button class="btn-primary" onclick="window.postInstances['${this.postId}'].savePostEdit()">Save</button>
                </div>
            </div>
        `;
        
        postText.style.display = 'none';
        postText.insertAdjacentHTML('afterend', editInterface);
    }

    async savePostEdit() {
        const editInterface = this.postElement.querySelector('.edit-post-interface');
        const textarea = editInterface.querySelector('.edit-post-textarea');
        const newContent = textarea.value.trim();
        
        if (!newContent) {
            this.showNotification('Post content cannot be empty', 'error');
            return;
        }
        
        try {
            const response = await fetch(`/api/edit_post/${this.postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newContent })
            });
            
            if (response.ok) {
                const data = await response.json();
                const postText = this.postElement.querySelector('.post-text');
                postText.textContent = data.content;
                editInterface.remove();
                postText.style.display = 'block';
                this.showNotification('Post updated successfully');
            }
        } catch (error) {
            console.error('Error editing post:', error);
            this.showNotification('Error editing post', 'error');
        }
    }

    async handleDelete() {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/delete_post/${this.postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                this.postElement.style.opacity = '0.5';
                setTimeout(() => {
                    this.postElement.remove();
                    this.showNotification('Post deleted successfully');
                }, 500);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification('Error deleting post', 'error');
        }
    }

    handleReport() {
        this.showReportDialog('post', this.postId);
    }

    showReportDialog(type, id) {
        const reason = prompt(`Please specify the reason for reporting this ${type}:`);
        if (reason) {
            this.submitReport(type, id, reason);
        }
    }

    async submitReport(type, id, reason) {
        try {
            const response = await fetch('/api/report/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: type,
                    id: id,
                    reason: reason
                })
            });

            if (response.ok) {
                this.showNotification('Thank you for your report. We will review it shortly.');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            this.showNotification('Error submitting report', 'error');
        }
    }

    async handleSave() {
        try {
            const response = await fetch(`/api/save_post/${this.postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.showNotification(data.saved ? 'Post saved to your collection' : 'Post removed from your collection');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            this.showNotification('Error saving post', 'error');
        }
    }

    handleShare(event) {
        // Share dropdown is handled by CSS, this is for additional share functionality
        console.log('Share button clicked');
    }

    copyPostLink() {
        const postUrl = `${window.location.origin}/post/${this.postId}/`;
        navigator.clipboard.writeText(postUrl).then(() => {
            this.showNotification('Post link copied to clipboard');
        });
    }

    getCSRFToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }

    showNotification(message, type = 'success') {
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

// Global post instances management
window.postInstances = {};

// Initialize all posts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const posts = document.querySelectorAll('.post-card');
    posts.forEach(post => {
        const postId = post.dataset.postId;
        window.postInstances[postId] = new Post(post);
    });
});

// Global comment edit functions
function cancelCommentEdit(commentId) {
    const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
    const editInterface = commentItem.querySelector('.edit-comment-interface');
    const commentText = commentItem.querySelector('.comment-text');
    
    editInterface.remove();
    commentText.style.display = 'block';
}

async function saveCommentEdit(commentId) {
    const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
    const editInterface = commentItem.querySelector('.edit-comment-interface');
    const textarea = editInterface.querySelector('.edit-comment-textarea');
    const newContent = textarea.value.trim();
    
    if (!newContent) {
        alert('Comment content cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`/api/edit_comment/${commentId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: newContent })
        });
        
        if (response.ok) {
            const data = await response.json();
            const commentText = commentItem.querySelector('.comment-text');
            commentText.textContent = data.content;
            cancelCommentEdit(commentId);
            
            // Show notification
            const notification = document.createElement('div');
            notification.className = 'global-notification success';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-check-circle"></i>
                    <span>Comment updated successfully</span>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    } catch (error) {
        console.error('Error editing comment:', error);
        alert('Error editing comment');
    }
}



// Fix posts loading
async function loadPosts(page = 1) {
    try {
        const response = await fetch(`/api/posts/page/${page}/`);
        if (!response.ok) throw new Error('Failed to load posts');
        const posts = await response.json();
        return posts;
    } catch (error) {
        console.error('Error loading posts:', error);
        return [];
    }
}

// Fix comments loading
async function loadComments(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments/`);
        if (!response.ok) throw new Error('Failed to load comments');
        return await response.json();
    } catch (error) {
        console.error('Error loading comments:', error);
        return [];
    }
}

// Fix comment submission
async function submitComment(postId, commentText) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({ content: commentText })
        });
        
        if (!response.ok) throw new Error('Failed to post comment');
        return await response.json();
    } catch (error) {
        console.error('Error posting comment:', error);
        throw error;
    }
}