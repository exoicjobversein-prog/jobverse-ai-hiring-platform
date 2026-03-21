from rest_framework import serializers
from .models import Channel, ChannelMember, Message, DirectChatRoom, DirectMessage, OnlineStatus
from django.conf import settings


# Minimal user representation
class UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    profile_photo = serializers.SerializerMethodField()

    def get_profile_photo(self, obj):
        request = self.context.get('request')
        if obj.profile_photo:
            url = obj.profile_photo.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = ['id', 'name', 'display_name', 'description', 'is_public',
                  'created_by', 'created_at', 'member_count', 'is_member']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user).exists()
        return False


class ChannelMemberSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)

    class Meta:
        model = ChannelMember
        fields = ['id', 'user', 'role', 'joined_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_photo = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender_id', 'sender_name', 'sender_role', 'sender_photo',
                  'channel', 'content', 'message_type', 'created_at', 'is_deleted']
        read_only_fields = ['id', 'sender_id', 'sender_name', 'sender_role',
                            'sender_photo', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_sender_photo(self, obj):
        request = self.context.get('request')
        if obj.sender.profile_photo:
            url = obj.sender.profile_photo.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class DirectChatRoomSerializer(serializers.ModelSerializer):
    user1 = UserBriefSerializer(read_only=True)
    user2 = UserBriefSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = DirectChatRoom
        fields = ['id', 'user1', 'user2', 'other_user', 'created_at', 'last_message']

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.user2 if obj.user1 == request.user else obj.user1
            return UserBriefSerializer(other, context=self.context).data
        return None

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {'content': msg.content, 'created_at': msg.created_at}
        return None


class DirectMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'room', 'sender_id', 'sender_name', 'sender_role',
                  'content', 'created_at']
        read_only_fields = ['id', 'room', 'sender_id', 'sender_name',
                            'sender_role', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username


class OnlineStatusSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)

    class Meta:
        model = OnlineStatus
        fields = ['user', 'is_online', 'last_seen']
