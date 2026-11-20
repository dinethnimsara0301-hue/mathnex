import os, sys, re, time, json
os.environ["PLAYWRIGHT_BROWSERS_PATH"]="/opt/pw-browsers"
from playwright.sync_api import sync_playwright

RES=[]
def check(name, cond, detail=""):
    RES.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL ")+name+(("  -> "+str(detail)[:300]) if (detail and not cond) else ""), flush=True)

def new_page(b, port="8765", **ctxopts):
    ctx=b.new_context(**ctxopts); pg=ctx.new_page(); pg.errs=[]
    pg.on("pageerror", lambda e: pg.errs.append("PAGEERR "+str(e)))
    pg.on("console", lambda m: pg.errs.append("CONSOLE "+m.text) if m.type=="error" and "404" not in m.text else None)
    pg.goto(f"http://localhost:{port}/index.html"); pg.wait_for_timeout(800); return pg

def open_studio(pg):
    pg.click('#mxSidebar [data-mod="prog"]') if pg.is_visible('#mxSidebar [data-mod="prog"]') else pg.evaluate("document.querySelector('[data-mod=prog]').click()")
    pg.wait_for_selector('#pysMount .pys'); pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000)

def code(pg, text): pg.fill('.pe-ta', text); pg.wait_for_timeout(50)
def out(pg): return pg.inner_text('#pysOut')
def done(pg, t=15000):
    pg.wait_for_function("(()=>{const s=document.querySelector('#pysStatus').dataset.state;const o=document.querySelector('#pysOut').innerText;return s==='ready'&&/Finished in|Process exited|✗|■/.test(o)})()", timeout=t)
def run(pg, text, t=15000):
    code(pg, text); pg.click('#pysRun'); done(pg,t); return out(pg)

def programs(pg):
    o=run(pg,'print("Welcome to MATHNEX Python Studio")'); check("T1 basic output", "Welcome to MATHNEX Python Studio\n" in o and "✓ Finished" in o, o)
    o=run(pg,"a = 25\nb = 15\nprint(a + b)\nprint(a * b)"); check("T2 math", "40\n375\n" in o, o)
    pg.fill('.pe-ta','name = input("Enter your name: ")\nprint("Welcome", name)'); pg.click('#pysRun')
    pg.wait_for_selector('.pys-in', timeout=8000)
    check("T3 prompt shown before input box", "Enter your name:" in out(pg) and pg.is_visible('.pys-in'))
    check("T3 status says waiting for input", "Waiting for input" in pg.inner_text('#pysStatusText'))
    pg.fill('.pys-in','Nimsara'); pg.press('.pys-in','Enter'); done(pg); o=out(pg)
    check("T3 input() echoed + used", "Enter your name: Nimsara\nWelcome Nimsara\n" in o, o)
    pg.fill('.pe-ta','n=input("Enter your name: ")\nage=int(input("Enter your age: "))\nprint("Hello", n)\nprint("Your age is", age)'); pg.click('#pysRun')
    pg.wait_for_selector('.pys-in'); pg.fill('.pys-in','Sam'); pg.press('.pys-in','Enter')
    pg.wait_for_function("document.querySelector('#pysOut').innerText.includes('Enter your age:')&&document.querySelector('.pys-in')"); pg.fill('.pys-in','19'); pg.press('.pys-in','Enter'); done(pg); o=out(pg)
    check("T3b two sequential inputs", "Hello Sam\nYour age is 19" in o, o)
    o=run(pg,"for i in range(1, 11):\n    print(i)"); check("T4 loop", o.count("\n")>=11 and "10\n" in o, o)
    o=run(pg,"def square(n):\n    return n * n\n\nprint(square(8))"); check("T5 function", "64\n" in o, o)
    o=run(pg,"numbers = [10, 20, 30, 40]\nprint(sum(numbers))"); check("T6 list", "100\n" in o, o)
    o=run(pg,'try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("Division by zero is not allowed")'); check("T7 exception handling", "Division by zero is not allowed" in o and "Traceback" not in o, o)
    o=run(pg,'if True\nprint("Hello")'); check("T8 syntax error shown in console", "SyntaxError" in o and 'line 1' in o and "✗ SyntaxError" in o, o)
    check("T8 editor marks error line", pg.is_visible('.pe-gerr') and pg.inner_text('.pe-gerr').strip()=="1" and pg.is_visible('.pe-err'))
    o=run(pg,"def f():\n    return 1/0\n\nf()"); check("traceback with file/line/source", 'File "main.py", line 4' in o and "return 1/0" in o and "ZeroDivisionError" in o and pg.inner_text('.pe-gerr').strip()=="2", o)
    pg.fill('.pe-ta','x=1'); check("error mark clears on edit", not pg.is_visible('.pe-gerr'))

