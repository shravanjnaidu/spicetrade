"""
middleware/device_middleware.py
-------------------------------
Flask before_request hook that resolves the active device type
and writes it onto Flask's ``g`` context, making it available
to every route handler and Jinja2 template for the duration of
the request.

Usage in app.py
---------------
    from middleware.device_middleware import init_device_middleware
    init_device_middleware(app)

Template context
----------------
Templates can access ``device`` and ``view_override`` directly
because the ``inject_device`` context processor is also registered
here.  No extra work is needed inside individual route handlers.

    {# templates/base.html #}
    <body class="device-{{ device }}">
    {% if device == 'mobile' %}…{% endif %}
"""

from flask import g, request, current_app
from utils.device import get_device_type, VALID_VIEWS


def init_device_middleware(app):
    """Register device-detection hooks on *app*."""

    # ── 1. before_request: populate g ────────────────────────────────────────
    @app.before_request
    def _detect_device():
        """
        Sets:
          g.device        -> 'mobile' | 'desktop'
          g.view_override -> 'mobile' | 'desktop' | None
        """
        g.device = get_device_type(request)
        raw = request.args.get('view', '').lower().strip()
        g.view_override = raw if raw in VALID_VIEWS else None

    # ── 2. context_processor: expose to all Jinja2 templates ─────────────────
    @app.context_processor
    def _inject_device():
        """
        Make ``device`` and ``view_override`` available as template variables
        without requiring explicit ``render_template(..., device=g.device)``.
        """
        return {
            'device':        getattr(g, 'device', 'desktop'),
            'view_override': getattr(g, 'view_override', None),
        }
