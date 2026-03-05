from django.db import models
from django.conf import settings

class Workshop(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workshops_hosted')
    scheduled_at = models.DateTimeField()
    duration_hours = models.FloatField(default=1.0)
    meeting_link = models.URLField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    max_attendees = models.IntegerField(default=100)
    registrations = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='workshops_registered', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.host.username}"


class ChatMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages')
    room = models.CharField(max_length=100, default='general')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username} in #{self.room}: {self.message[:40]}"
