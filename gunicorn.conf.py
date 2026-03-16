"""
Gunicorn production configuration for SpiceTrade.

Run with:
    gunicorn -c gunicorn.conf.py app:app

Environment variables:
    PORT        – listening port (default 3000)
    WEB_CONCURRENCY – number of worker processes (default: cpu_count * 2 + 1)
    REDIS_URL   – Redis URL for SSE pub/sub (default: redis://localhost:6379/0)
                  Required when running more than 1 worker.
"""

import multiprocessing
import os

# ── Binding ───────────────────────────────────────────────────────────────────
bind = "0.0.0.0:" + os.environ.get("PORT", "3000")

# ── Workers ───────────────────────────────────────────────────────────────────
# gevent workers: each worker runs a gevent event loop that can handle thousands
# of concurrent SSE connections as lightweight greenlets instead of threads.
#
# IMPORTANT: When using multiple workers, set REDIS_URL so SSE pub/sub works
# across workers. Without Redis, messages sent to one worker won't reach
# clients connected to a different worker.
workers = int(os.environ.get("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "gevent"
worker_connections = 1000   # concurrent greenlets per worker

# ── Timeouts ─────────────────────────────────────────────────────────────────
# SSE connections are long-lived. Our keepalive fires every 25s so 120s is safe.
timeout = 120
graceful_timeout = 30
keepalive = 5

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog  = "-"   # stderr
loglevel  = "info"

# ── Memory leak guard ─────────────────────────────────────────────────────────
# Restart workers after N requests to prevent gradual memory growth.
max_requests = 1000
max_requests_jitter = 100   # randomise so all workers don't restart simultaneously
