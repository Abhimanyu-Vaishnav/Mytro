from django.urls import path
from django.contrib.auth import views as auth_views

from mytro import settings
from . import views
from django.conf.urls.static import static

urlpatterns = [
    path("", views.feed_view, name="feed"),
    path('signup/', views.signup_view, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='core/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    # Apne profile ka URL (logged-in user ke liye)
    path('profile/edit/', views.edit_profile_view, name='edit_profile'),
    path('profile/', views.my_profile_view, name='my_profile'),
    # Kisi dusre user ka profile URL (username parameter ke sath)
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('post/new/', views.post_create_view, name='post_create'),
    path('post/<int:post_id>/like/', views.like_post, name='like_post'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('post/<int:post_id>/edit/', views.edit_post, name='edit_post'),
]

urlpatterns += [
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
    path('unfollow/<str:username>/', views.unfollow_user, name='unfollow_user'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)