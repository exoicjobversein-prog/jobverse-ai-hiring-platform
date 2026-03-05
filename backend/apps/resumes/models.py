from django.db import models
from django.conf import settings

class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # AI Evaluation results
    technical_score = models.IntegerField(null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True, null=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Resume for {self.user.username}"
