from django.db import models
from django.conf import settings

# ─── FORMAL AI INTERVIEWS ────────────────────────────────────────────────────

class Interview(models.Model):
    application = models.OneToOneField('jobs.Application', on_delete=models.CASCADE, related_name='interview')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('SCHEDULED', 'Scheduled'),
            ('IN_PROGRESS', 'In Progress'),
            ('COMPLETED', 'Completed'),
            ('CANCELLED', 'Cancelled'),
        ],
        default='SCHEDULED'
    )
    final_score = models.IntegerField(null=True, blank=True)
    overall_feedback = models.TextField(blank=True, null=True)
    conversation_history = models.JSONField(default=list, blank=True)  # Stores prior Q&A for context

    def __str__(self):
        return f"Interview for {self.application}"


class Question(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Q{self.order} for {self.interview}"


class Attempt(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='attempts')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='attempts')
    answer = models.TextField()
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attempt by {self.interview.application.user} on {self.question}"


# ─── PRACTICE AI INTERVIEWS ────────────────────────────────────────────────────

class PracticeInterview(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_interviews')
    topic = models.CharField(max_length=255, blank=True, default='General')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    final_score = models.IntegerField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    conversation_history = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Practice by {self.user.username} on {self.topic}"


class PracticeAttempt(models.Model):
    practice = models.ForeignKey(PracticeInterview, on_delete=models.CASCADE, related_name='attempts')
    question_text = models.TextField()
    answer = models.TextField()
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=1)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PracticeAttempt {self.order} for {self.practice}"


# ─── APTITUDE TESTS ────────────────────────────────────────────────────────────

class AptitudeQuestion(models.Model):
    CATEGORY_CHOICES = [
        ('LOGICAL', 'Logical Reasoning'),
        ('QUANTITATIVE', 'Quantitative Aptitude'),
        ('DATA', 'Data Interpretation'),
    ]
    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='LOGICAL')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='MEDIUM')
    question_text = models.TextField()
    option_a = models.CharField(max_length=512)
    option_b = models.CharField(max_length=512)
    option_c = models.CharField(max_length=512)
    option_d = models.CharField(max_length=512)
    correct_option = models.CharField(max_length=1, choices=[('A','A'),('B','B'),('C','C'),('D','D')])
    explanation = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"[{self.category}] {self.question_text[:60]}"


class AptitudeTestResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aptitude_results')
    category = models.CharField(max_length=20, default='LOGICAL')
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    time_taken_seconds = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.category}: {self.score}/{self.total_questions}"


# ─── NEW AI INTERVIEW SYSTEM MODELS (V2) ────────────────────────────────────

class InterviewSchedule(models.Model):
    INTERVIEW_TYPE_CHOICES = (
        ('AI', 'AI Interview'),
        ('LIVE', 'Live Interview'),
    )
    ROUND_TYPE_CHOICES = (
        ('TECHNICAL', 'Technical Round'),
        ('AI_SCREENING', 'AI Screening'),
        ('FINAL', 'Final Round'),
    )
    STATUS_CHOICES = (
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Missed', 'Missed'),
    )

    application = models.ForeignKey('jobs.Application', on_delete=models.CASCADE, related_name='schedules')
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interview_schedules')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES, default='AI')
    round_type = models.CharField(max_length=20, choices=ROUND_TYPE_CHOICES, default='AI_SCREENING')
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    meeting_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Store the final report info
    final_score = models.IntegerField(null=True, blank=True)
    strengths = models.TextField(blank=True, null=True)
    weaknesses = models.TextField(blank=True, null=True)
    recommendation = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.interview_type} for {self.candidate.username} - {self.status}"


class InterviewAttempt(models.Model):
    interview = models.ForeignKey(InterviewSchedule, on_delete=models.CASCADE, related_name='attempt_records')
    question = models.TextField()
    answer = models.TextField()
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attempt by {self.interview.candidate.username}"
