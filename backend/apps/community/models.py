from django.db import models
from django.conf import settings


class Channel(models.Model):
    name = models.SlugField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_channels',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'#{self.name}'


class ChannelMember(models.Model):
    MEMBER_ROLE_CHOICES = (
        ('MEMBER', 'Member'),
        ('MODERATOR', 'Moderator'),
        ('ADMIN', 'Admin'),
    )
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channel_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=20, choices=MEMBER_ROLE_CHOICES, default='MEMBER')

    class Meta:
        unique_together = ('channel', 'user')

    def __str__(self):
        return f'{self.user} in #{self.channel.name}'


class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('link', 'Link'),
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='channel_messages',
    )
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.username} → #{self.channel.name}: {self.content[:40]}'


class DirectChatRoom(models.Model):
    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dm_rooms_as_user1',
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dm_rooms_as_user2',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f'DM: {self.user1.username} ↔ {self.user2.username}'

    @classmethod
    def get_or_create_room(cls, user_a, user_b):
        """Always store with lower-id user as user1 to prevent duplicates."""
        u1, u2 = (user_a, user_b) if user_a.id < user_b.id else (user_b, user_a)
        room, created = cls.objects.get_or_create(user1=u1, user2=u2)
        return room, created


class DirectMessage(models.Model):
    room = models.ForeignKey(DirectChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_dms',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'DM {self.sender.username}: {self.content[:40]}'


class OnlineStatus(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='online_status',
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = 'online' if self.is_online else 'offline'
        return f'{self.user.username} [{status}]'
