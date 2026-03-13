import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("ALTER TABLE interviews_aptitudetestresult ADD COLUMN detailed_responses jsonb DEFAULT '[]'::jsonb NOT NULL;")
        print("Successfully added detailed_responses")
except Exception as e:
    print("Error:", e)

try:
    with connection.cursor() as cursor:
        cursor.execute("ALTER TABLE interviews_aptitudetestresult ADD COLUMN domain_scores jsonb DEFAULT '{}'::jsonb NOT NULL;")
        print("Successfully added domain_scores")
except Exception as e:
    print("Error:", e)
