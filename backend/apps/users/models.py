from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('HR', 'HR'),
        ('PROFESSIONAL', 'Professional'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    company_name = models.CharField(max_length=255, blank=True, null=True, help_text="Relevant for HR and Professional role")
    
    # Professional Profile Fields
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    headline = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.IntegerField(default=0)
    skills = models.JSONField(default=list, blank=True)
    education = models.TextField(blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    projects = models.TextField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    designation = models.CharField(max_length=255, blank=True, null=True, help_text="Relevant for Professional role")
    
    def __str__(self):
        return f"{self.username} - {self.role}"
