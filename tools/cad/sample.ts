// Generate sample Gridfinity bin STLs from the REAL model (src/cad/bin.ts) — no duplication.
// Run: npm run sample   (uses tsx). Output: out/*.stl (gitignored).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initOpenCascadeForNode } from '../../src/cad/oc-node';
import { makeBin, type BinParams } from '../../src/cad/bin';

await initOpenCascadeForNode();

const samples: { name: string; params: BinParams }[] = [
  { name: 'snapfinity-2x1', params: { cols: 2, rows: 1, heightUnits: 3 } },
  { name: 'snapfinity-1x1-pitch36', params: { cols: 1, rows: 1, heightUnits: 3, pitchMm: 36 } },
  { name: 'snapfinity-3x2-nolip', params: { cols: 3, rows: 2, heightUnits: 5, includeLip: false } },
];

for (const { name, params } of samples) {
  const out = fileURLToPath(new URL(`../../out/${name}.stl`, import.meta.url));
  writeFileSync(out, Buffer.from(await makeBin(params).blobSTL().arrayBuffer()));
  console.log('wrote', out);
}
