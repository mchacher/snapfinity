// Sample generator: build Gridfinity bins with replicad (headless) and write an STL you
// can open in a slicer. Run: `node tools/cad/preview.mjs`. Output: out/snapfinity-2x1.stl
//
// NOTE: this mirrors the model + constants in src/cad/bin.ts (kept in plain JS so it runs
// without a TypeScript loader). The canonical, tested model is src/cad/bin.ts; once the UI
// (it 4) generates bins in the browser, this tool can be retired.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { setOC, drawRoundedRectangle } from 'replicad';

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
const ocFactory = require(cjsPath);
const wasmPath = fileURLToPath(
  new URL('../../node_modules/replicad-opencascadejs/src/replicad_single.wasm', import.meta.url),
);

const OC = await ocFactory({ locateFile: () => wasmPath });
setOC(OC);

const PITCH = 42;
const GAP = 0.5;
const CORNER_R = 3.75;
const BASE_H = 4.75;
const WALL = 1.2;
const FLOOR = 1.0;

function makeBin(cols, rows, heightUnits) {
  const w = cols * PITCH - GAP;
  const d = rows * PITCH - GAP;
  const h = BASE_H + heightUnits * 7;
  let body = drawRoundedRectangle(w, d, CORNER_R).sketchOnPlane('XY').extrude(h);
  body = body.chamfer(BASE_H * 0.6, (e) => e.inPlane('XY', 0));
  const cavity = drawRoundedRectangle(w - 2 * WALL, d - 2 * WALL, CORNER_R)
    .sketchOnPlane('XY', FLOOR)
    .extrude(h);
  return body.cut(cavity);
}

const bin = makeBin(2, 1, 3);
const [min, max] = bin.boundingBox.bounds;
const dims = [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((n) => n.toFixed(2));
const out = fileURLToPath(new URL('../../out/snapfinity-2x1.stl', import.meta.url));
writeFileSync(out, Buffer.from(await bin.blobSTL().arrayBuffer()));
console.log(`2x1 h3 bin: ${dims.join(' x ')} mm  ->  ${out}`);
