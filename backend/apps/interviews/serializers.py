from rest_framework import serializers
from .models import Interview, Question, Attempt, PracticeInterview, PracticeAttempt, AptitudeQuestion, AptitudeTestResult, InterviewSchedule, InterviewAttempt


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'order', 'created_at']


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = ['id', 'interview', 'question', 'answer', 'score', 'feedback', 'timestamp']
        read_only_fields = ['score', 'feedback']


class InterviewScheduleSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.username', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    company_name = serializers.CharField(source='application.job.company', read_only=True, default='')
    meeting_link = serializers.URLField(allow_blank=True, allow_null=True, required=False)

    class Meta:
        model = InterviewSchedule
        fields = '__all__'
        read_only_fields = ['candidate', 'final_score', 'strengths', 'weaknesses', 'recommendation']


class InterviewAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAttempt
        fields = '__all__'
        read_only_fields = ['score', 'feedback']


class InterviewSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    attempts = AttemptSerializer(many=True, read_only=True)

    class Meta:
        model = Interview
        fields = ['id', 'application', 'scheduled_at', 'started_at', 'completed_at',
                  'status', 'final_score', 'overall_feedback', 'questions', 'attempts']


class PracticeAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeAttempt
        fields = ['id', 'question_text', 'answer', 'score', 'feedback', 'order', 'timestamp']
        read_only_fields = ['score', 'feedback']


class PracticeInterviewSerializer(serializers.ModelSerializer):
    attempts = PracticeAttemptSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeInterview
        fields = ['id', 'topic', 'started_at', 'completed_at', 'final_score', 'is_completed', 'attempts', 'conversation_history']


class AptitudeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeQuestion
        fields = ['id', 'category', 'difficulty', 'question_text', 'option_a', 'option_b',
                  'option_c', 'option_d', 'correct_option', 'explanation']


class AptitudeTestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeTestResult
        fields = ['id', 'category', 'score', 'total_questions', 'time_taken_seconds', 'domain_scores', 'detailed_responses', 'completed_at']
        read_only_fields = ['completed_at']
