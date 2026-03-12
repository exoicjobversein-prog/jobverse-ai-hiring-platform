import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.interviews.models import AptitudeQuestion

questions = [
    {
        "category": "APTITUDE",
        "difficulty": "EASY",
        "question_text": "If 5 machines can make 5 widgets in 5 minutes, how long will it take 100 machines to make 100 widgets?",
        "option_a": "5 minutes",
        "option_b": "100 minutes",
        "option_c": "1 minute",
        "option_d": "25 minutes",
        "correct_option": "A",
        "explanation": "Each machine takes 5 minutes to make 1 widget. Therefore, 100 machines will make 100 widgets in 5 minutes."
    },
    {
        "category": "APTITUDE",
        "difficulty": "MEDIUM",
        "question_text": "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
        "option_a": "120 metres",
        "option_b": "180 metres",
        "option_c": "324 metres",
        "option_d": "150 metres",
        "correct_option": "D",
        "explanation": "Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length = Speed * Time = (50/3) * 9 = 150 metres."
    },
    {
        "category": "LOGICAL",
        "difficulty": "MEDIUM",
        "question_text": "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?",
        "option_a": "(1/3)",
        "option_b": "(1/8)",
        "option_c": "(2/8)",
        "option_d": "(1/16)",
        "correct_option": "B",
        "explanation": "This is a simple division series; each number is one-half of the previous number."
    },
    {
        "category": "LOGICAL",
        "difficulty": "HARD",
        "question_text": "SCD, TEF, UGH, ____, WKL",
        "option_a": "CMN",
        "option_b": "UJI",
        "option_c": "VIJ",
        "option_d": "IJT",
        "correct_option": "C",
        "explanation": "The first letters follow alphabetical order: S, T, U, V, W. The second and third letters are consecutive alphabetic pairs: CD, EF, GH, IJ, KL."
    },
    {
        "category": "COMMUNICATION",
        "difficulty": "EASY",
        "question_text": "Choose the most appropriate synonym for the word: 'METICULOUS'",
        "option_a": "Careless",
        "option_b": "Sloppy",
        "option_c": "Painstaking",
        "option_d": "Ignorant",
        "correct_option": "C",
        "explanation": "Meticulous means showing great attention to detail; very careful and precise. Painstaking is the closest synonym."
    },
    {
        "category": "COMMUNICATION",
        "difficulty": "MEDIUM",
        "question_text": "Select the correctly spelt word.",
        "option_a": "Accomodation",
        "option_b": "Accommodation",
        "option_c": "Acommodation",
        "option_d": "Acomodation",
        "correct_option": "B",
        "explanation": "The correct spelling is 'Accommodation' with double 'c' and double 'm'."
    },
    {
        "category": "DOMAIN",
        "difficulty": "EASY",
        "question_text": "Which data structure uses LIFO (Last In First Out)?",
        "option_a": "Queue",
        "option_b": "Stack",
        "option_c": "Linked List",
        "option_d": "Tree",
        "correct_option": "B",
        "explanation": "A Stack works on the Last In First Out (LIFO) principle where the last element added is the first one removed."
    },
    {
        "category": "DOMAIN",
        "difficulty": "MEDIUM",
        "question_text": "What is the time complexity of binary search in an array of size n?",
        "option_a": "O(n)",
        "option_b": "O(n log n)",
        "option_c": "O(log n)",
        "option_d": "O(1)",
        "correct_option": "C",
        "explanation": "Binary search halves the search space in each step, resulting in logarithmic time complexity, O(log n)."
    }
]

print("Clearing existing questions...")
AptitudeQuestion.objects.all().delete()

print("Seeding robust test questions...")
for q in questions:
    AptitudeQuestion.objects.create(**q)

print(f"Successfully seeded {AptitudeQuestion.objects.count()} questions!")
