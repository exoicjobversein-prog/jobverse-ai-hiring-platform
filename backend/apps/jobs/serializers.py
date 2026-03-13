from rest_framework import serializers
from .models import Job, Application


class JobSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    applicant_username = serializers.CharField(source='user.username', read_only=True)
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.CharField(source='user.email', read_only=True)
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = '__all__'
        # Note: 'status' is NOT read_only so HR can PATCH it
        read_only_fields = ('user', 'created_at')

    def get_applicant_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.username

    def get_resume_url(self, obj):
        if obj.resume and obj.resume.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.file.url)
            return obj.resume.file.url
        return None
