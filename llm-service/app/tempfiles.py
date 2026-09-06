import os
import tempfile
import uuid
from contextlib import contextmanager

_TEMP_DIR = os.path.join(tempfile.gettempdir(), "agrivision")
os.makedirs(_TEMP_DIR, exist_ok=True)


@contextmanager
def temp_path(suffix: str):
    path = os.path.join(_TEMP_DIR, f"{uuid.uuid4().hex}{suffix}")
    try:
        yield path
    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass
