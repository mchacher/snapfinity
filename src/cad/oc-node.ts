import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { setOC } from 'replicad';

let initialized = false;

/**
 * Initialise OpenCascade for replicad in a Node / Vitest environment.
 *
 * The single OC build mixes CJS (`__dirname`) with an ESM `export default`, so Node loads
 * it as ESM and `__dirname` is missing. We rewrite the export to CommonJS and `require` it
 * from a context where `__dirname` exists. This is a **node-only** shim — the browser uses
 * the unmodified build (wired in a later iteration).
 */
export async function initOpenCascadeForNode(): Promise<void> {
  if (initialized) return;

  const require = createRequire(import.meta.url);
  const ocSrcPath = fileURLToPath(
    new URL('../../node_modules/replicad-opencascadejs/src/replicad_single.js', import.meta.url),
  );
  const cjsSource = readFileSync(ocSrcPath, 'utf8').replace(
    /export default Module;?\s*$/,
    'module.exports = Module;',
  );
  const cjsPath = join(tmpdir(), 'replicad_single_node.cjs');
  writeFileSync(cjsPath, cjsSource);

  const ocFactory = require(cjsPath) as (opts: { locateFile: () => string }) => Promise<unknown>;
  const wasmPath = fileURLToPath(
    new URL('../../node_modules/replicad-opencascadejs/src/replicad_single.wasm', import.meta.url),
  );

  const oc = await ocFactory({ locateFile: () => wasmPath });
  setOC(oc as Parameters<typeof setOC>[0]);
  initialized = true;
}
