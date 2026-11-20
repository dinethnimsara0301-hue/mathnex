import http.server, json, os, queue, subprocess, sys, tempfile, threading, time, uuid
ROOT = "/home/claude/test/site"; ISOLATE = os.environ.get("ISOLATE") == "1"; PORT = int(os.environ.get("PORT", "8765"))
SESS = {}
def reader(s):
    for line in s["proc"].stdout:
        try: s["q"].put(json.loads(line))
        except Exception: pass
def watchdog():
    while True:
        time.sleep(1)
        for sid, s in list(SESS.items()):
            if time.time() - s["last"] > (60 if s.get("waiting") else 3) and s["proc"].poll() is None:
                s["proc"].kill(); s["killed"] = True
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        if ISOLATE:
            self.send_header("Cross-Origin-Opener-Policy", "same-origin"); self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Cache-Control", "no-store"); super().end_headers()
    def do_GET(self):
        if self.path == "/shim/pyodide.js": self.path = "/shim_pyodide.js"
        if self.path.startswith("/__shim/alive"): 
            self.send_response(200); self.end_headers(); self.wfile.write(json.dumps({"alive":[ (s["proc"].poll() is None) for s in SESS.values()]}).encode()); return
        super().do_GET()
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        out = {}
        if self.path == "/shim/start":
            cwd = tempfile.mkdtemp()
            for n, c in body["files"].items(): open(os.path.join(cwd, n), "w").write(c)
            cfgp = os.path.join(cwd, "_cfg.json"); json.dump({**body, "cwd": cwd}, open(cfgp, "w"))
            proc = subprocess.Popen([sys.executable, "/home/claude/test/shim_runner.py", cfgp], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)
            sid = uuid.uuid4().hex; s = {"proc": proc, "q": queue.Queue(), "last": time.time()}; SESS[sid] = s
            threading.Thread(target=reader, args=(s,), daemon=True).start(); out = {"sid": sid}
        elif self.path == "/shim/poll":
            s = SESS[body["sid"]]; s["last"] = time.time(); ev = []
            try:
                ev.append(s["q"].get(timeout=0.3))
                while True: ev.append(s["q"].get_nowait())
            except queue.Empty: pass
            if not ev and s["proc"].poll() is not None and s["q"].empty():
                ev = [{"t": "done", "result": {"status": "crash", "file": None, "line": None, "etype": "Killed", "code": 1}}]
            if any(e.get("t")=="input" for e in ev): s["waiting"]=True
            out = {"events": ev}
        elif self.path == "/shim/input":
            s = SESS[body["sid"]]; s["waiting"]=False; s["last"]=time.time(); s["proc"].stdin.write(json.dumps({"value": body["value"]}) + "\n"); s["proc"].stdin.flush(); out = {}
        data = json.dumps(out).encode(); self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
threading.Thread(target=watchdog, daemon=True).start()
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
