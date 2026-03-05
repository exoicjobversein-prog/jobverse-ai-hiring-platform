from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class DeleteAccountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
