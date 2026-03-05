from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ResumeViewSet

# Use SimpleRouter (not DefaultRouter) — DefaultRouter adds an API root view at ""
# which intercepts POST /api/resumes/ before it reaches the viewset list action.
router = SimpleRouter()
router.register(r'', ResumeViewSet, basename='resume')

urlpatterns = [
    path('', include(router.urls)),
]
