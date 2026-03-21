from django.contrib import admin
from .models import Channel, ChannelMember, Message, DirectChatRoom, DirectMessage, OnlineStatus


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name', 'is_public', 'created_by', 'created_at')
    prepopulated_fields = {'name': ('display_name',)}


@admin.register(ChannelMember)
class ChannelMemberAdmin(admin.ModelAdmin):
    list_display = ('channel', 'user', 'role', 'joined_at')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'channel', 'message_type', 'created_at', 'is_deleted')
    list_filter = ('channel', 'message_type', 'is_deleted')


@admin.register(DirectChatRoom)
class DirectChatRoomAdmin(admin.ModelAdmin):
    list_display = ('user1', 'user2', 'created_at')


@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display = ('room', 'sender', 'created_at')


@admin.register(OnlineStatus)
class OnlineStatusAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_online', 'last_seen')
