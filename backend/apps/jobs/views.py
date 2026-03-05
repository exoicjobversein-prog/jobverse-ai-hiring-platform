from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-created_at')
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    @action(detail=True, methods=['post'], url_path='apply')
    def apply_to_job(self, request, pk=None):
        job = self.get_object()
        user = request.user
        
        # Check if they have already applied
        if Application.objects.filter(job=job, user=user).exists():
            return Response({'detail': 'You have already applied to this job.'}, status=400)
            
        resume_id = request.data.get('resume_id')
        
        application = Application.objects.create(
            job=job,
            user=user,
            resume_id=resume_id
        )
        
        # Send Application Confirmation Email
        from django.core.mail import send_mail
        from django.conf import settings
        subject = 'Application Received - JobVerse'
        body = f"Hello {user.first_name},\n\nWe have received your application for the {job.title} position.\n\nThank you,\nJobVerse Team"
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        except Exception as e:
            print(f"Apply Job Email Error: {e}")
        
        return Response(ApplicationSerializer(application).data, status=201)

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'HR' or user.role == 'ADMIN':
            # HR sees all applications for jobs they created
            return Application.objects.filter(job__created_by=user)
        
        # Students see only their own
        return Application.objects.filter(user=user)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        application = serializer.save()
        
        if old_status != application.status and application.status == 'SHORTLISTED':
            from django.core.mail import send_mail
            from django.conf import settings
            subject = 'You Have Been Shortlisted - JobVerse'
            body = f"Hello {application.user.first_name},\n\nYou have been shortlisted for the {application.job.title} position. HR will review and schedule an interview soon.\n\nBest,\nJobVerse Team"
            try:
                send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [application.user.email], fail_silently=False)
            except Exception as e:
                print(f"Shortlist Email Error: {e}")
