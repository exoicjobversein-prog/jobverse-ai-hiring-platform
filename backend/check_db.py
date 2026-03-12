import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.resumes.models import Resume
from apps.resumes.tasks import process_resume_base_evaluation

resumes = Resume.objects.filter(is_processed=False)
for r in resumes:
    print(f"Manually processing resume {r.id}...")
    try:
        res = process_resume_base_evaluation(r.id)
        print("Result:", res)
    except Exception as e:
        print("Error processing:", e)
