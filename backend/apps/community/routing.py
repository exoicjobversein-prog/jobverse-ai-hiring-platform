from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/channel/(?P<channel_name>[\w-]+)/$', consumers.ChannelChatConsumer.as_asgi()),
    re_path(r'^ws/chat/dm/(?P<room_id>\d+)/$', consumers.DMChatConsumer.as_asgi()),
]
