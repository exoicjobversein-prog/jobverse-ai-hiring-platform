import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChannelChatConsumer(AsyncWebsocketConsumer):
    """Handles real-time messaging for public/private channels."""

    async def connect(self):
        self.channel_name_slug = self.scope['url_route']['kwargs']['channel_name']
        self.user = self.scope.get('user')
        self.room_group_name = f'channel_{self.channel_name_slug}'

        # Reject anonymous connections
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Check channel exists
        self.channel_obj = await self.get_channel(self.channel_name_slug)
        if not self.channel_obj:
            await self.close(code=4004)
            return

        # Auto-join if not already a member (public channels)
        await self.ensure_member()

        # Set online
        await self.set_online(True)

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        
        # Join personal group for global signaling (like calls)
        self.personal_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.personal_group, self.channel_name)
        
        await self.accept()

        # Notify group that user came online
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_status',
            'user_id': self.user.id,
            'username': self.user.username,
            'is_online': True,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if hasattr(self, 'personal_group'):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)

        if self.user and self.user.is_authenticated:
            # Delay offline status to prevent race conditions when switching rooms
            disconnect_time = timezone.now()
            await asyncio.sleep(2)
            is_offline = await self.check_and_set_offline(disconnect_time)
            if is_offline:
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'user_status',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'is_online': False,
                })

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', 'chat_message')

        if msg_type == 'typing':
            # Broadcast typing indicator (not saved)
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': data.get('is_typing', False),
            })
            return

        if msg_type == 'call_signal':
            target_id = data.get('target_user_id')
            if target_id:
                await self.channel_layer.group_send(f'user_{target_id}', {
                    'type': 'call_signal',
                    'signal': data.get('signal'),
                    'sender_id': self.user.id,
                })
            return

        content = data.get('content', '').strip()
        if not content:
            return

        # Detect link type
        message_type = 'link' if content.startswith(('http://', 'https://')) else 'text'

        # Persist to DB
        msg = await self.save_message(content, message_type)

        # Broadcast to group
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'message': {
                'id': msg.id,
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.username,
                'sender_role': self.user.role,
                'content': content,
                'message_type': message_type,
                'created_at': msg.created_at.isoformat(),
                'channel': self.channel_obj.id,
            }
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            **event['message'],
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing'],
        }))

    async def user_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    async def call_signal(self, event):
        # Handle global call signals received on personal group
        await self.send(text_data=json.dumps({
            'type': 'call_signal',
            'signal': event['signal'],
            'sender_id': event['sender_id'],
        }))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_channel(self, slug):
        from .models import Channel
        try:
            return Channel.objects.get(name=slug)
        except Channel.DoesNotExist:
            return None

    @database_sync_to_async
    def ensure_member(self):
        from .models import ChannelMember
        if self.channel_obj.is_public:
            ChannelMember.objects.get_or_create(
                channel=self.channel_obj,
                user=self.user,
                defaults={'role': 'MEMBER'},
            )

    @database_sync_to_async
    def save_message(self, content, message_type):
        from .models import Message
        return Message.objects.create(
            sender=self.user,
            channel=self.channel_obj,
            content=content,
            message_type=message_type,
        )

    @database_sync_to_async
    def set_online(self, status):
        from .models import OnlineStatus
        obj, _ = OnlineStatus.objects.get_or_create(user=self.user)
        obj.is_online = status
        obj.save()

    @database_sync_to_async
    def check_and_set_offline(self, disconnect_time):
        from .models import OnlineStatus
        obj = OnlineStatus.objects.filter(user=self.user).first()
        if obj:
            # If last_seen is GREATER than disconnect_time, a new connection was made
            if obj.last_seen > disconnect_time:
                return False
            obj.is_online = False
            obj.save()
            return True
        return False


class DMChatConsumer(AsyncWebsocketConsumer):
    """Handles real-time DM between two users."""

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.user = self.scope.get('user')
        self.room_group_name = f'dm_{self.room_id}'

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Verify user belongs to this DM room
        valid = await self.is_room_member()
        if not valid:
            await self.close(code=4003)
            return

        await self.set_online(True)
        
        # Join DM room
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        
        # Join personal group
        self.personal_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.personal_group, self.channel_name)
        
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if hasattr(self, 'personal_group'):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
            
        if self.user and self.user.is_authenticated:
            disconnect_time = timezone.now()
            await asyncio.sleep(2)
            await self.check_and_set_offline(disconnect_time)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'typing':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': data.get('is_typing', False),
            })
            return

        if data.get('type') == 'call_signal':
            target_id = data.get('target_user_id')
            if not target_id:
                other_user = await self.get_room_other_user()
                if other_user:
                    target_id = other_user.id
            
            if target_id:
                await self.channel_layer.group_send(f'user_{target_id}', {
                    'type': 'call_signal',
                    'signal': data.get('signal'),
                    'sender_id': self.user.id,
                })
            return

        content = data.get('content', '').strip()
        if not content:
            return

        msg = await self.save_dm(content)

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'message': {
                'id': msg.id,
                'room': int(self.room_id),
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.username,
                'sender_role': self.user.role,
                'content': content,
                'created_at': msg.created_at.isoformat(),
            }
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            **event['message'],
        }))

    async def call_signal(self, event):
        await self.send(text_data=json.dumps({
            'type': 'call_signal',
            'signal': event['signal'],
            'sender_id': event['sender_id'],
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing'],
        }))

    @database_sync_to_async
    def is_room_member(self):
        from .models import DirectChatRoom
        try:
            room = DirectChatRoom.objects.get(id=self.room_id)
            return room.user1 == self.user or room.user2 == self.user
        except DirectChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def get_room_other_user(self):
        from .models import DirectChatRoom
        try:
            room = DirectChatRoom.objects.get(id=self.room_id)
            return room.user1 if room.user2 == self.user else room.user2
        except DirectChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_dm(self, content):
        from .models import DirectChatRoom, DirectMessage
        room = DirectChatRoom.objects.get(id=self.room_id)
        return DirectMessage.objects.create(room=room, sender=self.user, content=content)

    @database_sync_to_async
    def set_online(self, status):
        from .models import OnlineStatus
        obj, _ = OnlineStatus.objects.get_or_create(user=self.user)
        obj.is_online = status
        obj.save()

    @database_sync_to_async
    def check_and_set_offline(self, disconnect_time):
        from .models import OnlineStatus
        obj = OnlineStatus.objects.filter(user=self.user).first()
        if obj:
            if obj.last_seen > disconnect_time:
                return False
            obj.is_online = False
            obj.save()
            return True
        return False
