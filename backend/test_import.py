import sys
import django
import os
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

try:
    from apps.interviews.urls import *
    print("Success!")
except Exception as e:
    with open("err.txt", "w") as f:
        traceback.print_exc(file=f)
