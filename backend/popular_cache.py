"""
In-process cache for popular posts responses.
"""

from copy import deepcopy
from threading import RLock
from time import monotonic


POPULAR_CACHE_TTL_SECONDS = 30

_CACHE = {}
_LOCK = RLock()


def get_popular_posts_cache(key):
    now = monotonic()
    with _LOCK:
        entry = _CACHE.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if expires_at <= now:
            _CACHE.pop(key, None)
            return None
        return deepcopy(value)


def set_popular_posts_cache(key, value, ttl_seconds=POPULAR_CACHE_TTL_SECONDS):
    expires_at = monotonic() + max(1, int(ttl_seconds))
    with _LOCK:
        _CACHE[key] = (expires_at, deepcopy(value))


def invalidate_popular_posts_cache():
    with _LOCK:
        _CACHE.clear()