def stop_tests(pg):
    code(pg,"while True:\n    pass"); pg.click('#pysRun'); pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='running'"); pg.wait_for_timeout(1500)
    t=time.time(); v=pg.evaluate("1+1"); check("T9 page responsive during infinite loop", v==2 and time.time()-t<1)
    check("T9 Stop enabled / Run disabled while running", pg.is_enabled('#pysStop') and pg.is_disabled('#pysRun'))
    pg.click('#pysStop'); pg.wait_for_function("/stopped by user/.test(document.querySelector('#pysOut').innerText)", timeout=5000)
    pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000)
    check("T9 stop works + runtime restarts", True)
    o=run(pg,'print("after stop")'); check("T10 run works after stop", "after stop" in o, o)
    o=run(pg,"x = 5\nprint(x)"); o2=run(pg,"print(x)"); check("T10 consecutive runs isolated", "NameError" in o2, o2)
    o3=run(pg,"print('third run ok')"); check("T10 third run", "third run ok" in o3, o3)
    # sys.exit
    o=run(pg,"import sys\nprint('bye')\nsys.exit(2)"); check("sys.exit code reported", "Process exited with code 2" in o, o)
    # output flood is capped
    code(pg,"for i in range(200000):\n    print('x'*10)"); pg.click('#pysRun'); done(pg,40000); o=out(pg)
    check("huge output capped", "[output truncated" in o and len(o)<420000, len(o))

def time_limit_tests(pg):
    pg.select_option('#pysLimit','10')
    code(pg,"while True:\n    pass"); pg.click('#pysRun'); t=time.time()
    pg.wait_for_function("/time limit/.test(document.querySelector('#pysOut').innerText)", timeout=20000)
    check("time limit stops infinite loop (~10s)", 9<time.time()-t<14, time.time()-t)
    pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000)
    # waiting for input must not count
    code(pg,'v=input("wait: ")\nprint("got",v)'); pg.click('#pysRun'); pg.wait_for_selector('.pys-in'); pg.wait_for_timeout(11500)
    still=pg.is_visible('.pys-in'); pg.fill('.pys-in','ok'); pg.press('.pys-in','Enter'); done(pg)
    check("time spent waiting for input not counted", still and "got ok" in out(pg), out(pg))
    pg.select_option('#pysLimit','30')

def input_extra(pg):
    pg.fill('.pe-ta','import sys\nprint(sys.stdin.readline().strip())\ntry:\n    input("again: ")\nexcept EOFError:\n    print("EOF!")'); pg.click('#pysRun')
    pg.wait_for_selector('.pys-in'); pg.fill('.pys-in','first'); pg.press('.pys-in','Enter')
    pg.wait_for_function("document.querySelector('#pysOut').innerText.includes('again:')&&document.querySelector('.pys-in')"); pg.click('.pys-eof'); done(pg); o=out(pg)
    check("sys.stdin.readline + EOF button -> EOFError", "first" in o and "EOF!" in o, o)
    pg.fill('.pe-ta','x=input("go: ")\nprint("never")'); pg.click('#pysRun'); pg.wait_for_selector('.pys-in'); pg.click('#pysStop')
    pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000)
    check("Stop while waiting for input", "stopped by user" in out(pg) and not pg.is_visible('.pys-in'))
    o=run(pg,'print("alive")'); check("runtime fine after stop-in-input", "alive" in o, o)

