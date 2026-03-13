import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE interviews_aptitudetestresult DROP COLUMN flagged_for_fullscreen_exit;")
        print("Dropped flagged_for_fullscreen_exit")
    except Exception as e:
        print("Error:", e)
