import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from apps.community.middleware import JWTAuthMiddlewareStack
import apps.proctoring.routing
import apps.community.routing

# Merge all WebSocket URL patterns
all_websocket_patterns = (
    apps.proctoring.routing.websocket_urlpatterns +
    apps.community.routing.websocket_urlpatterns
)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(all_websocket_patterns)
    ),
})
