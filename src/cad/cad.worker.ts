import type { Shape3D } from 'replicad';
import { initOcForBrowser } from './oc-browser';
import { makeBin } from './bin';
import { makeBinWithPocket } from './pocket';
import { cutGripNotches } from './notches';
import { meshToArrays } from './mesh-arrays';
import { shapeToStl, shapeToStep } from './export';
import type { WorkerRequest, WorkerResponse } from './cad-messages';

/** Minimal worker-scope typing (avoids adding the "webworker" lib to tsconfig). */
interface WorkerCtx {
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => unknown) | null;
}
const ctx = self as unknown as WorkerCtx;

// The live preview is meshed coarser than the export (which has its own fine tolerance) — at
// 0.1 mm it's still smooth on screen but meshes ~2× faster, so slider drags feel snappier.
const PREVIEW_TOLERANCE_MM = 0.1;

// The OpenCascade Shape3D is a live WASM handle bound to THIS worker's OC instance, so it can't
// cross the thread boundary. The worker keeps it and is the only place that can mesh it OR
// export it — which is why export runs here too.
let currentShape: Shape3D | null = null;

// Cache the base bin (feet + body + pocket), keyed by everything EXCEPT the grip. Moving the
// grip's X/Y then reuses the cached base and only re-cuts the two cheap scoops — the expensive
// pocket boolean isn't re-run on every slider tick.
let base: { sig: string; shape: Shape3D } | null = null;

ctx.onmessage = (event) => {
  const msg = event.data;
  void (async () => {
    try {
      await initOcForBrowser();
      if (msg.type === 'build') {
        const fp = msg.footprint;
        const baseSig = JSON.stringify({ p: msg.binParams, f: fp, d: msg.depthMm });
        if (!base || base.sig !== baseSig) {
          const shape =
            fp && fp.length >= 3
              ? makeBinWithPocket(msg.binParams, fp, { depthMm: msg.depthMm })
              : makeBin(msg.binParams);
          base = { sig: baseSig, shape };
        }
        currentShape = msg.notch.enabled
          ? cutGripNotches(base.shape.clone(), msg.binParams, msg.notch, { footprint: fp, depthMm: msg.depthMm })
          : base.shape;
        const { positions, normals, index } = meshToArrays(currentShape, PREVIEW_TOLERANCE_MM);
        ctx.postMessage({ type: 'built', id: msg.id, positions, normals, index }, [
          positions.buffer,
          normals.buffer,
          index.buffer,
        ]);
      } else {
        if (!currentShape) throw new Error('no shape to export');
        const blob = msg.format === 'stl' ? shapeToStl(currentShape) : shapeToStep(currentShape);
        ctx.postMessage({ type: 'exported', id: msg.id, blob });
      }
    } catch (err) {
      ctx.postMessage({ type: 'error', id: msg.id, message: String((err as Error)?.message ?? err) });
    }
  })();
};
