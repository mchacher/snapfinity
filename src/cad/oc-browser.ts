import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import wasmUrl from 'replicad-opencascadejs/src/replicad_single.wasm?url';
import { setOC } from 'replicad';

type OcFactory = (options: { locateFile: () => string }) => Promise<unknown>;

let initPromise: Promise<void> | null = null;

/**
 * Initialise OpenCascade for replicad in the browser. The wasm is loaded via Vite's `?url`
 * import; the browser build needs no `__dirname` shim (that's the node path — see oc-node.ts).
 * Idempotent: the wasm + module are loaded once.
 */
export function initOcForBrowser(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const oc = await (opencascade as unknown as OcFactory)({ locateFile: () => wasmUrl });
      setOC(oc as Parameters<typeof setOC>[0]);
    })();
  }
  return initPromise;
}
