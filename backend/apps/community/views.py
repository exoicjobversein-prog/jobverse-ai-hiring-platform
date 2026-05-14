from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Channel, ChannelMember, Message, DirectChatRoom, DirectMessage, OnlineStatus
from .serializers import (
    ChannelSerializer, ChannelMemberSerializer, MessageSerializer,
    DirectChatRoomSerializer, DirectMessageSerializer, OnlineStatusSerializer,
    UserBriefSerializer,
)

User = get_user_model()


# ── Channel views ─────────────────────────────────────────────────────────────

class ChannelListCreateView(generics.ListCreateAPIView):
    """List all public channels / create a new channel."""
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Channel.objects.filter(is_public=True)

    def perform_create(self, serializer):
        channel = serializer.save(created_by=self.request.user)
        # Creator auto-joins as admin
        ChannelMember.objects.create(channel=channel, user=self.request.user, role='ADMIN')


class ChannelDetailView(generics.RetrieveAPIView):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]


class JoinChannelView(APIView):
    """POST /api/chat/channels/<id>/join/ — join or leave a channel."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        channel = get_object_or_404(Channel, pk=pk, is_public=True)
        member, created = ChannelMember.objects.get_or_create(
            channel=channel,
            user=request.user,
            defaults={'role': 'MEMBER'},
        )
        if not created:
            # Already a member — leave
            member.delete()
            return Response({'status': 'left'})
        return Response({'status': 'joined'})


class ChannelMembersView(generics.ListAPIView):
    serializer_class = ChannelMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        channel_id = self.kwargs['pk']
        return ChannelMember.objects.filter(channel_id=channel_id).select_related('user')


# ── Message views ─────────────────────────────────────────────────────────────

class ChannelMessageListView(generics.ListAPIView):
    """GET /api/chat/channels/<id>/messages/ — last 50 messages."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        channel_id = self.kwargs['pk']
        return (
            Message.objects
            .filter(channel_id=channel_id, is_deleted=False)
            .select_related('sender')
            .order_by('-created_at')[:50]
        )

    def list(self, request, *args, **kwargs):
        qs = list(self.get_queryset())
        qs.reverse()  # Return chronological order
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ── Direct Chat views ─────────────────────────────────────────────────────────

class DirectChatRoomListCreateView(APIView):
    """
    GET  — list all DM rooms for the current user
    POST — create or retrieve a DM room with another user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rooms = DirectChatRoom.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related('user1', 'user2').order_by('-created_at')
        return Response(DirectChatRoomSerializer(rooms, many=True, context={'request': request}).data)

    def post(self, request):
        other_id = request.data.get('user_id')
        if not other_id:
            return Response({'error': 'user_id required'}, status=400)
        try:
            other_user = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        if other_user == request.user:
            return Response({'error': 'Cannot DM yourself'}, status=400)

        room, created = DirectChatRoom.get_or_create_room(request.user, other_user)
        return Response(
            DirectChatRoomSerializer(room, context={'request': request}).data,
            status=201 if created else 200,
        )


class DirectMessageListView(generics.ListAPIView):
    """GET /api/chat/rooms/<id>/messages/ — last 50 DMs."""
    serializer_class = DirectMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['pk']
        room = get_object_or_404(
            DirectChatRoom,
            Q(pk=room_id),
            Q(user1=self.request.user) | Q(user2=self.request.user),
        )
        return (
            DirectMessage.objects
            .filter(room=room)
            .select_related('sender')
            .order_by('-created_at')[:50]
        )

    def list(self, request, *args, **kwargs):
        qs = list(self.get_queryset())
        qs.reverse()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ── Online Status & User List ─────────────────────────────────────────────────

class OnlineUsersView(APIView):
    """GET /api/chat/users/online/ — users currently online."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Q
        
        # Update current user's last_seen unconditionally since they are actively polling
        OnlineStatus.objects.update_or_create(user=request.user, defaults={'is_online': True})
        
        # Consider online if is_online=True OR last_seen is within the last 20 seconds
        cutoff = timezone.now() - timedelta(seconds=20)
        statuses = OnlineStatus.objects.filter(
            Q(is_online=True) | Q(last_seen__gte=cutoff)
        ).select_related('user')
        
        return Response(OnlineStatusSerializer(statuses, many=True, context={'request': request}).data)


class UserListView(APIView):
    """GET /api/chat/users/ — all users (for DM discovery), filterable by role."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        qs = User.objects.exclude(id=request.user.id).order_by('first_name', 'username')
        if role:
            qs = qs.filter(role__iexact=role)
        return Response(UserBriefSerializer(qs, many=True, context={'request': request}).data)
