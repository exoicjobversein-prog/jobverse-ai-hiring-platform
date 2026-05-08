from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, PlacementProfileSerializer
from .models import PlacementProfile

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    # Accept multipart for file uploads (proof document) and JSON for other roles
    parser_classes = (MultiPartParser, FormParser, JSONParser)


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class PlacementProfileView(generics.RetrieveAPIView):
    """Read-only view for a verified Placement Admin to see their own profile/status."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = PlacementProfileSerializer

    def get_object(self):
        try:
            return self.request.user.placement_profile
        except PlacementProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("No placement profile found for this user.")

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class CollegeStudentsListView(generics.ListAPIView):
    """Returns a list of STUDENT role users who belong to the same college as the Placement Admin."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role != 'PLACEMENT_ADMIN':
            return User.objects.none()
        
        # Match students who selected the exact same college_name
        return User.objects.filter(role='STUDENT', college_name=user.college_name)


class DeleteAccountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

