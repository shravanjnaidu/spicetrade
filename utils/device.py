"""
utils/device.py
---------------
Server-side device detection from the HTTP User-Agent header.

Priority order for resolving the active view:
  1. ?view=mobile|desktop  query parameter  (per-request override)
  2. 'view' cookie          (persistent browser preference set by JS)
  3. User-Agent sniffing    (automatic fallback)
"""

import re

# ── Compiled patterns ─────────────────────────────────────────────────────────

# Matches dedicated mobile handsets (excludes tablets so they get desktop layout)
_MOBILE_RE = re.compile(
    r'(android(?!.*tablet)'       # Android phones (not Android tablets)
    r'|webos'
    r'|iphone'
    r'|ipod'
    r'|blackberry'
    r'|windows\s+phone'
    r'|iemobile'
    r'|opera\s+mini'
    r'|(?<!\w)mobile(?!\w))',     # generic "Mobile" token
    re.IGNORECASE,
)

VALID_VIEWS = frozenset({'mobile', 'desktop'})

# ── Public helpers ────────────────────────────────────────────────────────────

def detect_device(user_agent: str) -> str:
    """
    Return ``'mobile'`` or ``'desktop'`` by inspecting *user_agent*.
    Tablets default to ``'desktop'`` so they receive the richer layout.
    """
    if not user_agent:
        return 'desktop'
    return 'mobile' if _MOBILE_RE.search(user_agent) else 'desktop'


def get_device_type(request) -> str:
    """
    Resolve the active device view for a Flask *request* object.

    Resolution order
    ----------------
    1. ``?view=`` query parameter — allows per-link overrides
    2. ``view`` cookie — persists the last explicit override across pages
    3. User-Agent sniffing — silent default
    """
    # 1. Query parameter
    param = request.args.get('view', '').lower().strip()
    if param in VALID_VIEWS:
        return param

    # 2. Cookie
    cookie = request.cookies.get('view', '').lower().strip()
    if cookie in VALID_VIEWS:
        return cookie

    # 3. User-Agent
    return detect_device(request.headers.get('User-Agent', ''))
