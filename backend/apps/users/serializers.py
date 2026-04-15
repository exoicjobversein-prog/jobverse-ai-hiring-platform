from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PlacementProfile

User = get_user_model()

# Personal email domains to block for PLACEMENT_ADMIN signups
PERSONAL_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'yahoo.in', 'rediffmail.com', 'icloud.com', 'live.com',
    'aol.com', 'protonmail.com',
}

# Accepted institutional domain suffixes for college email
INSTITUTIONAL_SUFFIXES = ('.edu', '.ac.in', '.edu.in')


class UserSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'company_name', 'profile_photo', 'profile_photo_url',
            'headline', 'location', 'years_of_experience', 'skills',
            'education', 'certifications', 'projects',
            'linkedin_url', 'github_url', 'designation', 'is_verified'
        )
        extra_kwargs = {'profile_photo': {'write_only': True, 'required': False}}

    def get_profile_photo_url(self, obj):
        request = self.context.get('request')
        if obj.profile_photo and request:
            return request.build_absolute_uri(obj.profile_photo.url)
        return None


class PlacementProfileSerializer(serializers.ModelSerializer):
    proof_document_url = serializers.SerializerMethodField()

    class Meta:
        model = PlacementProfile
        fields = (
            'id', 'college_name', 'college_email', 'college_location',
            'university_affiliation', 'officer_full_name', 'officer_designation',
            'officer_contact', 'proof_document', 'proof_document_url',
            'verification_status', 'verified_at', 'rejection_reason',
            'created_at', 'updated_at',
        )
        read_only_fields = ('verification_status', 'verified_at', 'rejection_reason', 'created_at', 'updated_at')
        extra_kwargs = {'proof_document': {'write_only': True, 'required': True}}

    def get_proof_document_url(self, obj):
        request = self.context.get('request')
        if obj.proof_document and request:
            return request.build_absolute_uri(obj.proof_document.url)
        return None


class RegisterSerializer(serializers.ModelSerializer):
    # ── Placement-only fields (write-only, not on the User model) ──────────
    college_name = serializers.CharField(write_only=True, required=False)
    college_email = serializers.EmailField(write_only=True, required=False)
    college_location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    university_affiliation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    officer_full_name = serializers.CharField(write_only=True, required=False)
    officer_designation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    officer_contact = serializers.CharField(write_only=True, required=False)
    proof_document = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'role',
            'company_name', 'first_name', 'last_name',
            # placement extras
            'college_name', 'college_email', 'college_location',
            'university_affiliation', 'officer_full_name', 'officer_designation',
            'officer_contact', 'proof_document',
        )
        extra_kwargs = {'password': {'write_only': True}}

    # ── Cross-field validation ─────────────────────────────────────────────
    def validate(self, data):
        role = data.get('role', 'STUDENT')

        if role == 'PLACEMENT_ADMIN':
            # Required placement fields
            required = {
                'college_name': 'College name is required.',
                'college_email': 'Official college email is required.',
                'officer_full_name': 'Officer full name is required.',
                'officer_contact': 'Officer contact number is required.',
                'proof_document': 'Proof document upload is required.',
            }
            for field, msg in required.items():
                if not data.get(field):
                    raise serializers.ValidationError({field: msg})

            # Validate college email domain
            college_email = data.get('college_email', '')
            domain = college_email.split('@')[-1].lower() if '@' in college_email else ''
            if not any(domain.endswith(suf) for suf in INSTITUTIONAL_SUFFIXES):
                raise serializers.ValidationError({
                    'college_email': (
                        'College email must be from an institutional domain '
                        '(e.g. @college.ac.in or @university.edu).'
                    )
                })

            # Reject personal email for the account email
            account_email = data.get('email', '')
            if account_email:
                acc_domain = account_email.split('@')[-1].lower() if '@' in account_email else ''
                if acc_domain in PERSONAL_EMAIL_DOMAINS:
                    raise serializers.ValidationError({
                        'email': (
                            'Please use your official institutional email address for account registration, '
                            'not a personal email (Gmail, Yahoo, etc.).'
                        )
                    })

        return data

    # ── Object creation ────────────────────────────────────────────────────
    def create(self, validated_data):
        # Pop placement extras before creating User
        placement_fields = {
            'college_name': validated_data.pop('college_name', None),
            'college_email': validated_data.pop('college_email', None),
            'college_location': validated_data.pop('college_location', None),
            'university_affiliation': validated_data.pop('university_affiliation', None),
            'officer_full_name': validated_data.pop('officer_full_name', None),
            'officer_designation': validated_data.pop('officer_designation', None),
            'officer_contact': validated_data.pop('officer_contact', None),
            'proof_document': validated_data.pop('proof_document', None),
        }

        role = validated_data.get('role', 'STUDENT')
        is_verified = role != 'PLACEMENT_ADMIN'  # Placement admins need manual verification

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            company_name=validated_data.get('company_name', ''),
            is_verified=is_verified,
        )

        # Create PlacementProfile for PLACEMENT_ADMIN role
        if role == 'PLACEMENT_ADMIN' and placement_fields.get('college_name'):
            PlacementProfile.objects.create(
                user=user,
                college_name=placement_fields['college_name'],
                college_email=placement_fields['college_email'],
                college_location=placement_fields.get('college_location') or '',
                university_affiliation=placement_fields.get('university_affiliation') or '',
                officer_full_name=placement_fields['officer_full_name'],
                officer_designation=placement_fields.get('officer_designation') or '',
                officer_contact=placement_fields['officer_contact'],
                proof_document=placement_fields['proof_document'],
                verification_status='PENDING',
            )

        return user
