# from transparency_service.app_server import transparency_app
from .middleware import auth_middleware
__all__ = ["auth_middleware"]
