"""
JWT WebSocket Auth Middleware
Reads ?token=<jwt> from the WebSocket URL query string and populates scope["user"].
"""
import urllib.parse
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    try:
        UntypedToken(token_str)
        from rest_framework_simplejwt.backends import TokenBackend
        from django.conf import settings

        data = TokenBackend(
            algorithm='HS256',
            signing_key=settings.SECRET_KEY,
        ).decode(token_str, verify=True)

        user_id = data.get('user_id')
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist, Exception):
        return AnonymousUser()


class JWTAuthMiddleware:
    """Authenticates WebSocket connections using JWT token in query string."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = urllib.parse.parse_qs(query_string)
        token_list = params.get('token', [])

        if token_list:
            scope['user'] = await get_user_from_token(token_list[0])
        else:
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
