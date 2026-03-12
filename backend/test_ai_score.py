import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.ai_service import evaluate_resume_base
import google.generativeai as genai

# temporarily overwrite model
import services.ai_service as ai
ai.model = genai.GenerativeModel('gemini-flash-latest')

sample_resume = """
John Doe
Software Engineer
Experience: 5 years in Python, Django, React.
Education: BS in Computer Science.
Skills: Python, JavaScript, SQL.
"""

print("Running AI Evaluation...")
result = ai.evaluate_resume_base(sample_resume, 50)
print(result)
