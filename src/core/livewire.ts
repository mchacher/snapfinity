import type { Point2D } from './offset';

/**
 * Live-wire / "Intelligent Scissors" (Mortensen–Barrett) — the engine behind a **magnetic lasso**.
 * Pure: takes a grayscale image, builds an edge **cost map** (cheap to traverse where the gradient
 * is strong), and answers shortest-path queries from a movable **seed** to any pixel. As the cursor
 * moves the boundary snaps to nearby edges; clicking drops an anchor and moves the seed.
 *
 * No opencv — a plain Sobel + Dijkstra (binary heap), so it's unit-testable and WASM-free. Runs at
 * a downscaled working resolution (the caller scales coordinates), so a full re-solve per click is
 * fast and `pathTo` per mouse-move is just a back-walk of the predecessor array.
 */

const SQRT2 = Math.SQRT2;
const COST_FLOOR = 0.02; // keep every step > 0 so equal-edge paths still prefer the shorter one

/** Minimal binary min-heap over (priority, value) in parallel typed arrays, with lazy deletion. */
class MinHeap {
  private pri: Float64Array;
  private val: Int32Array;
  private n = 0;

  constructor(capacity: number) {
    const cap = Math.max(16, capacity);
    this.pri = new Float64Array(cap);
    this.val = new Int32Array(cap);
  }

  get size(): number {
    return this.n;
  }

  private grow(): void {
    const pri = new Float64Array(this.pri.length * 2);
    const val = new Int32Array(this.val.length * 2);
    pri.set(this.pri);
    val.set(this.val);
    this.pri = pri;
    this.val = val;
  }

  push(p: number, v: number): void {
    if (this.n === this.pri.length) this.grow();
    let i = this.n++;
    this.pri[i] = p;
    this.val[i] = v;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.pri[parent] <= this.pri[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  /** Pop the minimum value (call only when `size > 0`). */
  pop(): number {
    const top = this.val[0];
    this.n--;
    if (this.n > 0) {
      this.pri[0] = this.pri[this.n];
      this.val[0] = this.val[this.n];
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.n && this.pri[l] < this.pri[smallest]) smallest = l;
        if (r < this.n && this.pri[r] < this.pri[smallest]) smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    const p = this.pri[a];
    this.pri[a] = this.pri[b];
    this.pri[b] = p;
    const v = this.val[a];
    this.val[a] = this.val[b];
    this.val[b] = v;
  }
}

export interface LiveWire {
  readonly width: number;
  readonly height: number;
  /** The per-pixel edge cost (low on strong edges) — exposed for tests. */
  readonly cost: Float32Array;
  /** Re-solve shortest paths from a new seed pixel (clamped into the grid). */
  setSeed(x: number, y: number): void;
  /** Shortest path (working px) from the current seed to (x, y), **seed-first**. */
  pathTo(x: number, y: number): Point2D[];
}

/** Sobel gradient magnitude → normalised edge cost: `1` on flat areas, `~COST_FLOOR` on hard edges. */
export function edgeCost(gray: Float32Array, width: number, height: number): Float32Array {
  const grad = new Float32Array(width * height);
  let max = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const tl = gray[i - width - 1];
      const tm = gray[i - width];
      const tr = gray[i - width + 1];
      const ml = gray[i - 1];
      const mr = gray[i + 1];
      const bl = gray[i + width - 1];
      const bm = gray[i + width];
      const br = gray[i + width + 1];
      const gx = tr + 2 * mr + br - tl - 2 * ml - bl;
      const gy = bl + 2 * bm + br - tl - 2 * tm - tr;
      const g = Math.sqrt(gx * gx + gy * gy);
      grad[i] = g;
      if (g > max) max = g;
    }
  }
  const cost = new Float32Array(width * height);
  const inv = max > 0 ? 1 / max : 0;
  for (let i = 0; i < cost.length; i += 1) cost[i] = COST_FLOOR + (1 - COST_FLOOR) * (1 - grad[i] * inv);
  return cost;
}

/** Build a live-wire over a grayscale (0…255) working image. */
export function buildLiveWire(gray: Float32Array, width: number, height: number): LiveWire {
  const cost = edgeCost(gray, width, height);
  const n = width * height;
  const dist = new Float64Array(n);
  const prev = new Int32Array(n);
  let seed = -1;

  const clamp = (v: number, hi: number) => (v < 0 ? 0 : v > hi ? hi : v);

  const setSeed = (x: number, y: number): void => {
    const sx = clamp(Math.round(x), width - 1);
    const sy = clamp(Math.round(y), height - 1);
    seed = sy * width + sx;
    dist.fill(Infinity);
    prev.fill(-1);
    dist[seed] = 0;
    const heap = new MinHeap(n);
    heap.push(0, seed);
    while (heap.size > 0) {
      const u = heap.pop();
      const du = dist[u];
      const ux = u % width;
      const uy = (u / width) | 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        const vy = uy + dy;
        if (vy < 0 || vy >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const vx = ux + dx;
          if (vx < 0 || vx >= width) continue;
          const v = vy * width + vx;
          const w = cost[v] * (dx !== 0 && dy !== 0 ? SQRT2 : 1);
          const nd = du + w;
          if (nd < dist[v]) {
            dist[v] = nd;
            prev[v] = u;
            heap.push(nd, v);
          }
        }
      }
    }
  };

  const pathTo = (x: number, y: number): Point2D[] => {
    if (seed < 0) return [];
    const tx = clamp(Math.round(x), width - 1);
    const ty = clamp(Math.round(y), height - 1);
    let cur = ty * width + tx;
    if (prev[cur] === -1 && cur !== seed) return [];
    const rev: Point2D[] = [];
    let guard = 0;
    while (cur !== -1 && guard <= n) {
      rev.push([cur % width, (cur / width) | 0]);
      if (cur === seed) break;
      cur = prev[cur];
      guard += 1;
    }
    rev.reverse(); // seed-first
    return rev;
  };

  return {
    width,
    height,
    cost,
    setSeed,
    pathTo,
  };
}
