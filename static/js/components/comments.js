import React, { useState } from 'react';
import './Comments.css';

const Comments = ({ postId, comments: initialComments }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const updateComment = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId 
            ? { ...comment, content: editedContent }
            : comment
        ));
        setEditingCommentId(null);
        setEditedContent('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setComments(comments.filter(comment => comment.id !== commentId));
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  return (
    <div className="comments-container">
      <div className="add-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="2"
        />
        <button onClick={addComment}>Comment</button>
      </div>

      {comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          <div className="comment-header">
            <span className="comment-user">{comment.user.name}</span>
            <span className="comment-time">{comment.createdAt}</span>
          </div>
          
          {editingCommentId === comment.id ? (
            <div className="comment-edit">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows="2"
              />
              <button onClick={() => updateComment(comment.id)}>Save</button>
              <button onClick={cancelEditing}>Cancel</button>
            </div>
          ) : (
            <div className="comment-content">
              <p>{comment.content}</p>
              {comment.isOwner && (
                <div className="comment-actions">
                  <button onClick={() => startEditing(comment)}>Edit</button>
                  <button onClick={() => deleteComment(comment.id)}>Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Comments;