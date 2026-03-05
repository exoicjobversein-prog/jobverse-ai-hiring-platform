from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'company_name', 'profile_photo', 'profile_photo_url',
            'headline', 'location', 'years_of_experience', 'skills',
            'education', 'certifications', 'projects',
            'linkedin_url', 'github_url', 'designation'
        )
        extra_kwargs = {'profile_photo': {'write_only': True, 'required': False}}

    def get_profile_photo_url(self, obj):
        request = self.context.get('request')
        if obj.profile_photo and request:
            return request.build_absolute_uri(obj.profile_photo.url)
        return None


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role',
                  'company_name', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'STUDENT'),
            company_name=validated_data.get('company_name', '')
        )
        return user
