from django.core.management.base import BaseCommand
from apps.community.models import Channel


DEFAULT_CHANNELS = [
    {'name': 'general', 'display_name': 'General', 'description': 'General discussion for everyone'},
    {'name': 'dsa', 'display_name': 'DSA', 'description': 'Data structures & algorithms practice'},
    {'name': 'jobs', 'display_name': 'Jobs', 'description': 'Job opportunities and referrals'},
    {'name': 'interviews', 'display_name': 'Interviews', 'description': 'Interview tips, tricks & experiences'},
    {'name': 'alumni', 'display_name': 'Alumni Connect', 'description': 'Connect with alumni and professionals'},
]


class Command(BaseCommand):
    help = 'Seed default community channels'

    def handle(self, *args, **options):
        created_count = 0
        for ch in DEFAULT_CHANNELS:
            _, created = Channel.objects.get_or_create(
                name=ch['name'],
                defaults={
                    'display_name': ch['display_name'],
                    'description': ch['description'],
                    'is_public': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created #{ch["name"]}'))
            else:
                self.stdout.write(f'  #{ch["name"]} already exists')

        self.stdout.write(self.style.SUCCESS(f'\nDone. {created_count} channel(s) created.'))
