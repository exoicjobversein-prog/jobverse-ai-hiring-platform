import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
import google.generativeai as genai
from django.conf import settings
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

prompt = '''Generate exactly 2 multiple-choice questions for Quantitative Aptitude.
Ensure the difficulty is varied (EASY, MEDIUM, HARD). 
Return the response ONLY as a raw JSON array of objects. Do NOT use markdown code blocks (e.g. ```json). 
Structure each object exactly like this:
{
  "question_text": "The question itself",
  "option_a": "Option A text",
  "option_b": "Option B text",
  "option_c": "Option C text",
  "option_d": "Option D text",
  "correct_option": "A", // Can only be A, B, C, or D
  "explanation": "Step-by-step logic on how to solve this",
  "difficulty": "MEDIUM" // Can only be EASY, MEDIUM, or HARD
}
Ensure the questions are challenging, diverse, and well-written.'''

response = model.generate_content(prompt)
print(response.text)
