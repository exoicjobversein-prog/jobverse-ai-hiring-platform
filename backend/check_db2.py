import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.resumes.models import Resume
from apps.resumes.tasks import process_resume_base_evaluation

print("Latest Resumes:")
for r in Resume.objects.order_by('-id')[:5]:
    print(f"ID: {r.id}, is_processed: {r.is_processed}, final_ats_score: {r.final_ats_score}")

pending = Resume.objects.filter(is_processed=False).order_by('-id').first()
if pending:
    print(f"\nFound pending resume ID: {pending.id}")
    print("Executing standard base evaluation task...")
    try:
        res = process_resume_base_evaluation(pending.id)
        print("Task Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("\nNo pending resumes found.")
