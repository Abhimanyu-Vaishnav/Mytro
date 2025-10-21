from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Import signals or other startup hooks here. Wrap in try/except
        # to avoid breaking import in environments where dependencies
        # for signals might not be available.
        try:
            import core.signals  # noqa: F401
        except Exception:
            pass
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        import core.signals




class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

def ready(self):
    import core.signals