def editor_tests(pg):
    pg.fill('.pe-ta',''); pg.click('.pe-ta'); kb=pg.keyboard
    kb.type("def f(x):"); kb.press("Enter"); v=pg.input_value('.pe-ta'); check("auto-indent after colon", v=="def f(x):\n    ", repr(v))
    kb.type("return x"); kb.press("Enter"); v=pg.input_value('.pe-ta'); check("auto-dedent after return", v.endswith("return x\n") and not v.endswith("    \n"), repr(v))
    pg.fill('.pe-ta',''); pg.click('.pe-ta'); kb.type('print("hi")'); v=pg.input_value('.pe-ta'); check("auto-close brackets/quotes w/ typeover", v=='print("hi")', repr(v))
    kb.press("Enter"); kb.type("x = [1, (2, 3)"); v=pg.input_value('.pe-ta'); check("nested bracket auto-close", v.endswith("x = [1, (2, 3)]") , repr(v))
    pg.fill('.pe-ta',''); pg.click('.pe-ta'); kb.type("("); kb.press("Backspace"); check("backspace removes pair", pg.input_value('.pe-ta')=="")
    pg.fill('.pe-ta',''); pg.click('.pe-ta'); kb.type("print(1)"); kb.press("Enter"); kb.press("Tab"); check("Tab inserts 4 spaces", pg.input_value('.pe-ta').endswith("\n    "))
    kb.press("Shift+Tab"); check("Shift+Tab outdents", pg.input_value('.pe-ta').endswith("\n"))
    pg.fill('.pe-ta','a = 1\nb = 2'); pg.click('.pe-ta'); kb.press("Control+a"); kb.press("Control+/"); check("Ctrl+/ comments", pg.input_value('.pe-ta')=="# a = 1\n# b = 2", pg.input_value('.pe-ta')); kb.press("Control+/"); check("Ctrl+/ uncomments", pg.input_value('.pe-ta')=="a = 1\nb = 2")
    pg.fill('.pe-ta','def g():\n    return "s"  # c\nx = 12.5'); h=pg.inner_html('.pe-hl')
    check("syntax highlighting classes", all(c in h for c in ['t-k">def','t-f">g','t-s">"s"','t-c">','t-n">12.5']), h[:300])
    pg.fill('.pe-ta',"\n".join(["l%d"%i for i in range(1,26)])); check("line numbers", pg.inner_text('.pe-gutter').split()[-1]=="25")
    # f-string + triple-quote highlighting
    pg.fill('.pe-ta','s = f"a{x}b"\nt = """multi\nline"""\nprint(t)'); h=pg.inner_html('.pe-hl'); check("f-string expr & triple-quote highlighted", 't-fx">{x}' in h and h.count('t-s">')>=3, h[:300])
    # find / replace
    pg.fill('.pe-ta','foo bar foo\nFoo baz'); pg.click('.pe-ta'); pg.keyboard.press("Control+f"); pg.wait_for_selector('.pe-find:not([hidden])')
    pg.fill('.pe-fi','foo'); pg.wait_for_timeout(100); check("find counts matches (case-insens.)", pg.inner_text('.pe-fc').endswith('/3'), pg.inner_text('.pe-fc'))
    check("matches highlighted", pg.locator('.pe-hl mark').count()==3)
    pg.click('[data-a=cs]'); check("case-sensitive toggle", pg.inner_text('.pe-fc').endswith('/2'), pg.inner_text('.pe-fc'))
    pg.click('[data-a=tog]'); pg.fill('.pe-ri','QUX'); pg.click('[data-a=repall]'); check("replace all", pg.input_value('.pe-ta')=='QUX bar QUX\nFoo baz', pg.input_value('.pe-ta'))
    pg.click('[data-a=re]'); pg.fill('.pe-fi','b(a)(.)'); pg.fill('.pe-ri','[$2$1]'); pg.click('[data-a=repall]'); check("regex replace w/ groups", '[ra]' in pg.input_value('.pe-ta') and '[za]' in pg.input_value('.pe-ta'), pg.input_value('.pe-ta'))
    pg.fill('.pe-fi','('); check("invalid regex flagged", 'bad' in (pg.get_attribute('.pe-fi','class') or ''))
    pg.keyboard.press("Escape"); check("Esc closes find", not pg.is_visible('.pe-find'))
    # format
    src='def f():\n\treturn 1   \n\n\n\n\nx = """keep   \n\tinside   \n"""   \n'
    pg.fill('.pe-ta',src); pg.click('#pysFormat'); v=pg.input_value('.pe-ta')
    check("format: tabs->spaces, trailing ws, blank lines", v.startswith("def f():\n    return 1\n\n\nx = ") , repr(v))
    check("format keeps string contents byte-exact", 'keep   \n\tinside   \n' in v, repr(v))
    # undo
    pg.fill('.pe-ta',''); pg.click('.pe-ta'); pg.keyboard.type("abc"); pg.keyboard.press("Control+z"); check("undo works", pg.input_value('.pe-ta')!="abc", pg.input_value('.pe-ta'))
    # large file performance
    big="\n".join("x%d = %d  # comment"%(i,i) for i in range(5000)); t=time.time(); pg.evaluate("(v)=>{const ta=document.querySelector('.pe-ta');ta.value=v;ta.dispatchEvent(new Event('input',{bubbles:true}))}",big); pg.wait_for_function("document.querySelector('.pe-gutter').textContent.trim().endsWith('5000')"); dt=time.time()-t
    check("5000-line file renders (<3s)", dt<3, dt)

