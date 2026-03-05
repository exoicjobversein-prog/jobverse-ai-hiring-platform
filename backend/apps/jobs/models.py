from django.db import models
from django.conf import settings

class Job(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField()
    
    # Filtering fields
    experience = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., 2-4 years")
    location = models.CharField(max_length=255, blank=True, null=True)
    salary = models.CharField(max_length=255, blank=True, null=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    technology_stack = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs_created')

    def __str__(self):
        return self.title


class Application(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('REVIEWED', 'Under Review'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEWING', 'Interviewing'),
        ('REJECTED', 'Rejected'),
        ('ACCEPTED', 'Accepted'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    # Resume will be added in the resumes app to avoid circular imports, 
    # but we can also store the ID, or use generic foreign key.
    # To keep it simple, we will link it to the resume app.
    resume = models.ForeignKey('resumes.Resume', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job') # A user can only apply once to a job

    def __str__(self):
        return f"{self.user} -> {self.job} ({self.status})"
