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
    # Apne profile ka URL (logged-in user ke liye)
    path('profile/edit/', views.edit_profile_view, name='edit_profile'),
    path('profile/', views.my_profile_view, name='my_profile'),
    # Kisi dusre user ka profile URL (username parameter ke sath)
    path('profile/<str:username>/', views.profile_view, name='profile'),
    path('post/new/', views.post_create_view, name='post_create'),
    # path('post/<int:post_id>/like/', views.like_post, name='like_post'),
    # path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    # path('post/<int:post_id>/edit/', views.edit_post, name='edit_post'),
    path("select2/", include("django_select2.urls")),
    # path('comment/<int:pk>/edit/', views.edit_comment, name='edit_comment'),
    path('api/edit_post/<int:pk>/', views.edit_post, name='edit_post'),
    path('api/edit_comment/<int:pk>/', views.edit_comment, name='edit_comment'),
    path('api/add_comment/', views.add_comment, name='add_comment'),
    path('api/like_post/<int:pk>/', views.like_post, name='like_post'),
    path('api/upload_post_photo/', views.upload_post_photo, name='upload_post_photo'),
    path('api/upload_comment_photo/', views.upload_comment_photo, name='upload_comment_photo'),
    path('api/like_comment/<int:pk>/', views.like_comment, name='like_comment'),

]

urlpatterns += [
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
    path('unfollow/<str:username>/', views.unfollow_user, name='unfollow_user'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)