def file_tests(pg):
    pg.fill('.pe-ta','print("persist me")'); pg.wait_for_timeout(700); pg.reload(); pg.wait_for_timeout(800); open_studio(pg)
    check("autosave restores code after reload", pg.input_value('.pe-ta')=='print("persist me")', pg.input_value('.pe-ta'))
    pg.click('#pysNew'); check("New file creates tab", pg.locator('.pys-fname').count()==2 and pg.input_value('.pe-ta').startswith('# New Python file'))
    pg.select_option('#pysTpl','1'); check("template creates file", pg.locator('.pys-fname').count()==3 and 'input("Enter your name' in pg.input_value('.pe-ta'))
    pg.once("dialog", lambda d: d.accept("my helper")); pg.click('[data-act=rename]'); check("rename sanitises -> my_helper.py", 'my_helper.py' in pg.inner_text('#pysFiles'), pg.inner_text('#pysFiles'))
    pg.fill('.pe-ta','VALUE = 42\ndef hi():\n    return "hello from helper"\n'); pg.wait_for_timeout(500)
    pg.click('.pys-fname >> nth=0'); o=run(pg,'import my_helper\nprint(my_helper.VALUE, my_helper.hi())'); check("import another project file", "42 hello from helper" in o, o)
    # error inside imported file
    pg.click('.pys-fname >> nth=2'); pg.fill('.pe-ta','def hi():\n    raise ValueError("bad")\n'); pg.wait_for_timeout(300)
    pg.click('.pys-fname >> nth=0'); o=run(pg,'import my_helper\nmy_helper.hi()'); check("traceback names imported file", 'File "my_helper.py"' in o or 'my_helper.py' in o, o)
    with pg.expect_download() as dl: pg.click('#pysDownload')
    d=dl.value; check("download filename .py", d.suggested_filename=="main.py", d.suggested_filename)
    path=d.path(); check("download content equals editor", open(path).read()==pg.input_value('.pe-ta'))
    pg.set_input_files('#pysFile',[{"name":"imp.py","mimeType":"text/x-python","buffer":b"print('imported')\r\n"}]); pg.wait_for_timeout(300)
    check("import .py", 'imp.py' in pg.inner_text('#pysFiles') and pg.input_value('.pe-ta')=="print('imported')\n", pg.input_value('.pe-ta'))
    o=run(pg,pg.input_value('.pe-ta')); check("run imported file", "imported\n" in o)
    pg.once("dialog", lambda d: d.accept()); pg.click('[data-act=delete]'); check("delete file", 'imp.py' not in pg.inner_text('#pysFiles'))
    pg.click('#pysSave'); check("Save button confirms", 'Saved' in pg.inner_text('#pysSaved'))
    pg.click('#pysClear'); check("Clear output", out(pg).strip()=="")
    pg.once("dialog", lambda d: d.accept()); pg.click('#pysReset'); check("Reset restores starter", 'Welcome to MATHNEX Python Studio' in pg.input_value('.pe-ta'))
    pg.select_option('#pysLimit','60'); pg.wait_for_timeout(100); pg.reload(); pg.wait_for_timeout(800); open_studio(pg); check("time limit setting persisted", pg.input_value('#pysLimit')=='60'); pg.select_option('#pysLimit','30')

