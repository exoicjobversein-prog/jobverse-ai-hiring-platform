from django.db import models

class ViolationLog(models.Model):
    VIOLATION_TYPES = (
        ('TAB_SWITCH', 'Tab Switch/Blur'),
        ('COPY_PASTE', 'Copy / Paste detected'),
        ('NO_FACE', 'No Face Detected (if applicable)'),
    )
    interview = models.ForeignKey('interviews.InterviewSchedule', on_delete=models.CASCADE, related_name='violations')
    violation_type = models.CharField(max_length=50, choices=VIOLATION_TYPES)
    description = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.violation_type} at {self.timestamp} for {self.interview}"
