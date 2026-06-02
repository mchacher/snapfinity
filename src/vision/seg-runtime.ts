import * as ort from 'onnxruntime-web/webgpu';
import { SEG_SIZE, rgbaToTensor } from './segment';
import { pickExecutionProviders } from './providers';

let sessionPromise: Promise<ort.InferenceSession> | null = null;

/**
 * Lazily create the u2netp session (onnxruntime-web). The model is self-hosted under
 * `public/models/` and the WASM runtime under `/ort/` (copied by vite-plugin-static-copy) so
 * everything works offline. The WebGPU backend reuses the same JSEP WASM glue, so `wasmPaths`
 * still points here. `numThreads = 1` keeps the WASM fallback single-threaded, which avoids
 * needing cross-origin isolation (COOP/COEP) that static hosts usually don't set.
 */
function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`;
    ort.env.wasm.numThreads = 1;
    const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    sessionPromise = ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/u2netp.onnx`, {
      executionProviders: pickExecutionProviders(hasWebGpu),
    });
  }
  return sessionPromise;
}

/** Run u2netp on a SEG_SIZE×SEG_SIZE RGBA buffer → raw saliency map (SEG_SIZE² floats). */
export async function runSaliency(seg320: Uint8ClampedArray): Promise<Float32Array> {
  const session = await getSession();
  const tensor = rgbaToTensor(seg320);
  const feeds = {
    [session.inputNames[0]]: new ort.Tensor('float32', tensor, [1, 3, SEG_SIZE, SEG_SIZE]),
  };
  const out = await session.run(feeds);
  return out[session.outputNames[0]].data as Float32Array;
}
