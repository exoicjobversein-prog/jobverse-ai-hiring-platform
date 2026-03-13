import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE interviews_aptitudetestresult ADD COLUMN fullscreen_violations integer DEFAULT 0 NOT NULL;")
        print("Successfully added fullscreen_violations column.")
    except Exception as e:
        print("Error or already exists:", e)
