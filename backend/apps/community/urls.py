from django.urls import path
from . import views

urlpatterns = [
    # Channels
    path('channels/', views.ChannelListCreateView.as_view(), name='channel-list-create'),
    path('channels/<int:pk>/', views.ChannelDetailView.as_view(), name='channel-detail'),
    path('channels/<int:pk>/join/', views.JoinChannelView.as_view(), name='channel-join'),
    path('channels/<int:pk>/members/', views.ChannelMembersView.as_view(), name='channel-members'),
    path('channels/<int:pk>/messages/', views.ChannelMessageListView.as_view(), name='channel-messages'),

    # Direct messages
    path('rooms/', views.DirectChatRoomListCreateView.as_view(), name='dm-room-list-create'),
    path('rooms/<int:pk>/messages/', views.DirectMessageListView.as_view(), name='dm-messages'),

    # Users
    path('users/', views.UserListView.as_view(), name='chat-user-list'),
    path('users/online/', views.OnlineUsersView.as_view(), name='online-users'),
]
