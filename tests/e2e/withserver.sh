#!/bin/bash
# usage: withserver.sh script.py [args]   (starts normal :8765 and cross-origin-isolated :8766 servers, runs script, stops them)
cd /home/claude/test
python3 server.py > server.log 2>&1 &  S1=$!
ISOLATE=1 PORT=8766 python3 server.py > server2.log 2>&1 & S2=$!
sleep 1.2
python3 "$@"; RC=$?
kill $S1 $S2 2>/dev/null; pkill -f shim_runner.py 2>/dev/null
exit $RC
