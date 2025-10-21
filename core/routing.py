from django.urls import re_path

try:
    from .consumers import FeedConsumer
    websocket_urlpatterns = [
        re_path(r'ws/feed/$', FeedConsumer.as_asgi()),
    ]
except Exception:
    websocket_urlpatterns = []
