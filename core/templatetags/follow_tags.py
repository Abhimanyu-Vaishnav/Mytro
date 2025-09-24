from django import template
from core.models import Follow

register = template.Library()

@register.filter
def user_is_followed(user, current_user):
    if not current_user.is_authenticated:
        return False
    return Follow.objects.filter(follower=current_user, following=user).exists()


@register.filter
def initial(value):
    if value and len(value) > 0:
        return value[0].upper()
    return ''
