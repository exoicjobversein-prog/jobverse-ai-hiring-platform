from rest_framework import serializers
from .models import Workshop, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class WorkshopSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)
    attendee_count = serializers.IntegerField(source='registrations.count', read_only=True)
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Workshop
        fields = ['id', 'title', 'description', 'host', 'host_name', 'scheduled_at',
                  'duration_hours', 'meeting_link', 'category', 'max_attendees',
                  'attendee_count', 'is_registered', 'created_at']
        read_only_fields = ['host', 'created_at']

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(id=request.user.id).exists()
        return False


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_photo = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'sender_photo', 'room', 'message', 'timestamp']
        read_only_fields = ['sender', 'timestamp']

    def get_sender_photo(self, obj):
        request = self.context.get('request')
        if obj.sender.profile_photo and request:
            return request.build_absolute_uri(obj.sender.profile_photo.url)
        return None
