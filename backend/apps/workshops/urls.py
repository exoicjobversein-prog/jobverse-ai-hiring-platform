from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkshopViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'workshops', WorkshopViewSet, basename='workshop')
router.register(r'chat', ChatMessageViewSet, basename='chat')

urlpatterns = [
    path('', include(router.urls)),
]
