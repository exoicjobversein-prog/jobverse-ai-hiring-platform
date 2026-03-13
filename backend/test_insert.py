import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.interviews.models import AptitudeTestResult
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()
user = User.objects.first()

try:
    result = AptitudeTestResult.objects.create(
        user=user,
        category="FULL_TEST",
        score=3,
        total_questions=3,
        time_taken_seconds=11,
        domain_scores={},
        detailed_responses=[],
        fullscreen_violations=1
    )
    print("Success:", result.id)
except IntegrityError as e:
    print("INTEGRITY ERROR:", str(e))
except Exception as e:
    print("OTHER ERROR:", str(e))
