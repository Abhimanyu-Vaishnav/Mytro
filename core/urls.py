from django.urls import include, path
from django.contrib.auth import views as auth_views
from mytro import settings
from . import views
from django.conf.urls.static import static

urlpatterns = [
    # ==================== AUTHENTICATION ====================
    path("signup/", views.signup_view, name="signup"),
    path("login/", auth_views.LoginView.as_view(template_name="core/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),

    # ==================== MAIN PAGES ====================
    path("", views.feed_view, name="feed"),
    path("home/", views.home_view, name="home"),
    path("messages/", views.messages_view, name="messages"),

    # ==================== PROFILE URLs ====================
    path("profile/", views.my_profile_view, name="my_profile"),
    path("profile/<str:username>/", views.profile_view, name="profile"),
    path("edit_profile/", views.edit_profile_view, name="edit_profile"),
    path("edit_profile_modern/", views.edit_profile_modern_view, name="edit_profile_modern"),

    # ==================== POST URLs ====================
    path("post/new/", views.create_post_view, name="post_create"),
    path("post/<int:post_id>/", views.post_detail, name="post_detail"),
    path("post/<int:post_id>/edit/", views.edit_post, name="edit_post"),

    # ==================== WORKING API ENDPOINTS ====================
    # Posts
    path("api/posts/", views.post_list_api, name="post_list_api"),
    path("api/posts/create/", views.create_post_view, name="create_post_api"),
    path("api/posts/<int:post_id>/like/", views.like_post, name="like_post"),
    path("api/posts/<int:post_id>/like-status/", views.get_post_like_status, name="get_post_like_status"),
    path("api/posts/like-status/", views.get_posts_like_status, name="get_posts_like_status"),
    path("api/posts/<int:post_id>/repost/", views.repost_post, name="repost_post"),
    path("api/posts/<int:post_id>/delete/", views.delete_post, name="delete_post"),
    path("api/posts/<int:post_id>/liked-users/", views.get_liked_users, name="get_liked_users"),
    path("api/posts/<int:post_id>/pin/", views.pin_post, name="pin_post"),
    path("api/posts/<int:post_id>/save/", views.save_post, name="save_post"),
    
    # Comments
    path("api/comments/add/", views.add_comment, name="add_comment"),
    path("api/comments/<int:post_id>/", views.get_comments, name="get_comments"),
    path("api/comments/<int:comment_id>/edit/", views.edit_comment, name="edit_comment"),
    path("api/comments/<int:comment_id>/delete/", views.delete_comment, name="delete_comment_api"),
    path("api/comments/<int:comment_id>/like/", views.like_comment, name="like_comment"),
    path("api/comments/<int:comment_id>/reply/", views.reply_comment, name="reply_comment"),
    
    # Follow
    path("api/follow/<int:user_id>/", views.follow_user, name="follow_user_api"),
    path("api/suggested-users/", views.suggested_users, name="suggested_users"),
    
    # Profile API
    path("api/profile/update-pic/", views.update_profile_pic, name="update_profile_pic"),
    path("api/profile/remove-pic/", views.remove_profile_pic, name="remove_profile_pic"),
    path("api/profile/update-cover/", views.update_cover_pic, name="update_cover_pic"),
    path("api/profile/remove-cover/", views.remove_cover_pic, name="remove_cover_pic"),
    path("api/profile/update-info/", views.update_profile_info, name="update_profile_info"),
    path("api/profile/completion/", views.check_profile_completion, name="check_profile_completion"),
    path("api/followers/<str:username>/", views.get_followers, name="get_followers"),
    path("api/following/<str:username>/", views.get_following, name="get_following"),
    
    # Search & Load More
    path("api/load-more-posts/", views.load_more_posts, name="load_more_posts"),
    
    # Notifications
    path("api/notifications/", views.notifications_api, name="get_notifications"),
    path("api/notifications/count/", views.unread_notification_count, name="notification_count"),
    path("api/notifications/unread-count/", views.unread_notification_count, name="unread_notification_count"),
    path("api/notifications/<int:notification_id>/read/", views.mark_notification_read, name="mark_notification_read"),
    path("api/notifications/mark-all-read/", views.mark_all_notifications_read, name="mark_all_notifications_read"),
    
    # Messages
    path("api/conversations/", views.get_conversations, name="get_conversations"),
    path("api/conversations/<int:conversation_id>/messages/", views.get_messages, name="get_messages"),
    path("api/messages/send/", views.send_message, name="send_message"),
    path("api/search-users/", views.search_users, name="search_users"),
    path("api/start-conversation/", views.start_conversation, name="start_conversation"),
    
    # Stories
    path("api/stories/", views.get_stories, name="get_stories"),
    path("api/stories/create/", views.create_story, name="create_story"),
    path("api/stories/<int:story_id>/", views.get_story_detail, name="get_story_detail"),
    path("api/stories/user/<int:user_id>/", views.get_user_stories, name="get_user_stories"),
    path("api/stories/<int:story_id>/delete/", views.delete_story, name="delete_story"),
    
    # Polls
    path("api/posts/<int:post_id>/vote/", views.vote_poll, name="vote_poll"),
    
    # Online Users
    path("api/online-users/", views.get_online_users, name="get_online_users"),
    path("api/trending-hashtags/", views.get_trending_hashtags, name="get_trending_hashtags"),

    # ==================== MEDIA & UPLOADS ====================
    path("api/upload-post-photo/", views.upload_post_photo, name="upload_post_photo"),
    path("api/remove-post-image/<int:post_id>/", views.remove_post_image, name="remove_post_image"),

    # ==================== MODERATION ====================
    path("api/report/", views.report_content, name="report_content"),

    # ==================== THIRD-PARTY ====================
    path("select2/", include("django_select2.urls")),

    # ==================== DEBUG & TESTING ====================
    path("debug/urls/", views.debug_urls, name="debug_urls"),
    path("debug/test/", views.url_test, name="url_test"),
]

# Legacy URLs for backward compatibility (your frontend is using these)
legacy_urls = [
    path("create_post/", views.create_post_view, name="create_post"),
    path("follow/<str:username>/", views.follow_user_legacy, name="follow_user"),
    path("unfollow/<str:username>/", views.unfollow_user_legacy, name="unfollow_user"),
    path("api/like_post/<int:post_id>/", views.like_post, name="like_post_legacy"),  # Frontend is using this
    path("api/post/<int:post_id>/like_status/", views.get_post_like_status, name="get_post_like_status_legacy"),  # For refreshing like states
    path("api/notifications/unread_count/", views.unread_notification_count, name="unread_notification_count_legacy"),  # Frontend is using this
]

urlpatterns += legacy_urls

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)