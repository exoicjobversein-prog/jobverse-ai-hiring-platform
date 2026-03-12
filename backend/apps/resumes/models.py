from django.db import models
from django.conf import settings

class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')  # Uses local filesystem storage
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # AI Evaluation results
    technical_score = models.IntegerField(null=True, blank=True)  # Legacy field
    initial_ats_score = models.IntegerField(null=True, blank=True) # Base score calculated by rules
    final_ats_score = models.IntegerField(null=True, blank=True)   # Evaluated by Gemini
    job_match_score = models.IntegerField(null=True, blank=True)   # Score specifically for a JD
    
    skills = models.JSONField(default=list, blank=True)            # Found skills
    missing_skills = models.JSONField(default=list, blank=True)    # Missing skills based on JD
    strengths = models.JSONField(default=list, blank=True)         # Gemini strengths
    weaknesses = models.JSONField(default=list, blank=True)        # Gemini weaknesses
    suggestions = models.JSONField(default=list, blank=True)       # Gemini suggestions
    
    summary = models.TextField(blank=True, null=True)             # Generic text summary
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Resume for {self.user.username}"
