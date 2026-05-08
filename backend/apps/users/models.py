from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('HR', 'HR'),
        ('PROFESSIONAL', 'Professional'),
        ('ALUMNI', 'Alumni'),
        ('ADMIN', 'Admin'),
        ('PLACEMENT_ADMIN', 'Placement Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    company_name = models.CharField(max_length=255, blank=True, null=True, help_text="Relevant for HR and Professional role")
    college_name = models.CharField(max_length=255, blank=True, null=True, help_text="Relevant for Student role")

    # Verification flag — HR and Placement Admins start as unverified
    is_verified = models.BooleanField(
        default=True,
        help_text="Set to False for HR/PLACEMENT_ADMIN until manually verified by staff"
    )

    # Professional Profile Fields
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    headline = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.IntegerField(default=0)
    skills = models.JSONField(default=list, blank=True)
    education = models.TextField(blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    projects = models.TextField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    designation = models.CharField(max_length=255, blank=True, null=True, help_text="Relevant for Professional role")

    def __str__(self):
        return f"{self.username} - {self.role}"


class PlacementProfile(models.Model):
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='placement_profile'
    )

    # College Information
    college_name = models.CharField(max_length=255)
    college_email = models.EmailField(help_text="Must be an institutional email (.edu / .ac.in)", blank=True, null=True)
    college_location = models.CharField(max_length=255, blank=True, null=True, help_text="City, State")
    university_affiliation = models.CharField(max_length=255, blank=True, null=True)

    # Placement Officer Details
    officer_full_name = models.CharField(max_length=255, blank=True, null=True)
    officer_designation = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="e.g. Training & Placement Officer"
    )
    officer_contact = models.CharField(max_length=20)

    # Verification
    proof_document = models.FileField(
        upload_to='placement_proofs/',
        help_text="ID Card / Appointment Letter / Authorization Letter"
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    verified_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.college_name} — {self.user.username} ({self.verification_status})"


class HRProfile(models.Model):
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )
    HIRING_TYPE_CHOICES = (
        ('INTERNSHIP', 'Internship'),
        ('FULLTIME', 'Full-time'),
        ('BOTH', 'Both'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='hr_profile'
    )

    # Company Details
    company_website = models.URLField(blank=True, null=True, help_text="Company website or LinkedIn URL")
    company_location = models.CharField(max_length=255, blank=True, null=True, help_text="City, State, Country")

    # Recruiter Details
    recruiter_full_name = models.CharField(max_length=255)
    recruiter_designation = models.CharField(max_length=255)
    recruiter_contact = models.CharField(max_length=20)

    # Hiring Preferences
    roles_hiring_for = models.JSONField(default=list, blank=True, help_text="List of roles being hired")
    preferred_skills = models.JSONField(default=list, blank=True)
    eligible_branches = models.JSONField(default=list, blank=True)
    minimum_cgpa = models.DecimalField(
        max_digits=3, decimal_places=1, blank=True, null=True,
        help_text="Minimum CGPA requirement (e.g. 6.5)"
    )
    hiring_type = models.CharField(
        max_length=20,
        choices=HIRING_TYPE_CHOICES,
        default='BOTH'
    )

    # Verification
    proof_document = models.FileField(
        upload_to='hr_proofs/',
        help_text="Company ID / Authorization Letter / Offer Letter"
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    verified_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.company_name or self.user.username} — {self.recruiter_full_name} ({self.verification_status})"
