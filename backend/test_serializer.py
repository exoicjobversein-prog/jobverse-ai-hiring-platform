import os
import django
import sys

# Setup Django
sys.path.append('c:\\Gautam\\Projects\\JobVerse\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.interviews.serializers import InterviewScheduleSerializer

data = {
    'application': 3,
    'interview_type': 'AI',
    'round_type': 'AI_SCREENING',
    'scheduled_date': '2026-03-18',
    'scheduled_time': '20:11',
    'meeting_link': '',
    'candidate': 1 # Assuming user exist, but actually it's provided in perform_create so it might fail for candidate too if it's required.
}

serializer = InterviewScheduleSerializer(data=data)
print("Is valid:", serializer.is_valid())
if not serializer.is_valid():
    print("Errors:", serializer.errors)
