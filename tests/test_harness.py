"""Unit tests for public/py-harness.py using real CPython (3.12) with a fake JS bridge.

These verify the Python-side logic (stdout/stderr capture, input(), tracebacks,
SyntaxError reporting, SystemExit, state isolation). They do NOT exercise Pyodide itself.
Run:  python3 tests/test_harness.py
"""
import asyncio, json, os, sys, types, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, "..", "src", "modules", "pysrc", "harness.py"), encoding="utf-8").read()


class Bridge(types.ModuleType):
    def __init__(self):
        super().__init__("mnx_bridge")
        self.events, self.inputs = [], []

    def emit(self, kind, text): self.events.append((kind, text))
    def flush(self): pass
    def read_input(self):
        return self.inputs.pop(0) if self.inputs else "E"


def run(code, inputs=(), names=("main.py",)):
    bridge = Bridge()
    bridge.inputs = ["L:" + i for i in inputs]
    sys.modules["mnx_bridge"] = bridge
    ns = {"__name__": "harness"}
    exec(compile(SRC, "<harness>", "exec"), ns)
    res = json.loads(asyncio.run(ns["_mnx_run"](code, "main.py", json.dumps(list(names)))))
    out = "".join(t for k, t in bridge.events if k == "stdout")
    err = "".join(t for k, t in bridge.events if k == "stderr")
    return out, err, res


class T(unittest.TestCase):
    def test01_print(self):
        out, err, r = run('print("Welcome to MATHNEX Python Studio")')
        self.assertEqual(out, "Welcome to MATHNEX Python Studio\n"); self.assertEqual(err, ""); self.assertEqual(r["status"], "ok")

    def test02_math(self):
        out, _, _ = run("a = 25\nb = 15\nprint(a + b)\nprint(a * b)")
        self.assertEqual(out, "40\n375\n")

    def test03_input(self):
        out, _, r = run('name = input("Enter your name: ")\nprint("Welcome", name)', ["Nimsara"])
        self.assertEqual(out, "Enter your name: Welcome Nimsara\n"); self.assertEqual(r["status"], "ok")

    def test03b_input_int_and_eof(self):
        out, _, _ = run('n=input("Enter your name: ")\nage=int(input("Enter your age: "))\nprint("Hello", n)\nprint("Your age is", age)', ["Sam", "19"])
        self.assertEqual(out, "Enter your name: Enter your age: Hello Sam\nYour age is 19\n")
        _, err, r = run("input('x')")  # no input available -> EOF
        self.assertIn("EOFError", err); self.assertEqual(r["status"], "error"); self.assertEqual(r["line"], 1)

    def test03c_sys_stdin(self):
        out, _, _ = run("import sys\nprint(sys.stdin.readline().strip())\nprint([l.strip() for l in sys.stdin])", ["a", "b", "c"])
        self.assertEqual(out, "a\n['b', 'c']\n")

    def test04_loop(self):
        out, _, _ = run("for i in range(1, 11):\n    print(i)")
        self.assertEqual(out, "".join(f"{i}\n" for i in range(1, 11)))

    def test05_function(self):
        out, _, _ = run("def square(n):\n    return n * n\n\nprint(square(8))")
        self.assertEqual(out, "64\n")

    def test06_list(self):
        out, _, _ = run("numbers = [10, 20, 30, 40]\nprint(sum(numbers))")
        self.assertEqual(out, "100\n")

    def test07_exception_handled(self):
        out, err, r = run('try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("Division by zero is not allowed")')
        self.assertEqual(out, "Division by zero is not allowed\n"); self.assertEqual(err, ""); self.assertEqual(r["status"], "ok")

    def test07b_traceback(self):
        out, err, r = run("def f():\n    return 1/0\n\nf()")
        self.assertIn("Traceback (most recent call last):", err)
        self.assertIn('File "main.py", line 4, in <module>', err)
        self.assertIn('File "main.py", line 2, in f', err)
        self.assertIn("    return 1/0", err)          # source line is shown
        self.assertIn("ZeroDivisionError: division by zero", err)
        self.assertNotIn("_mnx_run", err)             # harness frame hidden
        self.assertEqual((r["status"], r["line"], r["etype"]), ("error", 2, "ZeroDivisionError"))

    def test08_syntax_error(self):
        out, err, r = run('if True\nprint("Hello")')
        self.assertIn("SyntaxError", err); self.assertIn('File "main.py", line 1', err)
        self.assertEqual((r["status"], r["line"], r["etype"]), ("error", 1, "SyntaxError"))
        self.assertEqual(out, "")

    def test08b_indentation_error(self):
        _, err, r = run("def f():\nprint(1)")
        self.assertIn("IndentationError", err); self.assertEqual(r["line"], 2)

    def test09_exit(self):
        out, err, r = run("import sys\nprint('a')\nsys.exit(3)")
        self.assertEqual((out, r["status"], r["code"]), ("a\n", "exit", 3))

    def test10_consecutive_runs_are_isolated(self):
        a, _, _ = run("x = 5\nprint(x)")
        b, err, r = run("print(x)")          # x must not leak from the previous run
        self.assertEqual(a, "5\n"); self.assertIn("NameError", err); self.assertEqual(r["line"], 1)
        c, _, _ = run("print('still works')")
        self.assertEqual(c, "still works\n")

    def test11_classes_collections(self):
        code = ("class P:\n    def __init__(s, n): s.n = n\n    def __repr__(s): return f'P({s.n})'\n"
                "t=(1,2); d={'a':1}; st={3,3,4}\nprint(P(2), t, d, sorted(st))")
        out, _, _ = run(code)
        self.assertEqual(out, "P(2) (1, 2) {'a': 1} [3, 4]\n")

    def test12_stderr_and_partial_lines(self):
        out, err, _ = run("import sys\nprint('a', end='')\nprint('b', file=sys.stderr)\nprint('c')")
        self.assertEqual((out, err), ("ac\n", "b\n"))

    def test13_top_level_await(self):
        out, _, r = run("import asyncio\nawait asyncio.sleep(0)\nprint('awaited')")
        self.assertEqual((out, r["status"]), ("awaited\n", "ok"))

    def test14_missing_module_hint(self):
        _, err, r = run("import definitely_not_a_module_xyz")
        self.assertIn("ModuleNotFoundError", err); self.assertIn("not available in this browser-based Python", err)

    def test15_error_in_imported_project_file(self):
        import tempfile
        d = tempfile.mkdtemp(); open(os.path.join(d, "helper.py"), "w").write("def boom():\n    raise ValueError('bad')\n")
        old = os.getcwd(); os.chdir(d); sys.path.insert(0, d)
        try:
            _, err, r = run("import helper\nhelper.boom()", names=("main.py", "helper.py"))
        finally:
            os.chdir(old); sys.path.remove(d)
        self.assertEqual((r["file"], r["line"]), ("helper.py", 2)); self.assertIn("ValueError: bad", err)

    def test16_file_operations(self):
        import tempfile
        d = tempfile.mkdtemp(); old = os.getcwd(); os.chdir(d)
        try:
            out, _, _ = run("open('t.txt','w').write('hi')\nprint(open('t.txt').read())")
        finally:
            os.chdir(old)
        self.assertEqual(out, "hi\n")


if __name__ == "__main__":
    unittest.main(verbosity=2)
