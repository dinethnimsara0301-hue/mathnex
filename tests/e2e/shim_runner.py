import asyncio, json, os, sys, types
cfg = json.load(open(sys.argv[1]))
real_out = sys.stdout
def send(o): real_out.write(json.dumps(o) + "\n"); real_out.flush()
bridge = types.ModuleType("mnx_bridge")
bridge.emit = lambda kind, text: send({"t": "emit", "kind": kind, "text": text})
bridge.flush = lambda: None
def read_input():
    send({"t": "input"})
    line = sys.__stdin__.readline()
    v = json.loads(line)["value"]
    return v
bridge.read_input = read_input
sys.modules["mnx_bridge"] = bridge
os.chdir(cfg["cwd"]); sys.path.insert(0, cfg["cwd"])
ns = {"__name__": "harness"}
exec(compile(cfg["harness"], "<harness>", "exec"), ns)
res = asyncio.run(ns["_mnx_run"](cfg["code"], cfg["filename"], json.dumps(cfg["names"])))
send({"t": "done", "result": json.loads(res)})
