from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from .models import User, PlacementProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('role', 'is_verified', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('JobVerse Fields', {
            'fields': ('role', 'company_name', 'is_verified', 'headline', 'location',
                       'years_of_experience', 'skills', 'designation'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')


@admin.action(description='✅ Verify selected placement profiles')
def verify_profiles(modeladmin, request, queryset):
    for profile in queryset:
        profile.verification_status = 'VERIFIED'
        profile.verified_at = timezone.now()
        profile.save()
        profile.user.is_verified = True
        profile.user.save(update_fields=['is_verified'])


@admin.action(description='❌ Reject selected placement profiles')
def reject_profiles(modeladmin, request, queryset):
    for profile in queryset:
        profile.verification_status = 'REJECTED'
        profile.save()
        profile.user.is_verified = False
        profile.user.save(update_fields=['is_verified'])


@admin.register(PlacementProfile)
class PlacementProfileAdmin(admin.ModelAdmin):
    list_display = (
        'college_name', 'officer_full_name', 'officer_contact',
        'verification_status', 'created_at', 'user'
    )
    list_filter = ('verification_status',)
    search_fields = ('college_name', 'officer_full_name', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'verified_at')
    actions = [verify_profiles, reject_profiles]
    fieldsets = (
        ('College Information', {
            'fields': ('college_name', 'college_email', 'college_location', 'university_affiliation'),
        }),
        ('Placement Officer', {
            'fields': ('officer_full_name', 'officer_designation', 'officer_contact'),
        }),
        ('Verification', {
            'fields': ('proof_document', 'verification_status', 'verified_at', 'rejection_reason'),
        }),
        ('Meta', {
            'fields': ('user', 'created_at', 'updated_at'),
        }),
    )
