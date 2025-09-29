from django.urls import include, path
from django.contrib.auth import views as auth_views

from mytro import settings
from . import views
from django.conf.urls.static import static

urlpatterns = [
    path("", views.feed_view, name="feed"),
    path('signup/', views.signup_view, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='core/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    
    # Profile URLs
    path('profile/edit/', views.edit_profile_view, name='edit_profile'),
    path('profile/', views.my_profile_view, name='my_profile'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
    
    # Post URLs
    path('post/new/', views.post_create_view, name='post_create'),
    path('create_post/', views.create_post, name='create_post'),  # ADD THIS LINE
    
    # API endpoints
    path("select2/", include("django_select2.urls")),
    path('api/edit_post/<int:pk>/', views.edit_post, name='edit_post'),
    path('api/edit_comment/<int:pk>/', views.edit_comment, name='edit_comment'),
    path('api/add_comment/', views.add_comment, name='add_comment'),
    path('api/like_post/<int:pk>/', views.like_post, name='like_post'),
    path('api/upload_post_photo/', views.upload_post_photo, name='upload_post_photo'),
    path('api/upload_comment_photo/', views.upload_comment_photo, name='upload_comment_photo'),
    path('api/like_comment/<int:pk>/', views.like_comment, name='like_comment'),
    
    # Follow/Unfollow
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
    path('unfollow/<str:username>/', views.unfollow_user, name='unfollow_user'),
    
    # NEW API ENDPOINTS FOR THE MODERN FEED
    path('api/repost/<int:post_id>/', views.repost_post, name='repost'),
    path('api/delete_post/<int:post_id>/', views.delete_post, name='delete_post'),
    path('api/remove_post_image/<int:post_id>/', views.remove_post_image, name='remove_post_image'),
    path('api/delete_comment/<int:comment_id>/', views.delete_comment, name='delete_comment'),
    path('api/follow/<int:user_id>/', views.follow_user_api, name='follow_user_api'),
    path('api/suggested_users/', views.suggested_users, name='suggested_users'),
    path('api/pin_post/<int:post_id>/', views.pin_post, name='pin_post'),
    path('api/comments/<int:post_id>/', views.get_comments, name='get_comments'),
    path('api/load_more_posts/', views.load_more_posts, name='load_more_posts'),
    path('profile/', views.profile, name='profile'),
    path('profile/<str:username>/', views.profile, name='user_profile'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)