from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (InterviewViewSet, AttemptViewSet,
                    PracticeInterviewViewSet, AptitudeQuestionViewSet, AptitudeTestResultViewSet,
                    InterviewScheduleViewSet, InterviewAttemptViewSet, ProctoringViolationViewSet)

router = DefaultRouter()
router.register(r'schedules', InterviewScheduleViewSet, basename='schedule')
router.register(r'interview-attempts', InterviewAttemptViewSet, basename='interview-attempt')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'attempts', AttemptViewSet, basename='attempt')
router.register(r'practice', PracticeInterviewViewSet, basename='practice')
router.register(r'aptitude/questions', AptitudeQuestionViewSet, basename='aptitude-question')
router.register(r'aptitude/results', AptitudeTestResultViewSet, basename='aptitude-result')
router.register(r'proctoring/violation', ProctoringViolationViewSet, basename='proctoring-violation')

urlpatterns = [
    path('', include(router.urls)),
]
