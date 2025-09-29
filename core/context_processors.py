from django.contrib.auth import get_user_model

def suggestions_context(request):
    if request.user.is_authenticated:
        User = get_user_model()
        try:
            # Get users that current user is not following
            suggestions = User.objects.exclude(
                id=request.user.id
            ).exclude(
                profile__followers=request.user
            )[:5]
            return {'suggestions': suggestions}
        except Exception as e:
            print(f"Error in suggestions_context: {e}")
            return {'suggestions': []}
    return {'suggestions': []}