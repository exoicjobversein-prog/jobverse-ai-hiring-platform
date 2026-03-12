from django.core.management.base import BaseCommand
from apps.interviews.models import AptitudeQuestion

class Command(BaseCommand):
    help = 'Seeds the database with mock Aptitude Practice questions locally (no API)'

    def handle(self, *args, **kwargs):
        categories = ['APTITUDE', 'LOGICAL', 'COMMUNICATION', 'DOMAIN']
        target_per_category = 20
        
        for category in categories:
            current_count = AptitudeQuestion.objects.filter(category=category).count()
            if current_count >= target_per_category:
                self.stdout.write(self.style.SUCCESS(f"{category} already has {current_count} questions."))
                continue
                
            needed = target_per_category - current_count
            self.stdout.write(f"Generating {needed} local mock questions for {category}...")
            
            for i in range(needed):
                q_text = f"Sample {category} Question #{i+1}: What is the correct answer?"
                
                if category == 'APTITUDE':
                    q_text = f"If train A leaves at {i}:00 and travels at 60mph, when will it reach station B?"
                elif category == 'LOGICAL':
                    q_text = f"What comes next in the series: {i}, {i*2}, {i*4}, ...?"
                elif category == 'COMMUNICATION':
                    q_text = f"Choose the correct synonym for 'Rapid' in context {i}:"
                elif category == 'DOMAIN':
                    q_text = f"What is the time complexity of algorithm {i} in the worst case?"

                AptitudeQuestion.objects.create(
                    category=category,
                    difficulty='MEDIUM' if i % 2 == 0 else 'HARD',
                    question_text=q_text,
                    option_a=f"Option A for q{i}",
                    option_b=f"Option B for q{i} (Correct)",
                    option_c=f"Option C for q{i}",
                    option_d=f"Option D for q{i}",
                    correct_option="B",
                    explanation=f"The correct answer is B because this is a mock explanation for question {i} in {category}."
                )
                    
            self.stdout.write(self.style.SUCCESS(f"  Successfully inserted {needed} {category} questions."))
                    
        self.stdout.write(self.style.SUCCESS("Database mock seeding complete!"))