def only_python_check(pg):
    html=pg.inner_text('#mod-prog').lower()
    bad=[w for w in ['c++','java ','javascript','html/css','clang','gcc'] if w in html]
    check("Programming section has no other-language UI", not bad, bad)
    sel=pg.eval_on_selector_all('#mod-prog select option','els=>els.map(e=>e.textContent)')
    check("no language selector options", not any(re.search(r'\b(c\+\+|java|javascript|rust|go)\b',s.lower()) for s in sel), sel)

def other_modules(pg):
    mods=pg.eval_on_selector_all('#mxSidebar [data-mod]','els=>els.map(e=>e.dataset.mod)')
    ok=True; bad=[]
    for m in mods:
        pg.evaluate(f"document.querySelector('#mxSidebar [data-mod=\"{m}\"]').click()"); pg.wait_for_timeout(250)
        vis=pg.evaluate(f"!document.getElementById('mod-{m}').hidden")
        if not vis: ok=False; bad.append(m)
    check(f"all {len(mods)} modules switch & show ({','.join(mods)})", ok, bad)
    # a real calculation in another module still works: scientific calculator self-test button
    pg.evaluate("document.querySelector('#mxSidebar [data-mod=\"calc\"]').click()"); pg.wait_for_timeout(300)
    pg.click('#scTest'); pg.wait_for_timeout(1200); t=pg.inner_text('#scTestOut')
    check("calculator self-test still passes", len(t)>20 and 'fail' not in t.lower(), t[:200])

