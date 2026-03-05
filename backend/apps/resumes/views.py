from rest_framework import viewsets, permissions
from .models import Resume
from .serializers import ResumeSerializer

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'HR' or user.role == 'ADMIN':
            return Resume.objects.all()
        # Students only see their own
        return Resume.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
