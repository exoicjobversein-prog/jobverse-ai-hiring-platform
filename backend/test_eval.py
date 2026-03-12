import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.resumes.models import Resume
from apps.resumes.tasks import process_resume_base_evaluation

print("Testing Resume Base Evaluation directly...")
# Get the most recent resume
r = Resume.objects.order_by('-id').first()

if r:
    print(f"Testing on Resume ID: {r.id}")
    r.is_processed = False
    r.save()
    
    try:
        res = process_resume_base_evaluation(r.id)
        # Refresh from DB
        r.refresh_from_db()
        print(f"Final Score in DB: {r.final_ats_score}")
        print(f"Strengths: {r.strengths}")
        print(f"Suggestions: {r.suggestions}")
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("No resumes found to test.")