if __name__=="__main__":
    which=sys.argv[1]
    with sync_playwright() as p:
        b=p.chromium.launch()
        if which=="desktop":
            pg=new_page(b,"8765",viewport={"width":1280,"height":900}); open_studio(pg)
            check("runtime mode: service-worker input channel active", pg.evaluate("!!navigator.serviceWorker.controller") and pg.is_hidden('#pysQueueWrap'))
            programs(pg); input_extra(pg); stop_tests(pg); editor_tests(pg); file_tests(pg); only_python_check(pg)
            pg.screenshot(path="shot_desktop.png"); other_modules(pg)
            check("no JS errors on page", not pg.errs, pg.errs[:5])
        elif which=="timelimit":
            pg=new_page(b,"8765",viewport={"width":1280,"height":900}); open_studio(pg); time_limit_tests(pg)
        elif which=="sab":
            pg=new_page(b,"8766",viewport={"width":1280,"height":900}); open_studio(pg)
            check("cross-origin isolated (SharedArrayBuffer path)", pg.evaluate("crossOriginIsolated"))
            programs(pg); input_extra(pg)
            code(pg,"while True:\n    pass"); pg.click('#pysRun'); pg.wait_for_timeout(800); pg.click('#pysStop'); pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000); check("stop works in SAB mode", True)
        elif which=="replay":
            pg=new_page(b,"8765",viewport={"width":1280,"height":900},service_workers="block")
            pg.click('#mxSidebar [data-mod="prog"]'); pg.wait_for_selector('#pysMount .pys'); pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=30000)
            check("replay: no service worker controlling", not pg.evaluate("!!navigator.serviceWorker.controller"))
            code(pg,'name = input("Name: ")\nage = int(input("Age: "))\nprint("Welcome", name, age)\nprint("done")'); pg.click('#pysRun')
            pg.wait_for_selector('.pys-in', timeout=15000); pg.fill('.pys-in','Bob'); pg.press('.pys-in','Enter')
            pg.wait_for_function("document.querySelector('#pysOut').innerText.includes('Age:')&&document.querySelector('.pys-in')", timeout=15000); pg.fill('.pys-in','21'); pg.press('.pys-in','Enter'); done(pg); o=out(pg)
            check("replay: interactive input without any blocking channel", "Name: Bob\nAge: 21\nWelcome Bob 21\ndone\n" in o, o)
            check("replay: no duplicated output", o.count("Name:")==1 and o.count("Age:")==1, o)
            code(pg,'print("before")\nx=input("x: ")\nprint("after", x)'); pg.click('#pysRun'); pg.wait_for_selector('.pys-in'); pg.click('.pys-eof'); done(pg); o=out(pg)
            check("replay: EOF button -> EOFError traceback", "EOFError" in o and o.count("before")==1, o)
            o=run(pg,'print(1+1)'); check("replay: normal program still fine", "2\n" in o)
            code(pg,'v=input("p: ")'); pg.click('#pysRun'); pg.wait_for_selector('.pys-in'); pg.click('#pysStop'); pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000)
            o=run(pg,'print("alive")'); check("replay: stop while waiting then run again", "alive" in o, o)
        elif which=="file":
            import pathlib
            pg=b.new_context(viewport={"width":1280,"height":900}).new_page(); pg.errs=[]
            pg.on("pageerror", lambda e: pg.errs.append(str(e)))
            pg.goto("file:///home/claude/test/site/index_file.html"); pg.wait_for_timeout(1500)
            check("page opened via file://", pg.evaluate("location.protocol")=="file:")
            pg.evaluate("document.querySelector('#mxSidebar [data-mod=\"prog\"]').click()"); pg.wait_for_selector('#pysMount .pys')
            pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=30000)
            check("file://: runtime becomes ready", True)
            o=run(pg,'print("hello from file://")'); check("file://: program runs", "hello from file://" in o, o)
            code(pg,'n=input("Your name: ")\nprint("Hi", n)'); pg.click('#pysRun'); pg.wait_for_selector('.pys-in',timeout=15000); pg.fill('.pys-in','Nimal'); pg.press('.pys-in','Enter'); done(pg)
            check("file://: interactive input works", "Your name: Nimal\nHi Nimal" in out(pg), out(pg))
            code(pg,"while True:\n    pass"); pg.click('#pysRun'); pg.wait_for_timeout(800); pg.click('#pysStop'); pg.wait_for_function("document.querySelector('#pysStatus').dataset.state==='ready'", timeout=20000)
            check("file://: Stop works", True); check("file://: no JS errors", not pg.errs, pg.errs)
        elif which=="mobile":
            dev=p.devices["Pixel 5"]; pg=new_page(b,"8765",**dev); open_studio(pg)
            pg.evaluate("document.querySelector('#mod-prog').scrollIntoView()")
            check("mobile: no horizontal overflow", pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"), pg.evaluate("[document.documentElement.scrollWidth,window.innerWidth]"))
            check("mobile: studio fits inside viewport (not clipped)", pg.evaluate("(()=>{const r=document.querySelector('.pys').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&document.querySelector('.app').getBoundingClientRect().width<=innerWidth+1})()"))
            check("mobile: editor visible, console hidden", pg.is_visible('#pysEditor') and not pg.is_visible('#pysOut'))
            check("mobile: key bar visible", pg.is_visible('#pysKeys'))
            check("mobile: Run/Stop/Save reachable", all(pg.is_visible(s) for s in ['#pysRun','#pysStop','#pysSave']))
            pg.screenshot(path="shot_mobile_editor.png")
            pg.fill('.pe-ta',''); pg.tap('.pe-ta'); pg.tap('#pysKeys [data-k="("]'); check("mobile: symbol key inserts pair", pg.input_value('.pe-ta')=="()", pg.input_value('.pe-ta'))
            pg.fill('.pe-ta','name = input("Your name: ")\nprint("Hi", name)'); pg.tap('#pysRun'); pg.wait_for_selector('.pys-in', timeout=8000)
            check("mobile: console auto-opens for input", pg.is_visible('#pysOut') and pg.is_visible('.pys-in'))
            pg.screenshot(path="shot_mobile_input.png")
            pg.fill('.pys-in','Kamal'); pg.tap('.pys-send'); done(pg); check("mobile: output shown", "Hi Kamal" in out(pg), out(pg))
            check("mobile: no horizontal overflow after run", pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
            pg.tap('.pys-mtabs [data-pane=editor]'); check("mobile: tab back to editor", pg.is_visible('.pe-ta'))
            check("mobile: font >=16px (no iOS zoom)", pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.pe-ta')).fontSize)>=16"))
            pg.set_viewport_size({"width":768,"height":1024}); pg.wait_for_timeout(300); check("tablet: no horizontal overflow", pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
            pg.screenshot(path="shot_tablet.png")
            check("no JS errors", not pg.errs, pg.errs[:5])
        b.close()
    f=[r for r in RES if not r[1]]; print(f"\n{which}: {len(RES)-len(f)}/{len(RES)} passed"); sys.exit(1 if f else 0)
