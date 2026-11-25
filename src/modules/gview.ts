/* GView — small, dependency-free interactive 2D graph for MATHNEX learning modules.
   Pan (drag), zoom (wheel / pinch), double-click reset, optional draggable vertical marker,
   open/closed points, shaded bands, jump-aware curve sampling. Theme colours come from CSS variables. */

export interface GCurve {
  f: (x: number) => number;
  color?: string;
  width?: number;
  dash?: number[];
  label?: string;
  /** only draw on this x-interval */
  domain?: [number, number];
  /** do not draw on this open interval (holes) */
  skip?: [number, number][];
}
export interface GPoint {
  x: number;
  y: number;
  kind?: 'filled' | 'open' | 'cross';
  color?: string;
  label?: string;
  r?: number;
}
export interface GBand {
  kind: 'h' | 'v';
  lo: number;
  hi: number;
  color?: string;
  label?: string;
}
export interface GLine {
  kind: 'h' | 'v';
  v: number;
  color?: string;
  dash?: number[];
  label?: string;
  width?: number;
}
export interface GSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dash?: number[];
  width?: number;
}
export interface GRect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  fill?: string;
  stroke?: string;
}
export interface GText {
  x: number;
  y: number;
  text: string;
  color?: string;
  align?: CanvasTextAlign;
}
export interface GScene {
  curves?: GCurve[];
  points?: GPoint[];
  bands?: GBand[];
  lines?: GLine[];
  segs?: GSeg[];
  rects?: GRect[];
  texts?: GText[];
}
export interface GHandle {
  x: number;
  onMove: (x: number) => void;
  label?: string;
}
export interface GViewOpts {
  view?: [number, number, number, number];
  scene: () => GScene;
  handle?: () => GHandle | null;
  lockAspect?: boolean;
  onView?: () => void;
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

function fmtTick(v: number, step: number): string {
  if (Math.abs(v) < step * 1e-9) return '0';
  const d = Math.max(0, -Math.floor(Math.log10(step)) + (step < 1 ? 0 : 0));
  const s = Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4 ? v.toExponential(1) : v.toFixed(Math.min(d, 8));
  return s.includes('e') ? s : String(Number(s));
}

export class GView {
  readonly canvas: HTMLCanvasElement;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  private opts: GViewOpts;
  private home: [number, number, number, number];
  private ptrs = new Map<number, { x: number; y: number }>();
  private dragHandle = false;
  private lastPinch = 0;
  private ro: ResizeObserver | null = null;
  private raf = 0;
  private onWheelBound: (e: WheelEvent) => void;

