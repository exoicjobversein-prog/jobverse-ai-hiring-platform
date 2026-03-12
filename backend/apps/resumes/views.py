import threading
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Resume
from .serializers import ResumeSerializer
from .tasks import process_resume_base_evaluation, process_job_matching


def run_in_background(fn, *args, **kwargs):
    """Runs a function in a background daemon thread, bypassing Celery/Redis."""
    t = threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True)
    t.start()


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'HR' or user.role == 'ADMIN':
            return Resume.objects.all()
        return Resume.objects.filter(user=user)

    def perform_create(self, serializer):
        resume = serializer.save(user=self.request.user)
        # Run evaluation in a background thread after the DB transaction commits
        # This avoids requiring a running Redis/Celery broker
        transaction.on_commit(
            lambda: run_in_background(process_resume_base_evaluation, resume.id)
        )

    @action(detail=True, methods=['post'])
    def match_job(self, request, pk=None):
        """Triggers background job description matching for an existing resume."""
        resume = self.get_object()
        job_description = request.data.get('job_description')

        if not job_description:
            return Response(
                {"error": "job_description is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Run in background thread instead of Celery
        run_in_background(process_job_matching, resume.id, job_description)

        return Response({
            "message": "Job matching analysis started.",
            "resume_id": resume.id
        }, status=status.HTTP_202_ACCEPTED)
