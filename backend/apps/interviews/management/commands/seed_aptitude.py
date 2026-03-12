import json
from django.core.management.base import BaseCommand
from apps.interviews.models import AptitudeQuestion
import google.generativeai as genai
from django.conf import settings
import time

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

class Command(BaseCommand):
    help = 'Seeds the database with 400 Aptitude Practice questions using Gemini AI'

    def handle(self, *args, **kwargs):
        categories = ['APTITUDE', 'LOGICAL', 'COMMUNICATION', 'DOMAIN']
        target_per_category = 100
        
        for category in categories:
            current_count = AptitudeQuestion.objects.filter(category=category).count()
            if current_count >= target_per_category:
                self.stdout.write(self.style.SUCCESS(f"{category} already has {current_count} questions. Skipping."))
                continue
                
            needed = target_per_category - current_count
            self.stdout.write(f"Generating {needed} questions for {category}...")
            
            # Since Gemini might struggle generating 100 perfectly formatted JSON objects at once,
            # we batch them in chunks of 20
            chunks = needed // 20
            remainder = needed % 20
            batches = [20] * chunks + ([remainder] if remainder else [])
            
            for batch_size in batches:
                prompt_details = self.get_prompt_details(category)
                prompt = (
                    f"Generate exactly {batch_size} multiple-choice questions for the domain of '{prompt_details}'.\n"
                    f"Ensure the difficulty is varied (EASY, MEDIUM, HARD). "
                    f"Return the response ONLY as a raw JSON array of objects. Do NOT use markdown code blocks (e.g. ```json). "
                    f"Structure each object exactly like this:\n"
                    f"{{\n"
                    f"  \"question_text\": \"The question itself\",\n"
                    f"  \"option_a\": \"Option A text\",\n"
                    f"  \"option_b\": \"Option B text\",\n"
                    f"  \"option_c\": \"Option C text\",\n"
                    f"  \"option_d\": \"Option D text\",\n"
                    f"  \"correct_option\": \"A\", // Can only be A, B, C, or D\n"
                    f"  \"explanation\": \"Step-by-step logic on how to solve this\",\n"
                    f"  \"difficulty\": \"MEDIUM\" // Can only be EASY, MEDIUM, or HARD\n"
                    f"}}\n"
                    f"Ensure the questions are challenging, diverse, and well-written."
                )
                
                try:
                    self.stdout.write(f"  Fetching {batch_size} from Gemini...")
                    response = model.generate_content(prompt)
                    
                    # Clean the response text to extract just the JSON
                    response_text = response.text.strip()
                    if response_text.startswith('```json'):
                        response_text = response_text[7:]
                    if response_text.startswith('```'):
                        response_text = response_text[3:]
                    if response_text.endswith('```'):
                        response_text = response_text[:-3]
                    
                    response_text = response_text.strip()
                    
                    try:
                        questions_data = json.loads(response_text)
                    except json.JSONDecodeError as e:
                        self.stdout.write(self.style.ERROR(f"  JSON Decode Error. Raw response:\n{response_text}"))
                        continue
                    
                    for q in questions_data:
                        AptitudeQuestion.objects.create(
                            category=category,
                            difficulty=q.get('difficulty', 'MEDIUM'),
                            question_text=q.get('question_text', ''),
                            option_a=q.get('option_a', ''),
                            option_b=q.get('option_b', ''),
                            option_c=q.get('option_c', ''),
                            option_d=q.get('option_d', ''),
                            correct_option=q.get('correct_option', 'A'),
                            explanation=q.get('explanation', '')
                        )
                    
                    self.stdout.write(self.style.SUCCESS(f"  Successfully inserted {len(questions_data)} {category} questions."))
                    time.sleep(2) # Prevent rate limiting
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  Error generating batch: {type(e).__name__} - {str(e)}"))
                    
        self.stdout.write(self.style.SUCCESS("Database seeding complete!"))

    def get_prompt_details(self, category):
        if category == 'APTITUDE':
            return "Quantitative Aptitude (time & work, percentages, profit & loss, probability, speed & distance, ratios)"
        elif category == 'LOGICAL':
            return "Logical Reasoning (patterns, series, puzzles, coding-decoding, syllogisms, blood relations)"
        elif category == 'COMMUNICATION':
            return "Communication Skills (grammar, sentence correction, vocabulary, synonyms, antonyms, reading comprehension style questions)"
        elif category == 'DOMAIN':
            return "Domain-Based Computer Science (programming, DSA, OS, DBMS, Computer Networks, Software Engineering)"
        return category