  constructor(canvas: HTMLCanvasElement, opts: GViewOpts) {
    this.canvas = canvas;
    this.opts = opts;
    const v = opts.view || [-6, 6, -4, 4];
    this.home = [...v] as [number, number, number, number];
    [this.x0, this.x1, this.y0, this.y1] = v;
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
    canvas.addEventListener('dblclick', () => this.reset());
    this.onWheelBound = (e: WheelEvent) => this.wheel(e);
    canvas.addEventListener('wheel', this.onWheelBound, { passive: false });
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.draw());
      this.ro.observe(canvas);
    }
    window.addEventListener('resize', this.scheduleDraw);
    window.addEventListener('mathnex:theme', this.scheduleDraw);
  }

  dispose(): void {
    this.ro?.disconnect();
    window.removeEventListener('resize', this.scheduleDraw);
    window.removeEventListener('mathnex:theme', this.scheduleDraw);
    this.canvas.removeEventListener('wheel', this.onWheelBound);
  }

  scheduleDraw = (): void => {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  };

  setView(x0: number, x1: number, y0: number, y1: number, makeHome = false): void {
    this.x0 = x0;
    this.x1 = x1;
    this.y0 = y0;
    this.y1 = y1;
    if (makeHome) this.home = [x0, x1, y0, y1];
    this.draw();
  }

  reset(): void {
    [this.x0, this.x1, this.y0, this.y1] = this.home;
    this.draw();
    this.opts.onView?.();
  }

  zoomBy(factor: number, cx?: number, cy?: number): void {
    const mx = cx ?? (this.x0 + this.x1) / 2;
    const my = cy ?? (this.y0 + this.y1) / 2;
    this.x0 = mx + (this.x0 - mx) * factor;
    this.x1 = mx + (this.x1 - mx) * factor;
    this.y0 = my + (this.y0 - my) * factor;
    this.y1 = my + (this.y1 - my) * factor;
    this.draw();
    this.opts.onView?.();
  }

  private w(): number {
    return this.canvas.clientWidth || 600;
  }
  private h(): number {
    return this.canvas.clientHeight || 320;
  }
  sx = (x: number): number => ((x - this.x0) / (this.x1 - this.x0)) * this.w();
  sy = (y: number): number => (1 - (y - this.y0) / (this.y1 - this.y0)) * this.h();
  ix = (px: number): number => this.x0 + (px / this.w()) * (this.x1 - this.x0);
  iy = (py: number): number => this.y0 + (1 - py / this.h()) * (this.y1 - this.y0);

  private local(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private down = (e: PointerEvent): void => {
    const p = this.local(e);
    this.ptrs.set(e.pointerId, p);
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const hd = this.opts.handle?.();
    this.dragHandle = !!hd && this.ptrs.size === 1 && Math.abs(this.sx(hd.x) - p.x) < 18;
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      this.lastPinch = Math.hypot(a.x - b.x, a.y - b.y);
      this.dragHandle = false;
    }
    this.canvas.style.cursor = 'grabbing';
  };

  private move = (e: PointerEvent): void => {
    const prev = this.ptrs.get(e.pointerId);
    const p = this.local(e);
    if (!prev) {
      const hd = this.opts.handle?.();
      this.canvas.style.cursor = hd && Math.abs(this.sx(hd.x) - p.x) < 18 ? 'ew-resize' : 'grab';
      return;
    }
    this.ptrs.set(e.pointerId, p);
    if (this.dragHandle) {
      const hd = this.opts.handle?.();
      if (hd) hd.onMove(this.ix(p.x));
      return;
    }
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.lastPinch > 0 && d > 0) {
        const cx = this.ix((a.x + b.x) / 2);
        const cy = this.iy((a.y + b.y) / 2);
        this.zoomBy(this.lastPinch / d, cx, cy);
      }
      this.lastPinch = d;
      return;
    }
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const ux = (dx / this.w()) * (this.x1 - this.x0);
    const uy = (dy / this.h()) * (this.y1 - this.y0);
    this.x0 -= ux;
    this.x1 -= ux;
    this.y0 += uy;
    this.y1 += uy;
    this.draw();
    this.opts.onView?.();
  };

  private up = (e: PointerEvent): void => {
    this.ptrs.delete(e.pointerId);
    this.dragHandle = false;
    this.lastPinch = 0;
    this.canvas.style.cursor = 'grab';
  };

  private wheel(e: WheelEvent): void {
    e.preventDefault();
    const p = this.local(e as unknown as PointerEvent);
    const f = Math.exp(Math.sign(e.deltaY) * 0.14);
    this.zoomBy(f, this.ix(p.x), this.iy(p.y));
  }

  draw(): void {
    const cv = this.canvas;
    const W = this.w();
    const H = this.h();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const ctx = cv.getContext('2d');
    if (!ctx || W < 2 || H < 2) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const col = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
    const C = {
      bg: col('--g-bg-custom', col('--surface2', '#0c0e12')),
      grid: col('--line', '#1f2229'),
      axis: col('--line2', '#2f3440'),
      text: col('--muted', '#9aa0ad'),
      main: col('--accent', '#D6B77A'),
      alt: col('--accent2', '#8BB8E8'),
      good: col('--good', '#6fd6a4'),
      bad: col('--bad', '#ff8a8a'),
      warn: col('--warn', '#f0b866'),
    };
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const clampView = () => {
      if (!(this.x1 > this.x0)) this.x1 = this.x0 + 1e-9;
      if (!(this.y1 > this.y0)) this.y1 = this.y0 + 1e-9;
    };
    clampView();

    // grid + ticks
    const stepX = niceStep((this.x1 - this.x0) / Math.max(3, W / 90));
    const stepY = niceStep((this.y1 - this.y0) / Math.max(3, H / 70));
    ctx.lineWidth = 1;
    ctx.font = '10.5px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = C.text;
    const ax = Math.min(Math.max(this.sx(0), 0), W);
    const ay = Math.min(Math.max(this.sy(0), 0), H);
    for (let gx = Math.ceil(this.x0 / stepX) * stepX; gx <= this.x1; gx += stepX) {
      const px = Math.round(this.sx(gx)) + 0.5;
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
      if (Math.abs(gx) > stepX * 1e-9) {
        ctx.textAlign = 'center';
        ctx.fillText(fmtTick(gx, stepX), px, Math.min(Math.max(ay + 13, 12), H - 3));
      }
    }
    for (let gy = Math.ceil(this.y0 / stepY) * stepY; gy <= this.y1; gy += stepY) {
      const py = Math.round(this.sy(gy)) + 0.5;
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
      if (Math.abs(gy) > stepY * 1e-9) {
        ctx.textAlign = ax > W - 40 ? 'right' : 'left';
        ctx.fillText(fmtTick(gy, stepY), ax > W - 40 ? ax - 4 : Math.min(ax + 4, W - 30), py - 3);
      }
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, ay + 0.5);
    ctx.lineTo(W, ay + 0.5);
    ctx.moveTo(ax + 0.5, 0);
    ctx.lineTo(ax + 0.5, H);
    ctx.stroke();

    const scene = this.opts.scene();
    const resolve = (c: string | undefined, d: string) => {
      if (!c) return d;
      const m: Record<string, string> = { main: C.main, alt: C.alt, good: C.good, bad: C.bad, warn: C.warn, text: C.text };
      return m[c] || c;
    };

    // bands
    for (const b of scene.bands || []) {
      ctx.fillStyle = resolve(b.color, C.alt);
      ctx.globalAlpha = 0.16;
      if (b.kind === 'h') {
        const a = this.sy(b.hi);
        const c = this.sy(b.lo);
        ctx.fillRect(0, Math.min(a, c), W, Math.abs(c - a));
      } else {
        const a = this.sx(b.lo);
        const c = this.sx(b.hi);
        ctx.fillRect(Math.min(a, c), 0, Math.abs(c - a), H);
      }
      ctx.globalAlpha = 1;
      if (b.label) {
        ctx.fillStyle = resolve(b.color, C.alt);
        ctx.textAlign = 'left';
        if (b.kind === 'h') ctx.fillText(b.label, 6, this.sy(b.hi) + 12);
        else ctx.fillText(b.label, this.sx(b.lo) + 4, 14);
      }
    }
    for (const r of scene.rects || []) {
      const px0 = this.sx(r.x0);
      const px1 = this.sx(r.x1);
      const py0 = this.sy(r.y1);
      const py1 = this.sy(r.y0);
      if (r.fill) {
        ctx.fillStyle = resolve(r.fill, C.alt);
        ctx.fillRect(Math.min(px0, px1), Math.min(py0, py1), Math.abs(px1 - px0), Math.abs(py1 - py0));
      }
      if (r.stroke) {
        ctx.strokeStyle = resolve(r.stroke, C.alt);
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.min(px0, px1) + 0.5, Math.min(py0, py1) + 0.5, Math.abs(px1 - px0), Math.abs(py1 - py0));
      }
    }
    // reference lines
    for (const l of scene.lines || []) {
      ctx.strokeStyle = resolve(l.color, C.text);
      ctx.lineWidth = l.width || 1.2;
      ctx.setLineDash(l.dash || [5, 4]);
      ctx.beginPath();
      if (l.kind === 'h') {
        const py = this.sy(l.v);
        ctx.moveTo(0, py);
        ctx.lineTo(W, py);
      } else {
        const px = this.sx(l.v);
        ctx.moveTo(px, 0);
        ctx.lineTo(px, H);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (l.label) {
        ctx.fillStyle = resolve(l.color, C.text);
        ctx.textAlign = 'left';
        if (l.kind === 'h') ctx.fillText(l.label, W - 8 - ctx.measureText(l.label).width, this.sy(l.v) - 4);
        else ctx.fillText(l.label, this.sx(l.v) + 4, H - 6);
      }
    }
    for (const s of scene.segs || []) {
      ctx.strokeStyle = resolve(s.color, C.main);
      ctx.lineWidth = s.width || 1.6;
      ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      ctx.moveTo(this.sx(s.x1), this.sy(s.y1));
      ctx.lineTo(this.sx(s.x2), this.sy(s.y2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // curves
    const colors = [C.main, C.alt, C.good, C.warn];
    (scene.curves || []).forEach((cv2, ci) => {
      ctx.strokeStyle = resolve(cv2.color, colors[ci % colors.length]);
      ctx.lineWidth = cv2.width || 2.2;
      ctx.setLineDash(cv2.dash || []);
      ctx.lineJoin = 'round';
      const n = Math.max(200, Math.min(1600, Math.round(W * 1.5)));
      const dx = (this.x1 - this.x0) / n;
      const yr = this.y1 - this.y0;
      let pen = false;
      let prevY = NaN;
      let prevPy = 0;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const x = this.x0 + i * dx;
        let ok = true;
        if (cv2.domain && (x < cv2.domain[0] || x > cv2.domain[1])) ok = false;
        if (ok && cv2.skip) for (const [a, b] of cv2.skip) if (x > a && x < b) ok = false;
        let y = NaN;
        if (ok) {
          try {
            y = cv2.f(x);
          } catch {
            y = NaN;
          }
        }
        if (!Number.isFinite(y) || Math.abs(y) > 1e6 * Math.max(1, yr)) {
          pen = false;
          prevY = NaN;
          continue;
        }
        const py = this.sy(y);
        if (pen && Number.isFinite(prevY)) {
          // break at asymptotes: huge jump with sign flip, or jump far larger than the viewport
          const jump = Math.abs(y - prevY);
          if (jump > yr * 1.2 && (y * prevY < 0 || jump > yr * 4)) {
            pen = false;
          }
        }
        if (!pen) {
          ctx.moveTo(i === 0 ? 0 : this.sx(x), Math.max(-5e4, Math.min(5e4, py)));
          pen = true;
        } else {
          ctx.lineTo(this.sx(x), Math.max(-5e4, Math.min(5e4, py)));
        }
        prevY = y;
        prevPy = py;
      }
      void prevPy;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // points
    for (const p of scene.points || []) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      const px = this.sx(p.x);
      const py = this.sy(p.y);
      const r = p.r || 5;
      const c = resolve(p.color, C.bad);
      ctx.lineWidth = 2;
      ctx.strokeStyle = c;
      if (p.kind === 'cross') {
        ctx.beginPath();
        ctx.moveTo(px - r, py - r);
        ctx.lineTo(px + r, py + r);
        ctx.moveTo(px + r, py - r);
        ctx.lineTo(px - r, py + r);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        if (p.kind === 'open') {
          ctx.fillStyle = C.bg;
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = c;
          ctx.fill();
        }
      }
      if (p.label) {
        ctx.fillStyle = c;
        ctx.textAlign = 'left';
        ctx.fillText(p.label, px + r + 4, py - r - 2);
      }
    }
    for (const t of scene.texts || []) {
      ctx.fillStyle = resolve(t.color, C.text);
      ctx.textAlign = t.align || 'left';
      ctx.fillText(t.text, this.sx(t.x), this.sy(t.y));
    }

    // handle
    const hd = this.opts.handle?.();
    if (hd && Number.isFinite(hd.x)) {
      const px = this.sx(hd.x);
      ctx.strokeStyle = C.warn;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.warn;
      ctx.beginPath();
      ctx.moveTo(px, H - 2);
      ctx.lineTo(px - 9, H - 18);
      ctx.lineTo(px + 9, H - 18);
      ctx.closePath();
      ctx.fill();
      if (hd.label) {
        ctx.textAlign = px > W - 90 ? 'right' : 'left';
        ctx.fillText(hd.label, px + (px > W - 90 ? -6 : 6), 14);
      }
    }
  }
}

/** Build a canvas + zoom toolbar inside `host`. Returns the GView. */
export function mountGraph(
  host: HTMLElement,
  opts: GViewOpts & { height?: number; caption?: string }
): GView {
  host.classList.add('mxg-host');
  const cv = document.createElement('canvas');
  cv.className = 'mxg-canvas';
  cv.style.height = `${opts.height || 320}px`;
  cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', opts.caption || 'Interactive graph — drag to pan, scroll or pinch to zoom, double-click to reset');
  const bar = document.createElement('div');
  bar.className = 'mxg-bar';
  host.append(cv, bar);
  const gv = new GView(cv, opts);
  const mk = (txt: string, tip: string, fn: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = txt;
    b.title = tip;
    b.setAttribute('aria-label', tip);
    b.onclick = fn;
    bar.appendChild(b);
  };
  mk('＋', 'Zoom in', () => gv.zoomBy(0.7));
  mk('－', 'Zoom out', () => gv.zoomBy(1 / 0.7));
  mk('⟲', 'Reset view', () => gv.reset());
  const hint = document.createElement('span');
  hint.className = 'mxg-hint';
  hint.textContent = 'Drag to pan · scroll / pinch to zoom · double-tap to reset';
  bar.appendChild(hint);
  requestAnimationFrame(() => gv.draw());
  return gv;
}
