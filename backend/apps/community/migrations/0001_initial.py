# Generated migration — full community app schema

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Channel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.SlugField(max_length=100, unique=True)),
                ('display_name', models.CharField(max_length=100, default='')),
                ('description', models.TextField(blank=True, default='')),
                ('is_public', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_channels',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='ChannelMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('role', models.CharField(
                    choices=[('MEMBER', 'Member'), ('MODERATOR', 'Moderator'), ('ADMIN', 'Admin')],
                    default='MEMBER',
                    max_length=20,
                )),
                ('channel', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='members',
                    to='community.channel',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='channel_memberships',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'unique_together': {('channel', 'user')}},
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('message_type', models.CharField(
                    choices=[('text', 'Text'), ('image', 'Image'), ('file', 'File'), ('link', 'Link')],
                    default='text',
                    max_length=10,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('channel', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='community.channel',
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='channel_messages',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['created_at']},
        ),
        migrations.CreateModel(
            name='DirectChatRoom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user1', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='dm_rooms_as_user1',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('user2', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='dm_rooms_as_user2',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'unique_together': {('user1', 'user2')}},
        ),
        migrations.CreateModel(
            name='DirectMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('room', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='community.directchatroom',
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sent_dms',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['created_at']},
        ),
        migrations.CreateModel(
            name='OnlineStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_online', models.BooleanField(default=False)),
                ('last_seen', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='online_status',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
