// post_card.js - interactive behaviors for post card
(function(){
    function getCSRF() {
        const cookies = document.cookie.split(';').map(c => c.trim());
        for (const c of cookies) {
            if (c.startsWith('csrftoken=')) return c.split('=')[1];
        }
        return '';
    }

    // Toggle post menu
    window.togglePostMenu = function(postId){
        const menu = document.getElementById(`postMenu-${postId}`);
        if(!menu) return;
        // close other menus
        document.querySelectorAll('.post-menu-dropdown.active').forEach(m => {
            if(m !== menu) m.classList.remove('active');
        });
        menu.classList.toggle('active');
        const btn = menu.previousElementSibling;
        if(btn) btn.setAttribute('aria-expanded', menu.classList.contains('active'));
    }

    // Close menus on ESC
    document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' || e.key === 'Esc'){
            document.querySelectorAll('.post-menu-dropdown.active').forEach(m => m.classList.remove('active'));
            document.querySelectorAll('.post-menu-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
        }
    });

    // Like/Unlike
    window.likePost = async function(postId){
        try{
            const btn = document.querySelector(`.post-card[data-post-id='${postId}'] .like-btn`);
            const countEl = document.getElementById(`likeCount-${postId}`);
            const liked = btn && btn.dataset.liked === 'true';

            const res = await fetch(`/api/posts/${postId}/like/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRF()
                },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if(data.success){
                btn.dataset.liked = data.liked ? 'true' : 'false';
                if(data.liked) btn.classList.add('liked'); else btn.classList.remove('liked');
                if(countEl) countEl.textContent = data.like_count;
                // pulse animation
                try{
                    const icon = btn.querySelector('i');
                    if(icon){
                        icon.classList.add('like-pulse');
                        setTimeout(()=> icon.classList.remove('like-pulse'), 500);
                    }
                }catch(e){}
            } else {
                console.error('Like error', data.error);
                if(res.status === 401) window.location = '/login/';
            }
        }catch(e){ console.error(e); }
    }

    // Focus comment input
    window.focusCommentInput = function(postId){
        const input = document.getElementById(`commentInput-${postId}`);
        if(input) input.focus();
    }

    // Submit comment
    window.submitComment = async function(e, postId){
        e.preventDefault();
        const input = document.getElementById(`commentInput-${postId}`);
        if(!input) return;
        const val = input.value.trim();
        if(!val) return;

        // Optimistic UI
        const list = document.getElementById(`commentList-${postId}`);
        const tempId = `temp-${Date.now()}`;
        const tempEl = document.createElement('div');
        tempEl.className = 'comment-item';
        tempEl.id = tempId;
        tempEl.innerHTML = `
            <div class="comment-avatar-default">Me</div>
            <div class="comment-content">
                <div class="comment-header"><strong>You</strong><span class="comment-time">Just now</span></div>
                <div class="comment-text">${escapeHtml(val)}</div>
            </div>
        `;
        if(list) list.prepend(tempEl);
        input.value = '';

        try{
            const res = await fetch(`/api/comments/add/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRF()
                },
                body: JSON.stringify({ post_id: postId, comment: val })
            });
            const data = await res.json();
            if(data.success){
                // Replace temp with real comment
                if(tempEl){
                    tempEl.remove();
                }
                const c = data.comment;
                const newEl = document.createElement('div');
                newEl.className = 'comment-item';
                newEl.innerHTML = `
                    <div class="comment-avatar">${c.user.avatar ? `<img src="${c.user.avatar}" class="comment-avatar-img">` : `<div class="comment-avatar-default">${c.user.username.charAt(0).toUpperCase()}</div>`}</div>
                    <div class="comment-content">
                        <div class="comment-header"><strong>${c.user.username}</strong><span class="comment-time">${c.created_at}</span></div>
                        <div class="comment-text">${escapeHtml(c.content)}</div>
                    </div>
                `;
                if(list) list.prepend(newEl);
                // update count
                const countEl = document.getElementById(`commentCount-${postId}`);
                if(countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
            } else {
                console.error('Add comment failed', data.error);
                if(tempEl) tempEl.remove();
            }
        } catch(err){
            console.error(err);
            if(tempEl) tempEl.remove();
        }
    }

    // Repost
    window.repost = async function(postId){
        try{
            const res = await fetch(`/api/posts/${postId}/repost/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if(data.success){
                    if(window.showToast) showToast(data.message,'success'); else console.log(data.message);
                // Optionally update repost count in UI if present
            } else {
                console.error(data.error);
            }
        }catch(e){ console.error(e); }
    }

    // Open quote modal
    window.openQuoteModal = function(postId){
        const modal = document.getElementById(`quoteModal-${postId}`);
        if(!modal) return;
        modal.setAttribute('aria-hidden','false');
        const ta = document.getElementById(`quoteText-${postId}`);
        if(ta) ta.focus();
    }

    window.closeQuoteModal = function(postId){
        const modal = document.getElementById(`quoteModal-${postId}`);
        if(!modal) return;
        modal.setAttribute('aria-hidden','true');
    }

    window.submitQuote = async function(postId){
        const ta = document.getElementById(`quoteText-${postId}`);
        const text = ta ? ta.value.trim() : '';
        try{
            const res = await fetch(`/api/posts/${postId}/repost/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() },
                body: JSON.stringify({ is_quote: true, quote_text: text })
            });
            const data = await res.json();
            if(data.success){
                closeQuoteModal(postId);
                if(window.showToast) showToast(data.message || 'Quoted', 'success');
            } else {
                console.error(data.error);
                if(window.showToast) showToast('Could not quote post', 'error');
            }
        }catch(e){ console.error(e); }
    }

    // Quote post - open a prompt/modal (simple prompt for now)
    window.quotePost = async function(postId){
        let text = null;
        if(window.showPrompt) {
            try { text = await window.showPrompt('Add your comment to quote this post:'); } catch(e){ text = null; }
        } else {
            text = prompt('Add your comment to quote this post:');
        }
        if(text === null) return; // cancelled
        try{
            const res = await fetch(`/api/posts/${postId}/repost/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() },
                body: JSON.stringify({ quote_text: text, is_quote: true })
            });
            const data = await res.json();
            if(data.success){ if(window.showToast) showToast('Quoted post successfully','success'); else console.log('Quoted post successfully'); } else { console.error(data.error); }
        }catch(e){ console.error(e); }
    }

    // Save post
    window.savePost = async function(postId){
        try{
            const res = await fetch(`/api/posts/${postId}/save/`, { method: 'POST', headers: { 'X-CSRFToken': getCSRF() } });
            const data = await res.json();
            if(data.success) { if(window.showToast) showToast('Saved','success'); else console.log('Saved'); } else console.error(data.error);
        }catch(e){ console.error(e); }
    }

    // Copy link
    window.copyPostLink = function(postId){
        const url = window.location.origin + `/post/${postId}/`;
        navigator.clipboard.writeText(url).then(()=>{
            if(window.showToast) showToast('Link copied to clipboard','success');
        }).catch(()=>{ if(window.showToast) showToast('Could not copy link','error'); });
    }

    // Report post
    window.openReportModal = function(postId){
        // simple prompt-based modal behavior for now
        const reason = prompt('Why are you reporting this post?');
        if(!reason) return;
        (async ()=>{
            try{
                const res = await fetch(`/api/report/`, {
                    method: 'POST',
                    headers: { 'Content-Type':'application/json', 'X-CSRFToken': getCSRF() },
                    body: JSON.stringify({ reported_post: postId, report_type: 'other', reason })
                });
                const data = await res.json();
                if(data.success) { if(window.showToast) showToast('Report submitted','success'); }
                else { if(window.showToast) showToast('Report failed','error'); console.error(data.error); }
            }catch(e){ console.error(e); if(window.showToast) showToast('Report error','error'); }
        })();
    }

    // Edit & Delete - simple handlers
    window.editPost = function(postId){
        window.location = `/post/${postId}/edit/`;
    }
    window.deletePost = async function(postId){
        openDeleteConfirm(postId);
    }

    function openDeleteConfirm(postId){
        const modal = document.getElementById(`deleteConfirmModal-${postId}`);
        if(!modal) return;
        modal.setAttribute('aria-hidden','false');
    }

    window.closeDeleteConfirm = function(postId){
        const modal = document.getElementById(`deleteConfirmModal-${postId}`);
        if(!modal) return;
        modal.setAttribute('aria-hidden','true');
    }

    window.confirmDeletePost = async function(postId){
        try{
            const res = await fetch(`/api/posts/${postId}/delete/`, { method: 'POST', headers: { 'X-CSRFToken': getCSRF() } });
            const data = await res.json();
            if(data.success) {
                const card = document.querySelector(`.post-card[data-post-id='${postId}']`);
                if(card) card.remove();
                if(window.showToast) showToast('Post deleted','success'); else console.log('Post deleted');
            } else {
                if(window.showToast) showToast('Delete failed','error'); else console.log('Delete failed');
            }
        }catch(e){ console.error(e); if(window.showToast) showToast('Delete error','error'); }
        closeDeleteConfirm(postId);
    }

    // Liked users modal
    window.openLikedUsers = async function(postId){
        const modal = document.getElementById(`likedUsersModal-${postId}`);
        const list = document.getElementById(`likedUsersList-${postId}`);
        if(!modal || !list) return;
        modal.setAttribute('aria-hidden','false');
        list.innerHTML = 'Loading...';
        try{
            const res = await fetch(`/api/posts/${postId}/liked-users/`);
            const data = await res.json();
            if(data.success){
                const users = data.liked_users || [];
                list.innerHTML = users.map(u=>`
                    <div class="liked-user-item">
                        <img src="${u.avatar || '/static/images/default-avatar.jpg'}" width="36" height="36" style="border-radius:50%;object-fit:cover;margin-right:8px;">
                        <strong>${u.username}</strong> <small style="color:#6b7280;margin-left:6px;">${u.name || ''}</small>
                    </div>
                `).join('') || '<div class="no-comments">No likes yet</div>';
            }else{ list.innerHTML = 'Error loading'; }
        }catch(e){ list.innerHTML = 'Error loading'; }
    }

    window.closeLikedUsers = function(postId){
        const modal = document.getElementById(`likedUsersModal-${postId}`);
        if(!modal) return;
        modal.setAttribute('aria-hidden','true');
    }

    // Share
    window.sharePost = function(postId){
        const url = window.location.origin + `/post/${postId}/`;
        if(navigator.share){
            navigator.share({ title: document.title, url }).catch(()=>{});
        } else {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,'_blank');
        }
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<"'`=\/]/g, function (s) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '`': '&#96;',
                '=': '&#61;',
                '/': '&#x2F;'
            })[s];
        });
    }

    // Comment action placeholders
    window.likeComment = async function(commentId){
        // TODO: implement endpoint `/api/comments/<id>/like/`
        console.log('likeComment', commentId);
        if(window.showToast) showToast('Comment liked','success');
    }

    window.replyComment = function(commentId, postId){
        console.log('replyComment', commentId, postId);
        const input = document.getElementById(`commentInput-${postId}`);
        if(input){ input.focus(); input.value = `@${commentId} `; }
    }

    window.editComment = function(commentId){
        console.log('editComment', commentId);
        window.showToast && showToast('Edit comment - not yet implemented','info');
    }

    window.deleteComment = async function(commentId, postId){
        if(!confirm('Delete this comment?')) return;
        try{
            const res = await fetch(`/api/comments/${commentId}/delete/`, { method: 'POST', headers: {'X-CSRFToken': getCSRF()} });
            const data = await res.json();
            if(data.success){
                const el = document.querySelector(`[data-comment-id="${commentId}"]`);
                if(el) el.remove();
                if(window.showToast) showToast('Comment deleted','success');
            }
        }catch(e){ console.error(e); if(window.showToast) showToast('Could not delete comment','error'); }
    }

    window.reportComment = function(commentId){
        if(window.showPrompt){
            window.showPrompt('Why are you reporting this comment?').then(reason=>{
                if(!reason) return; fetch('/api/report/', { method:'POST', headers: {'Content-Type':'application/json','X-CSRFToken': getCSRF()}, body: JSON.stringify({ reported_comment: commentId, reason }) });
                if(window.showToast) showToast('Report submitted','success');
            });
        } else {
            const reason = prompt('Why are you reporting this comment?');
            if(!reason) return; fetch('/api/report/', { method:'POST', headers: {'Content-Type':'application/json','X-CSRFToken': getCSRF()}, body: JSON.stringify({ reported_comment: commentId, reason }) });
            if(window.showToast) showToast('Report submitted','success');
        }
    }

})();
