
from django import template
register = template.Library()


@register.simple_tag
def is_liked(post, user):
    """Return True if `user` has liked `post`.

    Usage in template:
        {% is_liked post request.user as liked %}
        {% if liked %} ... {% endif %}
    """
    try:
        if not user or user.is_anonymous:
            return False
        return post.likes.filter(user_id=user.id).exists()
    except Exception:
        return False

@register.filter(name='is_liked_by')
def is_liked_by(comment, user):
    """
    Check if a comment is liked by a given user.
    Usage: {{ comment|is_liked_by:request.user }}
    """
    if not user or user.is_anonymous:
        return False
    try:
        # Assuming Comment model has a 'likes' ManyToManyField to User through a Like model
        return comment.likes.filter(user=user).exists()
    except Exception:
        return False
