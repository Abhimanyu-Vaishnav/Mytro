from django.contrib.auth.models import User
from .models import Follow

def suggestions_context(request):
    """
    Context processor for user suggestions in the sidebar
    """
    context = {}
    
    try:
        if request.user.is_authenticated:
            # Get users that current user is following
            following_users = User.objects.filter(
                followers__follower=request.user
            )
            
            # Get random suggestions: users not followed by current user and not current user
            suggestions = User.objects.exclude(
                id__in=following_users.values_list('id', flat=True)
            ).exclude(id=request.user.id).order_by('?')[:5]
            
            context['suggestions'] = suggestions
        else:
            # For non-authenticated users, show random users
            context['suggestions'] = User.objects.all().order_by('?')[:5]
            
    except Exception as e:
        # If any error occurs, return empty suggestions
        print(f"Error in suggestions_context: {e}")
        context['suggestions'] = User.objects.none()
    
    return context