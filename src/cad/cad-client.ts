import type { Point2D } from '../core/offset';
import type { BinParams } from './bin';
import type { ExportFormat, MeshArrays, NotchConfig, WorkerRequest, WorkerResponse } from './cad-messages';

/**
 * Main-thread client for the CAD worker. Owns a lazy `Worker` singleton and routes each reply
 * back to its caller by `id`. All replicad work happens in the worker, so importing this on the
 * main thread pulls **no replicad** into the main bundle (the imports above are type-only).
 *
 * Staleness is not decided here — `useBin` ignores a resolved build from a superseded effect.
 */

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };

/** `Omit` that distributes over a union (plain `Omit` would collapse to the shared keys). */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./cad.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      if (msg.type === 'error') entry.reject(new Error(msg.message));
      else if (msg.type === 'built') entry.resolve({ positions: msg.positions, normals: msg.normals, index: msg.index });
      else entry.resolve(msg.blob);
    };
    worker.onerror = (event) => {
      const error = new Error(event.message || 'CAD worker crashed');
      for (const entry of pending.values()) entry.reject(error);
      pending.clear();
    };
  }
  return worker;
}

function request<T>(payload: DistributiveOmit<WorkerRequest, 'id'>): Promise<T> {
  const id = nextId++;
  const w = getWorker();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    w.postMessage({ ...payload, id } as WorkerRequest);
  });
}

/** Build the bin off the main thread → transferable mesh arrays. */
export function buildBin(
  binParams: BinParams,
  footprint: Point2D[] | null,
  depthMm: number,
  notch: NotchConfig,
): Promise<MeshArrays> {
  return request<MeshArrays>({ type: 'build', binParams, footprint, depthMm, notch });
}

/** Export the worker's current shape (STL/STEP) → Blob. */
export function exportBin(format: ExportFormat): Promise<Blob> {
  return request<Blob>({ type: 'export', format });
}
