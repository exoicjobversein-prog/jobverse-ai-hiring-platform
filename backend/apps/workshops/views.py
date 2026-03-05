from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from .models import Workshop, ChatMessage
from .serializers import WorkshopSerializer, ChatMessageSerializer


class WorkshopViewSet(viewsets.ModelViewSet):
    queryset = Workshop.objects.all().order_by('-scheduled_at')
    serializer_class = WorkshopSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['title', 'category']

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}

    @action(detail=True, methods=['post'], url_path='register')
    def register(self, request, pk=None):
        workshop = self.get_object()
        if workshop.registrations.filter(id=request.user.id).exists():
            return Response({'detail': 'Already registered.'}, status=400)
        workshop.registrations.add(request.user)
        return Response({'detail': 'Registered successfully!'}, status=200)

    @action(detail=True, methods=['post'], url_path='unregister')
    def unregister(self, request, pk=None):
        workshop = self.get_object()
        workshop.registrations.remove(request.user)
        return Response({'detail': 'Unregistered.'}, status=200)


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        room = self.request.query_params.get('room', 'general')
        return ChatMessage.objects.filter(room=room).order_by('timestamp')[:100]

    def perform_create(self, serializer):
        room = self.request.data.get('room', 'general')
        serializer.save(sender=self.request.user, room=room)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}
