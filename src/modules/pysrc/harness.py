# MATHNEX Python Studio - execution harness.
#
# Executed once inside Pyodide by public/py-worker.js. It expects a JS module
# registered as `mnx_bridge` that provides:
#     emit(kind, text)   kind is "stdout" or "stderr"
#     flush()            push any buffered output to the page
#     read_input()       blocks until the user answers; returns "L:<line>" or "E" (EOF)
#
# The harness only uses the standard library, so it can also be unit-tested
# with plain CPython (see tests/test_harness.py).

import ast
import builtins
import gc
import importlib
import inspect
import json
import linecache
import sys
import traceback

import mnx_bridge as _b

_PROJECT_FILES = set()


class _Out:
    """File-like object that forwards every write to the page immediately."""

    encoding = "utf-8"
    errors = "strict"

    def __init__(self, kind):
        self._kind = kind

    def write(self, s):
        if not isinstance(s, str):
            raise TypeError("write() argument must be str, not " + type(s).__name__)
        if s:
            _b.emit(self._kind, s)
        return len(s)

    def writelines(self, lines):
        for line in lines:
            self.write(line)

    def flush(self):
        _b.flush()

    def isatty(self):
        return False

    def writable(self):
        return True

    def readable(self):
        return False

    def fileno(self):
        raise OSError("fileno() is not supported in MATHNEX Python Studio")


class _NeedInput(BaseException):
    """Raised in replay mode when input() has no queued answer; the page asks the user and re-runs."""


def _read_line():
    """Return one line (without newline) or None on EOF."""
    reply = _b.read_input()
    if reply == "N":
        raise _NeedInput()
    if reply is None or reply == "E":
        return None
    reply = str(reply)
    return reply[2:] if reply.startswith("L:") else reply


class _In:
    """sys.stdin replacement backed by the interactive console."""

    encoding = "utf-8"
    errors = "strict"

    def readline(self, size=-1):
        line = _read_line()
        return "" if line is None else line + "\n"

    def read(self, size=-1):
        parts = []
        while True:
            line = self.readline()
            if not line:
                break
            parts.append(line)
        return "".join(parts)

    def readlines(self, hint=-1):
        out = []
        while True:
            line = self.readline()
            if not line:
                break
            out.append(line)
        return out

    def __iter__(self):
        return self

    def __next__(self):
        line = self.readline()
        if not line:
            raise StopIteration
        return line

    def isatty(self):
        return False

    def readable(self):
        return True

    def writable(self):
        return False

    def fileno(self):
        raise OSError("fileno() is not supported in MATHNEX Python Studio")


def _input(prompt=""):
    text = "" if prompt is None else str(prompt)
    if text:
        _b.emit("stdout", text)
    line = _read_line()
    if line is None:
        raise EOFError("EOF when reading a line")
    return line


def _is_user_file(name):
    if not name:
        return False
    base = name.replace("\\", "/").rsplit("/", 1)[-1]
    return base in _PROJECT_FILES


def _locate(tb, exc, filename):
    """Find (file, line) of the innermost frame that belongs to the user's project."""
    if isinstance(exc, SyntaxError) and exc.lineno and _is_user_file(exc.filename or filename):
        return (exc.filename or filename).replace("\\", "/").rsplit("/", 1)[-1], exc.lineno
    found = (None, None)
    for entry in traceback.extract_tb(tb):
        if _is_user_file(entry.filename):
            found = (entry.filename.replace("\\", "/").rsplit("/", 1)[-1], entry.lineno)
    return found


def _format_error(exc, tb):
    if isinstance(exc, SyntaxError):
        # SyntaxError raised by compile(): there are no user frames to show.
        return "".join(traceback.format_exception_only(type(exc), exc))
    return "".join(traceback.format_exception(type(exc), exc, tb))


async def _mnx_run(src, filename, names_json):
    global _PROJECT_FILES
    names = json.loads(names_json) if names_json else []
    _PROJECT_FILES = set(names) | {filename}

    # Fresh state for every run: forget project modules edited since last run.
    for n in _PROJECT_FILES:
        if n.endswith(".py"):
            sys.modules.pop(n[:-3], None)
    importlib.invalidate_caches()

    linecache.cache[filename] = (len(src), None, src.splitlines(True), filename)
    saved = (sys.stdout, sys.stderr, sys.stdin, builtins.input, list(sys.argv))
    sys.stdout, sys.stderr, sys.stdin = _Out("stdout"), _Out("stderr"), _In()
    builtins.input = _input
    sys.argv = [filename]

    scope = {"__name__": "__main__", "__file__": filename, "__doc__": None, "__builtins__": builtins}
    result = {"status": "ok", "file": None, "line": None, "etype": None, "code": 0}
    try:
        code = compile(src, filename, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        outcome = eval(code, scope)
        if inspect.iscoroutine(outcome):
            await outcome
    except _NeedInput:
        result["status"] = "need-input"
    except SystemExit as e:
        result["status"] = "exit"
        code_value = e.code
        if code_value is None:
            result["code"] = 0
        elif isinstance(code_value, int):
            result["code"] = code_value
        else:
            sys.stderr.write(str(code_value) + "\n")
            result["code"] = 1
    except BaseException as e:  # noqa: BLE001 - everything must be reported to the user
        tb = e.__traceback__
        # Hide the harness' own frame from the traceback shown to the user.
        while tb is not None and tb.tb_frame.f_code is _mnx_run.__code__:
            tb = tb.tb_next
        result["status"] = "error"
        result["etype"] = type(e).__name__
        result["file"], result["line"] = _locate(tb, e, filename)
        text = _format_error(e, tb)
        if isinstance(e, ModuleNotFoundError) and getattr(e, "name", None):
            top = e.name.split(".")[0]
            text += (
                "\nNote: the module '%s' is not available in this browser-based Python (Pyodide).\n"
                "Packages that Pyodide ships (numpy, pandas, scipy, sympy, matplotlib, ...) load automatically.\n"
                "Pure-Python packages may be installable with micropip; packages that need native CPython\n"
                "extensions, sockets or threads cannot run here.\n" % top
            )
        sys.stderr.write(text)
    finally:
        sys.stdout, sys.stderr, sys.stdin, builtins.input = saved[0], saved[1], saved[2], saved[3]
        sys.argv = saved[4]
        linecache.cache.pop(filename, None)
        scope.clear()
        gc.collect()
        _b.flush()
    return json.dumps(result)
