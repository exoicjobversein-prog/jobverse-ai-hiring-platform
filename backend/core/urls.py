from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.users.views import DeleteAccountView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/jobs/', include('apps.jobs.urls')),
    path('api/resumes/', include('apps.resumes.urls')),
    path('api/interviews/', include('apps.interviews.urls')),
    path('api/community/', include('apps.workshops.urls')),
    path('api/chat/', include('apps.community.urls')),
    path('api/users/delete/', DeleteAccountView.as_view(), name='delete_account'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
